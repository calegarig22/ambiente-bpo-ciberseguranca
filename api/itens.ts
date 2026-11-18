import { ESTADOS, areasDoUsuario, ehArea, podeVerArea, type Estado, type Item, type Tipo } from '../src/lib/dominio.js'
import { sql } from './_lib/banco.js'
import { erro, json, lerJson } from './_lib/resposta.js'
import { exigirLogin } from './_lib/sessao.js'

// Itens do inventário. Toda consulta respeita as áreas do usuário:
// o Admin vê e altera todas; o coordenador, só a dele.

// Tamanho máximo de cada texto, para ninguém encher o banco sem querer
const LIMITE = { nome: 200, detalhe: 2000, curto: 120 }

// Busca um item pelo id, já com a informação "tem print?"
async function buscarItem(id: string): Promise<Item | null> {
  const linhas = await sql()`
    select i.id, i.area, i.tipo, i.nome, i.detalhe, i.estado, i.pai_id, i.ferramenta,
           i.fornecedor, i.versao, i.ordem, i.tipo_ativo, i.dono, i.localizacao, i.criticidade, i.classificacao,
           exists(select 1 from prints p where p.item_id = i.id) as tem_print
    from itens i where i.id = ${id}
  `
  return (linhas[0] as Item | undefined) ?? null
}

const TIPOS_ATIVO = ['servidor', 'estacao', 'rede', 'nuvem', 'aplicacao', 'banco_dados', 'outro']
const CRITICIDADES = ['alta', 'media', 'baixa']
const CLASSIFICACOES = ['publico', 'interno', 'confidencial', 'restrito']

// Valor de uma lista fechada, ou null (vazio/desconhecido)
function opcao(valor: unknown, opcoes: string[]): string | null {
  return typeof valor === 'string' && opcoes.includes(valor) ? valor : null
}

// Aplica os campos que só os sistemas têm (ferramenta, fornecedor, versão e dados de inventário)
function camposDeSistema(novo: Item, campos: Record<string, unknown>) {
  const curto = (v: unknown) => (typeof v === 'string' ? v.trim().slice(0, LIMITE.curto) : undefined)
  for (const c of ['ferramenta', 'fornecedor', 'versao', 'dono', 'localizacao'] as const) {
    const v = curto(campos[c])
    if (v !== undefined) novo[c] = v
  }
  if ('tipo_ativo' in campos) novo.tipo_ativo = opcao(campos.tipo_ativo, TIPOS_ATIVO) as Item['tipo_ativo']
  if ('criticidade' in campos) novo.criticidade = opcao(campos.criticidade, CRITICIDADES) as Item['criticidade']
  if ('classificacao' in campos) novo.classificacao = opcao(campos.classificacao, CLASSIFICACOES) as Item['classificacao']
}

function ehUuid(valor: unknown): valor is string {
  return typeof valor === 'string' && /^[0-9a-f-]{36}$/i.test(valor)
}

function ehEstado(valor: unknown): valor is Estado {
  return ESTADOS.includes(valor as Estado)
}

// GET /api/itens: todos os itens das áreas que o usuário pode ver
export async function GET(req: Request): Promise<Response> {
  const usuario = await exigirLogin(req)
  if (usuario instanceof Response) return usuario

  const areas = areasDoUsuario(usuario)
  const itens = await sql()`
    select i.id, i.area, i.tipo, i.nome, i.detalhe, i.estado, i.pai_id, i.ferramenta,
           i.fornecedor, i.versao, i.ordem, i.tipo_ativo, i.dono, i.localizacao, i.criticidade, i.classificacao,
           exists(select 1 from prints p where p.item_id = i.id) as tem_print
    from itens i
    where i.area = any(${areas}::text[])
    order by i.ordem, i.criado_em
  `
  return json({ itens })
}

