// Funções para conversar com a nossa API (pasta api/).
// O cookie de sessão vai junto sozinho, porque a API está no mesmo endereço do site.

// Erro com o código HTTP, para a tela saber, por exemplo, se a sessão caiu (401)
export class ErroApi extends Error {
  status: number
  constructor(mensagem: string, status: number) {
    super(mensagem)
    this.status = status
  }
}

async function pedir<T>(caminho: string, opcoes: RequestInit = {}): Promise<T> {
  let resposta: Response
  try {
    resposta = await fetch(`/api/${caminho}`, opcoes)
  } catch {
    throw new ErroApi('Sem conexão com o servidor. Tente de novo.', 0)
  }

  // A API sempre responde JSON; se não vier, usamos uma mensagem padrão
  const dados = (await resposta.json().catch(() => ({}))) as { erro?: string }
  if (!resposta.ok) {
    throw new ErroApi(dados.erro ?? `Erro ${resposta.status}`, resposta.status)
  }
  return dados as T
}

export function apiGet<T>(caminho: string): Promise<T> {
  return pedir<T>(caminho)
}

export function apiPost<T>(caminho: string, corpo: unknown = {}): Promise<T> {
  return pedir<T>(caminho, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(corpo),
  })
}

export function apiDelete<T>(caminho: string): Promise<T> {
  return pedir<T>(caminho, { method: 'DELETE' })
}

// Envia um arquivo cru (sem JSON). O nome vai num cabeçalho, codificado
// para aceitar acentos.
export function apiEnviarArquivo<T>(
  caminho: string,
  arquivo: Blob,
  tipo: string,
  nome: string,
  extras: Record<string, string> = {},
): Promise<T> {
  return pedir<T>(caminho, {
    method: 'POST',
    headers: { 'Content-Type': tipo, 'X-Nome-Arquivo': encodeURIComponent(nome), ...extras },
    body: arquivo,
  })
}
