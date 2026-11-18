import { createContext, useContext } from 'react'
import type { Usuario } from './dominio'

// O que qualquer tela pode saber e fazer sobre o login
export interface Sessao {
  usuario: Usuario | null
  carregando: boolean // true enquanto ainda perguntamos à API quem está logado
  entrar: (email: string, senha: string) => Promise<void>
  sair: () => Promise<void>
}

export const ContextoSessao = createContext<Sessao | null>(null)

// Atalho para as telas: const { usuario, sair } = useSessao()
export function useSessao(): Sessao {
  const sessao = useContext(ContextoSessao)
  if (!sessao) throw new Error('useSessao precisa estar dentro de <ProvedorSessao>')
  return sessao
}
