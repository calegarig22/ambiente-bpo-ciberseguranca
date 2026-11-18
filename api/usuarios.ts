import bcrypt from 'bcryptjs'
import { PAPEIS, ehArea, type Papel } from '../src/lib/dominio.js'
import { sql } from './_lib/banco.js'
import { erro, json, lerJson } from './_lib/resposta.js'
import { exigirAdmin } from './_lib/sessao.js'
import { ehUuid } from './_lib/validacao.js'

// Gestão de usuários, usada pela aba Admin. Tudo aqui é só para o Admin.

// GET /api/usuarios: lista todos os usuários (sem o hash da senha)
export async function GET(req: Request): Promise<Response> {
  const admin = await exigirAdmin(req)
  if (admin instanceof Response) return admin

  const usuarios = await sql()`
    select id, nome, email, papel, area, ativo from usuarios
    order by ativo desc, papel, area, nome
  `
  return json({ usuarios })
}

// Confere a senha nova. Devolve a mensagem de erro, ou null se estiver boa.
function problemaNaSenha(senha: unknown): string | null {
  if (typeof senha !== 'string' || senha.length < 8) return 'A senha precisa ter pelo menos 8 caracteres.'
  if (senha.length > 72) return 'A senha pode ter no máximo 72 caracteres.' // limite do bcrypt
  return null
}

function ehPapel(v: unknown): v is Papel {
  return PAPEIS.includes(v as Papel)
}

// Quantos Admins ativos existem além do usuário informado.
// Serve para nunca deixar a aplicação sem nenhum Admin.
async function outrosAdminsAtivos(id: string): Promise<number> {
  const r = await sql()`select count(*)::int as n from usuarios where papel = 'admin' and ativo and id <> ${id}`
  return r[0].n as number
}

// POST /api/usuarios  { acao, ... }
//   criar      { nome, email, papel, area, senha }  cria um usuário
//   perfil     { id, papel, area }                  muda o perfil e/ou a área
//   ativar     { id }                               reativa um usuário
//   desativar  { id }                               bloqueia o acesso (não apaga)
//   senha      { id, senha }                        define uma nova senha
//   apagar     { id }                               apaga o usuário de vez
export async function POST(req: Request): Promise<Response> {
  const admin = await exigirAdmin(req)
  if (admin instanceof Response) return admin

  const corpo = await lerJson(req)
  if (!corpo) return erro('Pedido inválido.', 400)

  if (corpo.acao === 'criar') {
    const nome = typeof corpo.nome === 'string' ? corpo.nome.trim() : ''
    const email = typeof corpo.email === 'string' ? corpo.email.trim().toLowerCase() : ''
    if (!nome) return erro('Informe o nome.', 400)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return erro('Informe um e-mail válido.', 400)
    if (!ehPapel(corpo.papel)) return erro('Escolha o perfil.', 400)
    if (typeof corpo.area !== 'string' || !ehArea(corpo.area)) return erro('Escolha uma área.', 400)
    const problema = problemaNaSenha(corpo.senha)
    if (problema) return erro(problema, 400)

    const hash = await bcrypt.hash(corpo.senha as string, 12)
    // "on conflict do nothing": se o e-mail já existir, não insere e devolve vazio
    const linhas = await sql()`
      insert into usuarios (nome, email, senha_hash, papel, area)
      values (${nome}, ${email}, ${hash}, ${corpo.papel}, ${corpo.area})
      on conflict (email) do nothing
      returning id
    `
    if (!linhas.length) return erro('Já existe um usuário com esse e-mail.', 409)
    return json({ ok: true }, 201)
  }

  if (!ehUuid(corpo.id)) return erro('Usuário não encontrado.', 404)
  const id = corpo.id
  const atual = (await sql()`select id, papel, ativo from usuarios where id = ${id}`)[0] as
    | { id: string; papel: Papel; ativo: boolean }
    | undefined
  if (!atual) return erro('Usuário não encontrado.', 404)

  if (corpo.acao === 'perfil') {
    if (!ehPapel(corpo.papel)) return erro('Perfil inválido.', 400)
    if (typeof corpo.area !== 'string' || !ehArea(corpo.area)) return erro('Área inválida.', 400)
    // Tirar o Admin de alguém: nunca de si mesmo, e nunca do último Admin ativo
    if (atual.papel === 'admin' && corpo.papel !== 'admin') {
      if (id === admin.id) return erro('Você não pode tirar o seu próprio perfil de Admin.', 400)
      if (atual.ativo && (await outrosAdminsAtivos(id)) === 0) return erro('Precisa sobrar pelo menos um Admin ativo.', 400)
    }
    await sql()`update usuarios set papel = ${corpo.papel}, area = ${corpo.area} where id = ${id}`
    return json({ ok: true })
  }

  if (corpo.acao === 'ativar' || corpo.acao === 'desativar') {
    const ativo = corpo.acao === 'ativar'
    if (!ativo) {
      // Impede o Admin de se trancar para fora da aplicação
      if (id === admin.id) return erro('Você não pode desativar o seu próprio usuário.', 400)
      if (atual.papel === 'admin' && (await outrosAdminsAtivos(id)) === 0) {
        return erro('Precisa sobrar pelo menos um Admin ativo.', 400)
      }
    }
    await sql()`update usuarios set ativo = ${ativo} where id = ${id}`
    return json({ ok: true })
  }

  if (corpo.acao === 'apagar') {
    // Mesmas proteções da desativação: ninguém se apaga, e sempre sobra um Admin ativo
    if (id === admin.id) return erro('Você não pode apagar o seu próprio usuário.', 400)
    if (atual.papel === 'admin' && atual.ativo && (await outrosAdminsAtivos(id)) === 0) {
      return erro('Precisa sobrar pelo menos um Admin ativo.', 400)
    }
    // O que a pessoa cadastrou continua: o campo criado_por vira vazio (on delete set null)
    await sql()`delete from usuarios where id = ${id}`
    return json({ ok: true })
  }

  if (corpo.acao === 'senha') {
    const problema = problemaNaSenha(corpo.senha)
    if (problema) return erro(problema, 400)
    const hash = await bcrypt.hash(corpo.senha as string, 12)
    await sql()`update usuarios set senha_hash = ${hash} where id = ${id}`
    return json({ ok: true })
  }

  return erro('Ação desconhecida.', 400)
}
