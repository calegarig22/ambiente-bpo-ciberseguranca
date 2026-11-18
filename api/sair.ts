import { json } from './_lib/resposta.js'
import { cookieDeSaida } from './_lib/sessao.js'

// POST /api/sair: apaga o cookie de sessão no navegador
export async function POST(): Promise<Response> {
  return json({ ok: true }, 200, { 'Set-Cookie': cookieDeSaida() })
}
