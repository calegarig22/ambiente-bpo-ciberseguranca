import { TIPOS_LEITURA } from './dominio'

// Pequenas funções de formatação para a interface

// 1536 → "1,5 KB"; 2400000 → "2,3 MB"
export function tamanho(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`
}

// "2027-03-12" → "12/03/2027"
export function dataBr(iso: string | null): string {
  if (!iso) return ''
  const [a, m, d] = iso.split('-')
  return `${d}/${m}/${a}`
}

// Tipo do arquivo. Alguns sistemas não informam o tipo do DOCX ou do CSV,
// então olhamos também a extensão do nome.
export function tipoDoArquivo(arquivo: File): string {
  if (TIPOS_LEITURA[arquivo.type]) return arquivo.type
  const extensao = arquivo.name.split('.').pop()?.toLowerCase()
  const porExtensao: Record<string, string> = {
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    csv: 'text/csv',
    txt: 'text/plain',
  }
  return porExtensao[extensao ?? ''] ?? ''
}
