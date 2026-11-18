import { useEffect, useState, type ReactNode } from 'react'
import { apiGet, apiPost } from '../lib/api'
import type { Usuario } from '../lib/dominio'
import { ContextoSessao } from '../lib/sessao'

// Guarda quem está logado e deixa essa informação disponível para todas as telas.
export default function ProvedorSessao({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [carregando, setCarregando] = useState(true)

  // Ao abrir o site, pergunta à API se já existe uma sessão (cookie) válida
  useEffect(() => {
    apiGet<{ usuario: Usuario }>('eu')
      .then((r) => setUsuario(r.usuario))
      .catch(() => setUsuario(null))
      .finally(() => setCarregando(false))
  }, [])

  async function entrar(email: string, senha: string) {
    const r = await apiPost<{ usuario: Usuario }>('login', { email, senha })
    setUsuario(r.usuario)
  }

  async function sair() {
    await apiPost('sair').catch(() => {})
    setUsuario(null)
  }

  return (
    <ContextoSessao.Provider value={{ usuario, carregando, entrar, sair }}>
      {children}
    </ContextoSessao.Provider>
  )
}
