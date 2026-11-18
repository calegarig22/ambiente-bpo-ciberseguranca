import { json } from './_lib/resposta.js'
import { exigirLogin } from './_lib/sessao.js'

// GET /api/eu: diz quem está logado. A interface chama ao abrir,
// para saber se mostra o login ou as telas internas.
export async function GET(req: Request): Promise<Response> {
  const usuario = await exigirLogin(req)
  if (usuario instanceof Response) return usuario
  return json({ usuario })
}
