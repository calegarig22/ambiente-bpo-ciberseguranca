import bcrypt from 'bcryptjs'
import type { Usuario } from '../src/lib/dominio.js'
import { sql } from './_lib/banco.js'
import { erro, json, lerJson } from './_lib/resposta.js'
import { cookieDeEntrada } from './_lib/sessao.js'

// Hash de uma senha qualquer, usado quando o e-mail não existe. Assim a
// resposta demora o mesmo tempo nos dois casos, e ninguém descobre quais
// e-mails estão cadastrados medindo o tempo de resposta.
const HASH_FALSO = '$2b$12$A3TSNbt51Lff8fEILFiDHusE03f2i8Yfqa3e5RoRC7k5.D8yqAZ1.'

// POST /api/login  { email, senha }
export async function POST(req: Request): Promise<Response> {
  const corpo = await lerJson(req)
  const email = typeof corpo?.email === 'string' ? corpo.email.trim().toLowerCase() : ''
  const senha = typeof corpo?.senha === 'string' ? corpo.senha : ''
  if (!email || !senha) return erro('Informe e-mail e senha.', 400)

  const linhas = await sql()`
    select id, nome, email, papel, area, senha_hash from usuarios
    where email = ${email} and ativo
  `
  const achado = linhas[0] as (Usuario & { senha_hash: string }) | undefined
  const confere = await bcrypt.compare(senha, achado?.senha_hash ?? HASH_FALSO)

  // Mesma mensagem para e-mail inexistente e senha errada
  if (!achado || !confere) return erro('E-mail ou senha incorretos.', 401)

  const usuario: Usuario = {
    id: achado.id,
    nome: achado.nome,
    email: achado.email,
    papel: achado.papel,
    area: achado.area,
  }
  return json({ usuario }, 200, { 'Set-Cookie': await cookieDeEntrada(usuario.id) })
}
