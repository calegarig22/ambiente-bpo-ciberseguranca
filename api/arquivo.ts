import { MAX_ARQUIVO, TIPOS_ARQUIVO, podeVerArea } from '../src/lib/dominio.js'
import { sql } from './_lib/banco.js'
import { erro, json } from './_lib/resposta.js'
import { exigirLogin } from './_lib/sessao.js'
import { ehUuid } from './_lib/validacao.js'

// Arquivo anexado a um documento (PDF, DOCX ou imagem).
//   GET    /api/arquivo?id=<documento>   baixa/abre o arquivo
//   POST   /api/arquivo?id=<documento>   envia (corpo = o arquivo; cabeçalho X-Nome-Arquivo)
//   DELETE /api/arquivo?id=<documento>   tira o arquivo do documento

// Confere os primeiros bytes: o arquivo é mesmo do tipo que diz ser?
// Impede, por exemplo, um executável renomeado para .pdf.
function assinaturaConfere(tipo: string, b: Uint8Array): boolean {
  const comeca = (...bytes: number[]) => bytes.every((v, i) => b[i] === v)
  if (tipo === 'application/pdf') return comeca(0x25, 0x50, 0x44, 0x46) // %PDF
  if (tipo === 'image/png') return comeca(0x89, 0x50, 0x4e, 0x47)
  if (tipo === 'image/jpeg') return comeca(0xff, 0xd8, 0xff)
  return comeca(0x50, 0x4b, 0x03, 0x04) // DOCX é um arquivo .zip por dentro
}

// Documento do id da URL, se existir e for de uma área do usuário
async function documentoPermitido(req: Request) {
  const usuario = await exigirLogin(req)
  if (usuario instanceof Response) return usuario
  const id = new URL(req.url).searchParams.get('id')
  if (!ehUuid(id)) return erro('Documento não encontrado.', 404)
  const linhas = await sql()`select id, area from documentos where id = ${id}`
  const doc = linhas[0] as { id: string; area: string } | undefined
  if (!doc) return erro('Documento não encontrado.', 404)
  if (!podeVerArea(usuario, doc.area as never)) return erro('Você não tem acesso a essa área.', 403)
  return doc
}

export async function GET(req: Request): Promise<Response> {
  const doc = await documentoPermitido(req)
  if (doc instanceof Response) return doc

  // O banco devolve o arquivo em base64, que convertemos de volta para bytes
  const linhas = await sql()`
    select encode(arquivo, 'base64') as b64, arquivo_nome, arquivo_tipo
    from documentos where id = ${doc.id}
  `
  const a = linhas[0] as { b64: string | null; arquivo_nome: string; arquivo_tipo: string }
  if (!a.b64) return erro('Este documento ainda não tem arquivo.', 404)

  const bytes = Buffer.from(a.b64, 'base64')
  return new Response(bytes, {
    headers: {
      'Content-Type': a.arquivo_tipo,
      // "inline" abre no navegador (PDF, imagem); DOCX o navegador baixa
      'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(a.arquivo_nome)}`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      // Isola o arquivo: mesmo que tenha algo malicioso, não roda script no nosso site
      'Content-Security-Policy': 'sandbox',
    },
  })
}

export async function POST(req: Request): Promise<Response> {
  const doc = await documentoPermitido(req)
  if (doc instanceof Response) return doc

  // Só os tipos aceitos. Como nenhum deles é um tipo "simples" de formulário,
  // outro site não consegue enviar este pedido em nome do usuário (CSRF).
  const tipo = (req.headers.get('content-type') ?? '').split(';')[0].trim()
  if (!TIPOS_ARQUIVO[tipo]) return erro('Envie um arquivo PDF, DOCX, PNG ou JPG.', 415)

  const bytes = new Uint8Array(await req.arrayBuffer())
  if (!bytes.length) return erro('O arquivo está vazio.', 400)
  if (bytes.length > MAX_ARQUIVO) return erro('O arquivo passa de 4 MB.', 413)
  if (!assinaturaConfere(tipo, bytes)) return erro('O conteúdo do arquivo não confere com o tipo dele.', 415)

  const nome = decodeURIComponent(req.headers.get('x-nome-arquivo') ?? 'arquivo').replace(/[\\/\r\n"]/g, '_').slice(0, 150)
  // Envia os bytes como texto hexadecimal, que o Postgres converte para bytea
  const hex = `\\x${Buffer.from(bytes).toString('hex')}`
  await sql()`
    update documentos set arquivo = ${hex}::bytea, arquivo_nome = ${nome},
      arquivo_tipo = ${tipo}, arquivo_tamanho = ${bytes.length}
    where id = ${doc.id}
  `
  return json({ ok: true, arquivo_nome: nome, arquivo_tipo: tipo, arquivo_tamanho: bytes.length })
}

export async function DELETE(req: Request): Promise<Response> {
  const doc = await documentoPermitido(req)
  if (doc instanceof Response) return doc
  await sql()`
    update documentos set arquivo = null, arquivo_nome = null, arquivo_tipo = null, arquivo_tamanho = null
    where id = ${doc.id}
  `
  return json({ ok: true })
}
