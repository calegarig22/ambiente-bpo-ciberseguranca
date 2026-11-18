import { SignJWT, jwtVerify } from 'jose'
import type { Usuario } from '../../src/lib/dominio.js'
import { sql } from './banco.js'
import { erro } from './resposta.js'

// A sessão é um token assinado (JWT) guardado num cookie "httpOnly":
// o JavaScript da página não consegue ler o cookie, então um script
// malicioso injetado na página não rouba a sessão.

const NOME_COOKIE = 'sessao'
const DURACAO_SEGUNDOS = 8 * 60 * 60 // 8 horas

function chave(): Uint8Array {
  const segredo = process.env.SESSAO_SEGREDO
  // Segredo curto é fácil de adivinhar por força bruta
  if (!segredo || segredo.length < 32) {
    throw new Error('SESSAO_SEGREDO ausente ou com menos de 32 caracteres')
  }
  return new TextEncoder().encode(segredo)
}

// Monta o texto do cabeçalho Set-Cookie.
// "Secure" (só HTTPS) é ligado na Vercel; no computador local o endereço é http.
function cookie(valor: string, maxAge: number): string {
  const partes = [`${NOME_COOKIE}=${valor}`, 'Path=/', 'HttpOnly', 'SameSite=Lax', `Max-Age=${maxAge}`]
  if (process.env.VERCEL) partes.push('Secure')
  return partes.join('; ')
}

// Cria o cookie de sessão para o usuário que acabou de entrar
export async function cookieDeEntrada(usuarioId: string): Promise<string> {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(usuarioId)
    .setIssuedAt()
    .setExpirationTime(`${DURACAO_SEGUNDOS}s`)
    .sign(chave())
  return cookie(token, DURACAO_SEGUNDOS)
}

// Cookie vazio e já vencido: faz o navegador apagar a sessão
export function cookieDeSaida(): string {
  return cookie('', 0)
}

// Procura o valor do nosso cookie no cabeçalho "Cookie" do pedido
function lerCookie(req: Request): string | null {
  const cabecalho = req.headers.get('cookie') ?? ''
  for (const parte of cabecalho.split(';')) {
    const [nome, ...resto] = parte.trim().split('=')
    if (nome === NOME_COOKIE) return resto.join('=')
  }
  return null
}

// Descobre quem fez o pedido. Devolve null se não houver sessão válida.
// O usuário é lido do banco a cada pedido, então desativar um coordenador
// corta o acesso dele na hora, mesmo com o token ainda dentro da validade.
export async function usuarioDaSessao(req: Request): Promise<Usuario | null> {
  const token = lerCookie(req)
  if (!token) return null

  // chave() fica fora do try: se o segredo faltar, queremos um erro visível,
  // e não um "faça login" silencioso que esconderia a configuração errada
  const segredo = chave()
  let usuarioId: string | undefined
  try {
    const { payload } = await jwtVerify(token, segredo, { algorithms: ['HS256'] })
    usuarioId = payload.sub
  } catch {
    return null // assinatura inválida, token adulterado ou vencido
  }
  if (!usuarioId) return null

  const linhas = await sql()`
    select id, nome, email, papel, area from usuarios
    where id = ${usuarioId} and ativo
  `
  return (linhas[0] as Usuario | undefined) ?? null
}

// Para rotas que exigem login: devolve o usuário, ou uma resposta 401 pronta.
// Uso: const u = await exigirLogin(req); if (u instanceof Response) return u
export async function exigirLogin(req: Request): Promise<Usuario | Response> {
  const usuario = await usuarioDaSessao(req)
  return usuario ?? erro('Faça login para continuar.', 401)
}

// Para rotas só do Admin: devolve o usuário, ou 401 (sem login) / 403 (não é Admin)
export async function exigirAdmin(req: Request): Promise<Usuario | Response> {
  const usuario = await exigirLogin(req)
  if (usuario instanceof Response) return usuario
  if (usuario.papel !== 'admin') return erro('Só o Admin pode fazer isso.', 403)
  return usuario
}
