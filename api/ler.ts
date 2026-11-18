import {
  AREAS,
  MAX_ARQUIVO,
  TIPOS_LEITURA,
  areasDoUsuario,
  type Area,
  type Leitura,
} from '../src/lib/dominio.js'
import { textoDoDocx, textoDoXlsx } from './_lib/extrair.js'
import { erro, json } from './_lib/resposta.js'
import { exigirLogin } from './_lib/sessao.js'

// POST /api/ler   (corpo = o arquivo; cabeçalho X-Dica = categoria da página ou "ativos")
//
// Lê o arquivo com a IA do Google (Gemini, plano gratuito) e devolve o que
// entendeu: a ficha de um documento ou a lista de ativos. Não grava nada:
// a pessoa confere e confirma na tela, e só então os dados são salvos.
//
// Sem a variável GEMINI_API_KEY, responde 503 e a tela cai no preenchimento manual.

// Modelos gratuitos, em ordem de preferência (os "lite" respondem mais rápido e
// costumam estar menos disputados). Se um estiver sobrecarregado
// (acontece no plano gratuito), tentamos o próximo.
function modelos(): string[] {
  const lista = [process.env.GEMINI_MODELO, 'gemini-3.1-flash-lite', 'gemini-3.5-flash-lite', 'gemini-3.8-flash']
  return [...new Set(lista.filter((m): m is string => !!m))]
}
const TEMPO_POR_MODELO = 45_000 // ms; depois disso desiste e tenta o próximo
const TEMPO_TOTAL = 110_000 // ms; abaixo do limite da função na Vercel (120 s)
const LIMITE_TEXTO = 80000 // caracteres de DOCX/XLSX/CSV enviados para a IA

// Formato exato da resposta que pedimos à IA (o Gemini segue este "esquema")
const TEXTO = { type: 'STRING' }
const ESQUEMA = {
  type: 'OBJECT',
  properties: {
    tipo: { type: 'STRING', enum: ['documento', 'ativos'] },
    documento: {
      type: 'OBJECT',
      properties: {
        categoria: { type: 'STRING', enum: ['politica', 'infraestrutura', 'bia', 'drp'] },
        area: { type: 'STRING', enum: [...AREAS] },
        titulo: TEXTO,
        versao: TEXTO,
        responsavel: TEXTO,
        status: { type: 'STRING', enum: ['rascunho', 'vigente', 'em_revisao'] },
        revisao_em: TEXTO,
        resumo: TEXTO,
      },
      required: ['categoria', 'area', 'titulo', 'versao', 'responsavel', 'status', 'revisao_em', 'resumo'],
    },
    ativos: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          nome: TEXTO,
          tipo: { type: 'STRING', enum: ['servidor', 'estacao', 'rede', 'nuvem', 'aplicacao', 'banco_dados', 'outro'] },
          ferramenta: TEXTO,
          fornecedor: TEXTO,
          versao: TEXTO,
          area: { type: 'STRING', enum: [...AREAS] },
          dono: TEXTO,
          localizacao: TEXTO,
          criticidade: { type: 'STRING', enum: ['alta', 'media', 'baixa'] },
          classificacao: { type: 'STRING', enum: ['publico', 'interno', 'confidencial', 'restrito'] },
          observacoes: TEXTO,
        },
        required: ['nome', 'tipo', 'ferramenta', 'fornecedor', 'versao', 'area', 'dono', 'localizacao', 'criticidade', 'classificacao', 'observacoes'],
      },
    },
  },
  required: ['tipo', 'ativos'],
}

