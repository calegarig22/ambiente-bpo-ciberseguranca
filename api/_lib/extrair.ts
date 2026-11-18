import { inflateRawSync } from 'node:zlib'

// Tira o texto de arquivos DOCX e XLSX sem biblioteca extra.
// Os dois formatos são, por dentro, um .zip com arquivos XML. Aqui abrimos
// o .zip, pegamos os XML que interessam e jogamos fora as marcações.

// Lê os arquivos de dentro de um .zip. Devolve nome → conteúdo.
function abrirZip(zip: Buffer, quer: (nome: string) => boolean): Map<string, Buffer> {
  const saida = new Map<string, Buffer>()

  // O "diretório central" do zip fica no fim; procuramos a assinatura dele de trás para frente
  let fim = -1
  for (let i = zip.length - 22; i >= Math.max(0, zip.length - 65557); i--) {
    if (zip.readUInt32LE(i) === 0x06054b50) {
      fim = i
      break
    }
  }
  if (fim < 0) throw new Error('Arquivo compactado inválido.')

  const total = zip.readUInt16LE(fim + 10)
  let p = zip.readUInt32LE(fim + 16) // início do diretório central
  for (let n = 0; n < total; n++) {
    if (zip.readUInt32LE(p) !== 0x02014b50) break
    const metodo = zip.readUInt16LE(p + 10)
    const tamanhoComprimido = zip.readUInt32LE(p + 20)
    const tamNome = zip.readUInt16LE(p + 28)
    const tamExtra = zip.readUInt16LE(p + 30)
    const tamComentario = zip.readUInt16LE(p + 32)
    const local = zip.readUInt32LE(p + 42)
    const nome = zip.toString('utf8', p + 46, p + 46 + tamNome)

    if (quer(nome)) {
      // Cabeçalho local do arquivo, logo antes dos dados
      const inicio = local + 30 + zip.readUInt16LE(local + 26) + zip.readUInt16LE(local + 28)
      const dados = zip.subarray(inicio, inicio + tamanhoComprimido)
      saida.set(nome, metodo === 8 ? inflateRawSync(dados) : Buffer.from(dados))
    }
    p += 46 + tamNome + tamExtra + tamComentario
  }
  return saida
}

// Troca as entidades do XML (&amp; etc.) pelos caracteres
function desescapar(t: string): string {
  return t
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, '&')
}

// DOCX → texto, um parágrafo por linha
export function textoDoDocx(arquivo: Buffer): string {
  const xml = abrirZip(arquivo, (n) => n === 'word/document.xml').get('word/document.xml')
  if (!xml) throw new Error('Não achei o texto dentro do DOCX.')
  return desescapar(
    xml
      .toString('utf8')
      .replace(/<w:tab\/>/g, '\t')
      .replace(/<\/w:p>/g, '\n')
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// XLSX → texto, uma linha da planilha por linha, células separadas por " | "
export function textoDoXlsx(arquivo: Buffer): string {
  const partes = abrirZip(arquivo, (n) => n === 'xl/sharedStrings.xml' || /^xl\/worksheets\/sheet\d+\.xml$/.test(n))

  // Textos repetidos ficam guardados uma vez só, em sharedStrings, e as células apontam para eles
  const compartilhados: string[] = []
  const ss = partes.get('xl/sharedStrings.xml')?.toString('utf8') ?? ''
  for (const si of ss.match(/<si>[\s\S]*?<\/si>/g) ?? []) {
    compartilhados.push(desescapar((si.match(/<t[^>]*>([\s\S]*?)<\/t>/g) ?? []).map((t) => t.replace(/<[^>]+>/g, '')).join('')))
  }

  const linhas: string[] = []
  const planilhas = [...partes.keys()].filter((n) => n.includes('worksheets')).sort()
  for (const nome of planilhas) {
    linhas.push(`# Planilha ${nome.match(/sheet(\d+)/)?.[1]}`)
    const xml = partes.get(nome)!.toString('utf8')
    for (const linha of xml.match(/<row[\s\S]*?<\/row>/g) ?? []) {
      const celulas = (linha.match(/<c [^>]*?(?:\/>|>[\s\S]*?<\/c>)/g) ?? []).map((c) => {
        const tipo = c.match(/ t="(\w+)"/)?.[1]
        if (tipo === 'inlineStr') return desescapar((c.match(/<t[^>]*>([\s\S]*?)<\/t>/)?.[1] ?? '').trim())
        const valor = c.match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? ''
        return tipo === 's' ? (compartilhados[Number(valor)] ?? '') : desescapar(valor)
      })
      if (celulas.some((c) => c.trim())) linhas.push(celulas.join(' | '))
    }
  }
  return linhas.join('\n')
}
