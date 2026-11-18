import {
  CATEGORIAS,
  areasDoUsuario,
  ehArea,
  ehCategoria,
  podeVerArea,
  type Documento,
  type StatusDocumento,
} from '../src/lib/dominio.js'
import { sql } from './_lib/banco.js'
import { erro, json, lerJson } from './_lib/resposta.js'
import { exigirLogin } from './_lib/sessao.js'
import { data, ehUuid, texto } from './_lib/validacao.js'

// Fichas dos documentos (políticas, infraestrutura, BIA, DRP).
// O arquivo em si é enviado e baixado por /api/arquivo.

const STATUS: StatusDocumento[] = ['rascunho', 'vigente', 'em_revisao']

// Busca a ficha (sem os bytes do arquivo, que podem ser grandes)
async function buscar(id: string): Promise<Documento | null> {
  const linhas = await sql()`
    select id, categoria, area, titulo, resumo, responsavel, versao, status,
           to_char(revisao_em, 'YYYY-MM-DD') as revisao_em,
           arquivo_nome, arquivo_tipo, arquivo_tamanho, atualizado_em
    from documentos where id = ${id}
  `
  return (linhas[0] as Documento | undefined) ?? null
}

// GET /api/documentos?categoria=politica  (sem categoria: todas)
export async function GET(req: Request): Promise<Response> {
  const usuario = await exigirLogin(req)
  if (usuario instanceof Response) return usuario

  const pedida = new URL(req.url).searchParams.get('categoria') ?? ''
  const categorias = ehCategoria(pedida) ? [pedida] : CATEGORIAS
  const documentos = await sql()`
    select id, categoria, area, titulo, resumo, responsavel, versao, status,
           to_char(revisao_em, 'YYYY-MM-DD') as revisao_em,
           arquivo_nome, arquivo_tipo, arquivo_tamanho, atualizado_em
    from documentos
    where area = any(${areasDoUsuario(usuario)}::text[])
      and categoria::text = any(${categorias}::text[])
    order by categoria, area, titulo
  `
  return json({ documentos })
}

// POST /api/documentos  { acao, ... }
//   salvar   { id?, categoria, area, titulo, resumo, responsavel, versao, status, revisao_em }
//            sem id cria; com id altera
//   remover  { id }
export async function POST(req: Request): Promise<Response> {
  const usuario = await exigirLogin(req)
  if (usuario instanceof Response) return usuario
  const corpo = await lerJson(req)
  if (!corpo) return erro('Pedido inválido.', 400)

  // Se veio id, o documento precisa existir e ser de uma área do usuário
  let atual: Documento | null = null
  if (corpo.id !== undefined) {
    if (!ehUuid(corpo.id) || !(atual = await buscar(corpo.id))) return erro('Documento não encontrado.', 404)
    if (!podeVerArea(usuario, atual.area)) return erro('Você não tem acesso a essa área.', 403)
  }

  if (corpo.acao === 'remover' && atual) {
    await sql()`delete from documentos where id = ${atual.id}`
    return json({ ok: true })
  }

  if (corpo.acao !== 'salvar') return erro('Ação desconhecida.', 400)

  const categoria = atual?.categoria ?? corpo.categoria
  const area = corpo.area
  const titulo = texto(corpo.titulo, 200)
  const status = corpo.status
  if (typeof categoria !== 'string' || !ehCategoria(categoria)) return erro('Categoria inválida.', 400)
  if (typeof area !== 'string' || !ehArea(area)) return erro('Escolha a área.', 400)
  // Mover para outra área também exige acesso a ela
  if (!podeVerArea(usuario, area)) return erro('Você não tem acesso a essa área.', 403)
  if (!titulo) return erro('Dê um título ao documento.', 400)
  if (!STATUS.includes(status as StatusDocumento)) return erro('Status inválido.', 400)

  const campos = {
    resumo: texto(corpo.resumo, 4000),
    responsavel: texto(corpo.responsavel, 120),
    versao: texto(corpo.versao, 40),
    revisao: data(corpo.revisao_em),
  }

  let id = atual?.id
  if (atual) {
    await sql()`
      update documentos set area = ${area}, titulo = ${titulo}, resumo = ${campos.resumo},
        responsavel = ${campos.responsavel}, versao = ${campos.versao}, status = ${status},
        revisao_em = ${campos.revisao}
      where id = ${atual.id}
    `
  } else {
    const linhas = await sql()`
      insert into documentos (categoria, area, titulo, resumo, responsavel, versao, status, revisao_em, criado_por)
      values (${categoria}, ${area}, ${titulo}, ${campos.resumo}, ${campos.responsavel}, ${campos.versao},
              ${status}, ${campos.revisao}, ${usuario.id})
      returning id
    `
    id = linhas[0].id as string
  }
  return json({ documento: await buscar(id!) }, atual ? 200 : 201)
}
