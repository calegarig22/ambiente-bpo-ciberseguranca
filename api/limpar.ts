import { sql } from './_lib/banco.js'
import { erro, json, lerJson } from './_lib/resposta.js'
import { exigirAdmin } from './_lib/sessao.js'

// Apagar dados em massa (aba Admin, "Apagar dados"): inventário e/ou documentos. Só o Admin.
// Serve para tirar os dados de exemplo e começar com os dados reais.
// Usuários nunca são apagados aqui.

// GET /api/limpar: quantos registros existem de cada tipo
export async function GET(req: Request): Promise<Response> {
  const admin = await exigirAdmin(req)
  if (admin instanceof Response) return admin
  const [r] = await sql()`
    select (select count(*)::int from itens) as itens,
           (select count(*)::int from documentos) as documentos
  `
  return json({ contagem: r })
}

// POST /api/limpar  { itens, documentos, confirmacao: "APAGAR" }
export async function POST(req: Request): Promise<Response> {
  const admin = await exigirAdmin(req)
  if (admin instanceof Response) return admin
  const corpo = await lerJson(req)
  if (!corpo) return erro('Pedido inválido.', 400)

  // Confirmação digitada, para ninguém apagar tudo com um clique sem querer
  if (corpo.confirmacao !== 'APAGAR') return erro('Digite APAGAR para confirmar.', 400)
  if (!corpo.itens && !corpo.documentos) return erro('Marque o que deseja apagar.', 400)

  const apagados = { itens: 0, documentos: 0 }
  if (corpo.documentos) apagados.documentos = (await sql()`delete from documentos returning id`).length
  // Os prints dos itens somem junto, pelo "on delete cascade"
  if (corpo.itens) apagados.itens = (await sql()`delete from itens returning id`).length

  console.log(`Apagar dados por ${admin.email}:`, apagados)
  return json({ apagados })
}
