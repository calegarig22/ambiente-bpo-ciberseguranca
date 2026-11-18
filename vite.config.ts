import react from '@vitejs/plugin-react'
import { existsSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from 'vite'

// Na Vercel, cada arquivo de api/ vira uma função (api/login.ts → /api/login).
// No computador, este plugin faz o mesmo papel dentro do próprio "npm run dev":
// recebe /api/<nome>, carrega api/<nome>.ts e chama a função do método (GET, POST...).
// Assim tudo roda num terminal só, na mesma origem, e os cookies funcionam igual.
function apiLocal(): Plugin {
  return {
    name: 'api-local',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next()
        atender(server, req, res).catch((e: unknown) => {
          console.error(e)
          res.statusCode = 500
          res.end(JSON.stringify({ erro: 'Erro interno na API local.' }))
        })
      })
    },
  }
}

async function atender(server: ViteDevServer, req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? '/', 'http://localhost')
  const nome = url.pathname.slice('/api/'.length)

  // Só nomes simples (letras e hífen). Bloqueia "../" e arquivos internos (_lib)
  if (!/^[a-z-]+$/.test(nome)) {
    res.statusCode = 404
    return res.end()
  }

  if (!existsSync(`api/${nome}.ts`)) {
    res.statusCode = 404
    return res.end()
  }
  const modulo = await server.ssrLoadModule(`/api/${nome}.ts`)

  const funcao = modulo[req.method ?? 'GET']
  if (typeof funcao !== 'function') {
    res.statusCode = 405
    return res.end()
  }

  // Converte o pedido do Node para o formato Request (o mesmo que a Vercel entrega)
  const partes: Buffer[] = []
  for await (const parte of req) partes.push(parte as Buffer)
  const headers = new Headers()
  for (const [chave, valor] of Object.entries(req.headers)) {
    if (typeof valor === 'string') headers.set(chave, valor)
  }
  const temCorpo = req.method !== 'GET' && req.method !== 'HEAD'
  const pedido = new Request(url, {
    method: req.method,
    headers,
    body: temCorpo ? Buffer.concat(partes) : undefined,
  })

  // Chama a função da API e devolve a resposta para o navegador
  const resposta = (await funcao(pedido)) as Response
  res.statusCode = resposta.status
  resposta.headers.forEach((valor, chave) => {
    if (chave !== 'set-cookie') res.setHeader(chave, valor)
  })
  const cookies = resposta.headers.getSetCookie()
  if (cookies.length) res.setHeader('Set-Cookie', cookies)
  res.end(Buffer.from(await resposta.arrayBuffer()))
}

export default defineConfig(({ mode }) => {
  // Carrega o .env.local para a API local. Só as variáveis do servidor,
  // e sem prefixo VITE_, para que nunca sejam embutidas no código do navegador.
  const env = loadEnv(mode, process.cwd(), '')
  for (const chave of ['DATABASE_URL', 'SESSAO_SEGREDO', 'GEMINI_API_KEY', 'GEMINI_MODELO']) {
    if (env[chave]) process.env[chave] = env[chave]
  }

  return {
    plugins: [react(), apiLocal()],
  }
})
