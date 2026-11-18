// Exporta o conteúdo atual do banco para a pasta docs/:
//   docs/inventario.md     inventário de sistemas/ativos, configurações e regras de cada área
//   docs/documentacao.md   fichas das políticas, infraestrutura, BIA e DRP
//   docs/arquivos/         os arquivos anexados (PDF, DOCX, imagens)
//
//   npm run exportar
//
// Serve para quem vai montar a apresentação a partir do repositório (pessoa
// ou Claude): o arquivo traz tudo que está no banco, sem precisar de acesso
// a ele nem de senha. Rode de novo e faça commit sempre que o inventário mudar.
// Não exporta nada sobre usuários (nomes, e-mails), só o inventário.
import { neon } from '@neondatabase/serverless'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import {
  AREAS,
  CATEGORIAS,
  DESCRICAO_AREA,
  INFO_CATEGORIA,
  NOME_CLASSIFICACAO,
  NOME_CRITICIDADE,
  NOME_ESTADO,
  NOME_STATUS,
  NOME_TIPO,
  NOME_TIPO_ATIVO,
  type Documento,
  type Estado,
  type Item,
} from '../src/lib/dominio.ts'

const url = process.env.DATABASE_URL
if (!url) {
  console.error('Falta DATABASE_URL no .env.local')
  process.exit(1)
}

const sql = neon(url)
const itens = (await sql`
  select i.id, i.area, i.tipo, i.nome, i.detalhe, i.estado, i.pai_id, i.ferramenta,
         i.fornecedor, i.versao, i.ordem, i.tipo_ativo, i.dono, i.localizacao, i.criticidade, i.classificacao,
         exists(select 1 from prints p where p.item_id = i.id) as tem_print
  from itens i order by i.ordem, i.criado_em
`) as Item[]

const contar = (lista: Item[], e: Estado) => lista.filter((i) => i.estado === e).length
const filhos = (id: string) => itens.filter((i) => i.pai_id === id)
// Barras verticais quebrariam as tabelas em Markdown
const limpo = (t: string) => t.replace(/\|/g, '/').replace(/\s+/g, ' ').trim()

const hoje = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
const linhas: string[] = []
const add = (...l: string[]) => linhas.push(...l)

add(
  '# Inventário do ambiente da BPO financeira',
  '',
  `> Gerado automaticamente por \`npm run exportar\` em ${hoje} (horário de Brasília), a partir do banco da aplicação.`,
  '> Não edite à mão: as mudanças se perdem na próxima exportação.',
  '> Ambiente **fictício**, criado para o projeto acadêmico de Defesa Cibernética. Ferramentas, fornecedores e versões são exemplos.',
  '',
  '## Como ler',
  '',
  '- Cada área é uma árvore de três níveis: **Sistema** (o que existe) → **Configuração** (como está ajustado) → **Regra** (o que passa a valer por causa da configuração).',
  '- Estados: **Em ordem** (ok), **Atenção** (funciona, mas tem ressalva) e **Pendente** (ainda não está como deveria).',
  '- "📎 com print" indica que existe um print anexado como evidência.',
  '',
  '## Resumo por área',
  '',
  '| Área | Descrição | Sistemas | Itens | Em ordem | Atenção | Pendente |',
  '| --- | --- | ---: | ---: | ---: | ---: | ---: |',
)
for (const a of AREAS) {
  const l = itens.filter((i) => i.area === a)
  const sis = l.filter((i) => i.tipo === 'sistema').length
  add(`| ${a} | ${DESCRICAO_AREA[a]} | ${sis} | ${l.length} | ${contar(l, 'ok')} | ${contar(l, 'atencao')} | ${contar(l, 'pendente')} |`)
}
add(
  `| **Total** | | **${itens.filter((i) => i.tipo === 'sistema').length}** | **${itens.length}** | **${contar(itens, 'ok')}** | **${contar(itens, 'atencao')}** | **${contar(itens, 'pendente')}** |`,
  '',
  '## Inventário de sistemas',
  '',
  '_Sistemas e ativos do ambiente (servidores, rede, estações, aplicações, bancos de dados, nuvem)._',
  '',
  '| Área | Sistema | Tipo | Ferramenta | Fornecedor | Versão | Dono | Localização | Classificação | Criticidade | Estado |',
  '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
)
for (const i of itens.filter((i) => i.tipo === 'sistema')) {
  add(
    `| ${i.area} | ${limpo(i.nome)} | ${i.tipo_ativo ? NOME_TIPO_ATIVO[i.tipo_ativo] : ''} | ${limpo(i.ferramenta)} | ${limpo(i.fornecedor)} | ${limpo(i.versao)} | ${limpo(i.dono)} | ${limpo(i.localizacao)} | ${i.classificacao ? NOME_CLASSIFICACAO[i.classificacao] : ''} | ${i.criticidade ? NOME_CRITICIDADE[i.criticidade] : ''} | ${NOME_ESTADO[i.estado]} |`,
  )
}

// Listas de pontos de risco: o que está pendente e o que está em atenção
for (const e of ['pendente', 'atencao'] as const) {
  const l = itens.filter((i) => i.estado === e)
  add('', `## ${e === 'pendente' ? 'Itens pendentes' : 'Itens em atenção'} (${l.length})`, '')
  for (const i of l) add(`- **${i.area}** · ${NOME_TIPO[i.tipo]}: ${limpo(i.nome)}`)
}