// Instruções para a IA. Pedimos para nunca inventar: o que não está no arquivo fica vazio.
function instrucoes(dica: string): string {
  return `Você organiza a documentação de segurança de uma BPO financeira (empresa fictícia, trabalho acadêmico de Defesa Cibernética).
Leia o arquivo anexado e responda só com o JSON pedido.

1. Decida o "tipo":
   - "documento": uma política, norma, procedimento, descrição/diagrama de infraestrutura, BIA ou DRP.
   - "ativos": uma lista/tabela/inventário de sistemas, equipamentos, servidores, aplicações, bancos de dados ou serviços
     (cada linha vira um sistema do inventário).
   A pessoa enviou o arquivo pela página: ${dica || 'geral'}. Use isso como pista, mas o conteúdo manda.

2. Se for "documento", preencha "documento" (e deixe "ativos" vazio):
   - categoria: "politica" (políticas e normas), "infraestrutura" (redes, servidores, datacenter, nuvem, diagramas),
     "bia" (análise de impacto no negócio, processos críticos, RTO/RPO), "drp" (plano de recuperação de desastres, continuidade, backup e restauração).
   - area: GRC (governança, riscos, conformidade, LGPD, políticas gerais, fornecedores, BIA, DRP), IAM (identidades, acessos, senhas, MFA),
     Network (rede, firewall, VPN, Wi-Fi, DNS), Endpoint (estações, antivírus/EDR, e-mail, atualizações, criptografia de disco),
     SOC (monitoramento, logs, incidentes, vulnerabilidades). Na dúvida, GRC.
   - titulo: o título como está no documento (sem número de página nem código interno).
   - versao, responsavel (pessoa, cargo ou área dona do documento): só se estiverem escritos; senão "".
   - status: "vigente" se o documento diz que está aprovado/vigente/publicado; "em_revisao" se diz em revisão; senão "rascunho".
   - revisao_em: data da próxima revisão no formato AAAA-MM-DD, só se estiver escrita; senão "".
   - resumo: 2 a 4 frases em português dizendo o que o documento define (objetivo e principais regras), sem inventar.

3. Se for "ativos", liste em "ativos" TODOS os itens do arquivo (um por linha da tabela), sem pular nenhum, e deixe "documento" nulo:
   - nome exatamente como aparece; tipo mais próximo; ferramenta (produto/software, ex.: FortiGate, Windows Server 2022),
     fornecedor (fabricante, ex.: Fortinet, Microsoft) e versao só se estiverem escritos ou forem evidentes pelo nome do produto;
   - area pelo assunto (firewall, switch, VPN, DNS → Network; estações, antivírus/EDR, e-mail → Endpoint;
     Active Directory, SSO, cofre de senhas → IAM; SIEM, logs, monitoramento → SOC; ERP, backup, bancos de dados de negócio e outros → GRC);
     dono e localizacao se houver;
   - criticidade e classificacao: use o que estiver escrito; se não houver, estime pelo papel do ativo
     (dados financeiros/de clientes → alta e confidencial) e escreva "criticidade estimada" em observacoes.

Nunca invente nomes, versões, datas ou pessoas. Campo sem informação = "".`
}

// Parte do pedido com o conteúdo do arquivo: PDF e imagem vão direto;
// DOCX, XLSX, CSV e TXT viram texto antes
function conteudo(tipo: string, bytes: Buffer): object {
  if (tipo === 'application/pdf' || tipo.startsWith('image/')) {
    return { inline_data: { mime_type: tipo, data: bytes.toString('base64') } }
  }
  let texto: string
  if (tipo.includes('wordprocessingml')) texto = textoDoDocx(bytes)
  else if (tipo.includes('spreadsheetml')) texto = textoDoXlsx(bytes)
  else texto = bytes.toString('utf8')
  if (!texto.trim()) throw new Error('O arquivo não tem texto para ler.')
  return { text: `Conteúdo do arquivo:\n\n${texto.slice(0, LIMITE_TEXTO)}` }
}