// POST /api/itens  { acao, ... }
//   editar   { id, campos: { nome?, detalhe?, estado?, ferramenta?, fornecedor?, versao?,
//                             tipo_ativo?, dono?, localizacao?, criticidade?, classificacao? } }
//   criar    { area, tipo, pai_id, nome, estado, detalhe?, ...campos de sistema? }
//   remover  { id }   remove o item e tudo que está dentro dele
export async function POST(req: Request): Promise<Response> {
  const usuario = await exigirLogin(req)
  if (usuario instanceof Response) return usuario

  const corpo = await lerJson(req)
  if (!corpo) return erro('Pedido inválido.', 400)

  if (corpo.acao === 'criar') {
    const { area, tipo, pai_id, estado } = corpo
    const nome = typeof corpo.nome === 'string' ? corpo.nome.trim() : ''

    if (typeof area !== 'string' || !ehArea(area)) return erro('Área inválida.', 400)
    if (!podeVerArea(usuario, area)) return erro('Você não tem acesso a essa área.', 403)
    if (tipo !== 'sistema' && tipo !== 'config' && tipo !== 'regra') return erro('Tipo inválido.', 400)
    if (!nome) return erro('Dê um nome ao item antes de adicionar.', 400)
    if (nome.length > LIMITE.nome) return erro(`O nome pode ter até ${LIMITE.nome} caracteres.`, 400)
    if (!ehEstado(estado)) return erro('Estado inválido.', 400)

    // Validação do pai: sistema não tem pai; configuração fica dentro de um
    // sistema e regra dentro de uma configuração, sempre na mesma área.
    let pai: string | null = null
    if (tipo !== 'sistema') {
      if (!ehUuid(pai_id)) return erro('Escolha a que sistema ou configuração este item pertence.', 400)
      const itemPai = await buscarItem(pai_id)
      const tipoPaiCerto: Tipo = tipo === 'config' ? 'sistema' : 'config'
      if (!itemPai || itemPai.area !== area || itemPai.tipo !== tipoPaiCerto) {
        return erro(
          tipo === 'config'
            ? 'Uma configuração precisa estar dentro de um sistema da mesma área.'
            : 'Uma regra precisa estar dentro de uma configuração da mesma área.',
          400,
        )
      }
      pai = itemPai.id
    }

    // Sistemas podem já vir com os dados de inventário (ex.: lista lida pela IA)
    const extra = { ferramenta: '', fornecedor: '', versao: '', dono: '', localizacao: '' } as Item
    extra.tipo_ativo = null
    extra.criticidade = null
    extra.classificacao = null
    if (tipo === 'sistema') camposDeSistema(extra, corpo)
    const detalhe = typeof corpo.detalhe === 'string' ? corpo.detalhe.trim().slice(0, LIMITE.detalhe) : ''

    // O item novo vai para o fim da lista (maior "ordem" + 1)
    const linhas = await sql()`
      insert into itens (area, tipo, nome, detalhe, estado, pai_id, ordem, criado_por,
                         ferramenta, fornecedor, versao, tipo_ativo, dono, localizacao, criticidade, classificacao)
      values (${area}, ${tipo}, ${nome}, ${detalhe}, ${estado}, ${pai},
              (select coalesce(max(ordem), 0) + 1 from itens), ${usuario.id},
              ${extra.ferramenta}, ${extra.fornecedor}, ${extra.versao}, ${extra.tipo_ativo}, ${extra.dono},
              ${extra.localizacao}, ${extra.criticidade}, ${extra.classificacao})
      returning id
    `
    const item = await buscarItem(linhas[0].id as string)
    return json({ item }, 201)
  }

  // As outras ações mexem num item que já existe
  if (!ehUuid(corpo.id)) return erro('Item não encontrado.', 404)
  const atual = await buscarItem(corpo.id)
  if (!atual) return erro('Item não encontrado.', 404)
  if (!podeVerArea(usuario, atual.area)) return erro('Você não tem acesso a essa área.', 403)

  if (corpo.acao === 'editar') {
    const campos = (corpo.campos ?? {}) as Record<string, unknown>
    const novo = { ...atual }

    // Só aceita os campos conhecidos; ferramenta, fornecedor e versão só valem para sistemas
    if (typeof campos.nome === 'string') novo.nome = campos.nome.trim()
    if (typeof campos.detalhe === 'string') novo.detalhe = campos.detalhe.trim()
    if (campos.estado !== undefined) {
      if (!ehEstado(campos.estado)) return erro('Estado inválido.', 400)
      novo.estado = campos.estado
    }
    if (atual.tipo === 'sistema') camposDeSistema(novo, campos)

    if (!novo.nome) return erro('O nome não pode ficar vazio.', 400)
    if (novo.nome.length > LIMITE.nome) return erro(`O nome pode ter até ${LIMITE.nome} caracteres.`, 400)
    if (novo.detalhe.length > LIMITE.detalhe) return erro(`O texto pode ter até ${LIMITE.detalhe} caracteres.`, 400)

    await sql()`
      update itens set nome = ${novo.nome}, detalhe = ${novo.detalhe}, estado = ${novo.estado},
        ferramenta = ${novo.ferramenta}, fornecedor = ${novo.fornecedor}, versao = ${novo.versao},
        tipo_ativo = ${novo.tipo_ativo}, dono = ${novo.dono}, localizacao = ${novo.localizacao},
        criticidade = ${novo.criticidade}, classificacao = ${novo.classificacao}
      where id = ${atual.id}
    `
    return json({ item: await buscarItem(atual.id) })
  }

  if (corpo.acao === 'remover') {
    // "on delete cascade" no banco remove os filhos, netos e os prints deles
    await sql()`delete from itens where id = ${atual.id}`
    return json({ ok: true })
  }

  return erro('Ação desconhecida.', 400)
}