// Árvore completa de cada área
function escreverNo(i: Item, nivel: number) {
  const recuo = '  '.repeat(nivel)
  const extra =
    i.tipo === 'sistema'
      ? [i.tipo_ativo ? NOME_TIPO_ATIVO[i.tipo_ativo] : '', i.ferramenta, i.fornecedor, i.versao, i.criticidade ? `criticidade ${NOME_CRITICIDADE[i.criticidade].toLowerCase()}` : '']
          .filter(Boolean)
          .map(limpo)
          .join(' · ')
      : ''
  let linha = `${recuo}- **${NOME_TIPO[i.tipo]}:** ${limpo(i.nome)} — _${NOME_ESTADO[i.estado]}_`
  if (extra) linha += ` (${extra})`
  if (i.tem_print) linha += ' 📎 com print'
  add(linha)
  if (i.detalhe) add(`${recuo}  ${limpo(i.detalhe)}`)
  for (const f of filhos(i.id)) escreverNo(f, nivel + 1)
}

add('', '## Árvores por área')
for (const a of AREAS) {
  const l = itens.filter((i) => i.area === a)
  add('', `### ${a}: ${DESCRICAO_AREA[a]}`, '', `${l.length} itens: ${contar(l, 'ok')} em ordem, ${contar(l, 'atencao')} em atenção, ${contar(l, 'pendente')} pendentes.`, '')
  for (const raiz of l.filter((i) => !i.pai_id)) escreverNo(raiz, 0)
}

mkdirSync('docs', { recursive: true })
writeFileSync('docs/inventario.md', linhas.join('\n') + '\n')
console.log(`docs/inventario.md atualizado: ${itens.length} itens.`)

// ---------- Documentação e arquivos anexados ----------

// Nome de arquivo seguro a partir de um título: "Política de Senhas" → "politica-de-senhas"
const slug = (t: string) =>
  t.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)
const EXTENSAO: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'image/png': 'png',
  'image/jpeg': 'jpg',
}

const docs = (await sql`
  select id, categoria, area, titulo, resumo, responsavel, versao, status,
         to_char(revisao_em, 'DD/MM/YYYY') as revisao_em, arquivo_nome, arquivo_tipo, arquivo_tamanho
  from documentos order by categoria, area, titulo
`) as Documento[]

// Recria a pasta de arquivos do zero, para não sobrar arquivo de documento removido
rmSync('docs/arquivos', { recursive: true, force: true })

const doc: string[] = [
  '# Documentação do ambiente da BPO financeira',
  '',
  `> Gerado automaticamente por \`npm run exportar\` em ${hoje} (horário de Brasília). Não edite à mão.`,
  '> Cada documento tem uma ficha abaixo; o arquivo completo (quando existe) está no caminho indicado em **Arquivo**.',
  '',
]
for (const categoria of CATEGORIAS) {
  const lista = docs.filter((d) => d.categoria === categoria)
  doc.push(`## ${INFO_CATEGORIA[categoria].titulo} (${lista.length})`, '', `_${INFO_CATEGORIA[categoria].descricao}_`, '')
  if (!lista.length) doc.push('Nenhum documento cadastrado ainda.', '')
  for (const d of lista) {
    doc.push(`### ${limpo(d.titulo)}`, '')
    doc.push(`- **Área:** ${d.area}`)
    doc.push(`- **Status:** ${NOME_STATUS[d.status]}`)
    if (d.versao) doc.push(`- **Versão:** ${limpo(d.versao)}`)
    if (d.responsavel) doc.push(`- **Responsável:** ${limpo(d.responsavel)}`)
    if (d.revisao_em) doc.push(`- **Próxima revisão:** ${d.revisao_em}`)

    if (d.arquivo_nome && d.arquivo_tipo) {
      // Baixa o arquivo do banco e grava em docs/arquivos/<categoria>/
      const [{ b64 }] = (await sql`select encode(arquivo, 'base64') as b64 from documentos where id = ${d.id}`) as { b64: string }[]
      const caminho = `docs/arquivos/${categoria}/${d.area.toLowerCase()}-${slug(d.titulo)}-${d.id.slice(0, 6)}.${EXTENSAO[d.arquivo_tipo] ?? 'bin'}`
      mkdirSync(`docs/arquivos/${categoria}`, { recursive: true })
      writeFileSync(caminho, Buffer.from(b64, 'base64'))
      doc.push(`- **Arquivo:** [\`${caminho.replace('docs/', '')}\`](${caminho.replace('docs/', '')}) (nome original: ${limpo(d.arquivo_nome)})`)
    } else {
      doc.push('- **Arquivo:** sem arquivo anexado')
    }
    if (d.resumo) doc.push('', d.resumo.trim())
    doc.push('')
  }
}
writeFileSync('docs/documentacao.md', doc.join('\n') + '\n')
console.log(`docs/documentacao.md atualizado: ${docs.length} documentos.`)

// O inventário de ativos agora faz parte do inventário de sistemas (docs/inventario.md)
rmSync('docs/ativos.md', { force: true })
