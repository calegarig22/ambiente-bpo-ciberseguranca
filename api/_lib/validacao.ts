// Pequenas checagens usadas por várias rotas da API

// id no formato de UUID; senão o banco reclamaria com um erro 500
export function ehUuid(valor: unknown): valor is string {
  return typeof valor === 'string' && /^[0-9a-f-]{36}$/i.test(valor)
}

// Lê um texto do corpo do pedido: tira espaços das pontas e corta no limite
export function texto(valor: unknown, limite: number): string {
  return typeof valor === 'string' ? valor.trim().slice(0, limite) : ''
}

// Data no formato AAAA-MM-DD, ou null se vazia/inválida
export function data(valor: unknown): string | null {
  return typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valor) ? valor : null
}
