import { neon } from '@neondatabase/serverless'

// Conexão com o Neon pelo modo HTTP: ideal para funções serverless, que
// sobem, respondem e somem. Cada consulta é um pedido HTTP independente.
//
// Uso: const linhas = await sql()`select * from itens where area = ${area}`
// Os valores entre ${} viram parâmetros, nunca texto colado no SQL,
// o que impede injeção de SQL.
export function sql() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('Falta a variável DATABASE_URL')
  return neon(url)
}