// Confere a resposta da IA campo a campo, para nada estranho chegar na tela
function conferir(bruta: unknown, areasPermitidas: Area[]): Leitura {
  const r = (bruta ?? {}) as Record<string, unknown>
  const t = (v: unknown, max = 500) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
  const dentro = <T extends string>(v: unknown, opcoes: readonly T[], padrao: T): T =>
    opcoes.includes(v as T) ? (v as T) : padrao
  // Coordenador só grava na própria área: a sugestão já vem ajustada
  const area = (v: unknown): Area => (areasPermitidas.includes(v as Area) ? (v as Area) : areasPermitidas[0])

  const d = r.documento as Record<string, unknown> | null | undefined
  const ativos = Array.isArray(r.ativos) ? (r.ativos as Record<string, unknown>[]) : []
  const ehAtivos = r.tipo === 'ativos' && ativos.length > 0

  return {
    tipo: ehAtivos ? 'ativos' : 'documento',
    documento:
      !ehAtivos && d
        ? {
            categoria: dentro(d.categoria, ['politica', 'infraestrutura', 'bia', 'drp'] as const, 'politica'),
            area: area(d.area),
            titulo: t(d.titulo, 200),
            versao: t(d.versao, 40),
            responsavel: t(d.responsavel, 120),
            status: dentro(d.status, ['rascunho', 'vigente', 'em_revisao'] as const, 'rascunho'),
            revisao_em: /^\d{4}-\d{2}-\d{2}$/.test(t(d.revisao_em)) ? t(d.revisao_em) : null,
            resumo: t(d.resumo, 4000),
          }
        : null,
    ativos: ehAtivos
      ? ativos
          .map((a) => ({
            area: area(a.area),
            nome: t(a.nome, 200),
            tipo: dentro(a.tipo, ['servidor', 'estacao', 'rede', 'nuvem', 'aplicacao', 'banco_dados', 'outro'] as const, 'outro'),
            ferramenta: t(a.ferramenta, 120),
            fornecedor: t(a.fornecedor, 120),
            versao: t(a.versao, 120),
            dono: t(a.dono, 120),
            localizacao: t(a.localizacao, 120),
            criticidade: dentro(a.criticidade, ['alta', 'media', 'baixa'] as const, 'media'),
            classificacao: dentro(a.classificacao, ['publico', 'interno', 'confidencial', 'restrito'] as const, 'interno'),
            observacoes: t(a.observacoes, 2000),
          }))
          .filter((a) => a.nome)
          .slice(0, 300)
      : [],
  }
}

export async function POST(req: Request): Promise<Response> {
  const usuario = await exigirLogin(req)
  if (usuario instanceof Response) return usuario

  const chave = process.env.GEMINI_API_KEY
  if (!chave) return erro('A leitura automática ainda não foi configurada (falta GEMINI_API_KEY).', 503)

  // Mesmo cuidado do envio de arquivos: só tipos conhecidos (isso também protege contra CSRF)
  const tipo = (req.headers.get('content-type') ?? '').split(';')[0].trim()
  if (!TIPOS_LEITURA[tipo]) return erro('Envie PDF, DOCX, XLSX, CSV, TXT ou imagem (PNG, JPG, WEBP).', 415)
  const bytes = Buffer.from(await req.arrayBuffer())
  if (!bytes.length) return erro('O arquivo está vazio.', 400)
  if (bytes.length > MAX_ARQUIVO) return erro('O arquivo passa de 4 MB.', 413)

  let parte: object
  try {
    parte = conteudo(tipo, bytes)
  } catch (e) {
    return erro((e as Error).message, 400)
  }

  const dica = (req.headers.get('x-dica') ?? '').slice(0, 30)
  const pedido = JSON.stringify({
    contents: [{ role: 'user', parts: [{ text: instrucoes(dica) }, parte] }],
    generationConfig: { responseMimeType: 'application/json', responseSchema: ESQUEMA, temperature: 0.1 },
  })

  // Tenta cada modelo até um responder. Erros de "sobrecarga" ou "limite" passam para o próximo.
  const inicio = Date.now()
  let resposta: Response | null = null
  let limiteAtingido = false
  for (const modelo of modelos()) {
    const restante = TEMPO_TOTAL - (Date.now() - inicio)
    if (restante < 5_000) break
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`, {
        method: 'POST',
        // A chave vai no cabeçalho (e não na URL), para não aparecer em registros de acesso
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': chave },
        body: pedido,
        signal: AbortSignal.timeout(Math.min(TEMPO_POR_MODELO, restante)),
      })
      if (r.ok) {
        resposta = r
        break
      }
      if (r.status === 429) limiteAtingido = true
      console.error(`Gemini (${modelo}) respondeu`, r.status, (await r.text()).slice(0, 300))
    } catch (e) {
      console.error(`Gemini (${modelo}) não respondeu a tempo:`, (e as Error).name)
    }
  }

  if (!resposta) {
    return limiteAtingido
      ? erro('A IA gratuita atingiu o limite de uso por agora. Espere um minuto e tente de novo.', 429)
      : erro('A IA gratuita está sobrecarregada agora. Tente de novo em alguns minutos ou preencha à mão.', 503)
  }

  const dados = (await resposta.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] }
  const texto = dados.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? ''
  try {
    return json({ leitura: conferir(JSON.parse(texto), areasDoUsuario(usuario)) })
  } catch {
    return erro('A IA devolveu uma resposta que não deu para entender. Tente de novo.', 502)
  }
}
