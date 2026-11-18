// Atalhos para montar respostas da API sempre do mesmo jeito.

// Resposta JSON. "no-store" evita que navegador ou CDN guardem dados privados.
export function json(dados: unknown, status = 200, extras: Record<string, string> = {}): Response {
  const headers = new Headers(extras)
  headers.set('Content-Type', 'application/json; charset=utf-8')
  headers.set('Cache-Control', 'no-store')
  return new Response(JSON.stringify(dados), { status, headers })
}

// Resposta de erro com uma mensagem legível para mostrar na tela
export function erro(mensagem: string, status: number): Response {
  return json({ erro: mensagem }, status)
}

// Lê o corpo JSON de um pedido que altera dados.
// Exigir "application/json" é uma proteção contra CSRF: um site malicioso não
// consegue enviar esse tipo de pedido para cá sem a permissão do navegador (CORS).
// Devolve null se o pedido não vier em JSON válido.
export async function lerJson(req: Request): Promise<Record<string, unknown> | null> {
  if (!req.headers.get('content-type')?.startsWith('application/json')) return null
  try {
    const corpo: unknown = await req.json()
    return corpo && typeof corpo === 'object' ? (corpo as Record<string, unknown>) : null
  } catch {
    return null
  }
}
