import { useEffect, useState, type ReactNode } from 'react'
import { apiGet, apiPost } from '../lib/api'
import type { CamposEditaveis, Item, NovoItem } from '../lib/dominio'
import { ContextoItens, idsDaSubarvore } from '../lib/itens'

// Carrega os itens uma vez e divide com todas as telas (barra lateral,
// visão geral, área). Depois de cada alteração, atualiza só o item que mudou,
// sem baixar a lista inteira de novo.
export default function ProvedorItens({ children }: { children: ReactNode }) {
  const [itens, setItens] = useState<Item[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    apiGet<{ itens: Item[] }>('itens')
      .then((r) => setItens(r.itens))
      .catch((e: Error) => setErro(e.message))
      .finally(() => setCarregando(false))
  }, [])

  // Troca, na lista, o item antigo pela versão nova que veio da API
  function trocarItem(novo: Item) {
    setItens((lista) => lista.map((i) => (i.id === novo.id ? novo : i)))
  }

  async function editar(id: string, campos: CamposEditaveis) {
    const r = await apiPost<{ item: Item }>('itens', { acao: 'editar', id, campos })
    trocarItem(r.item)
  }

  async function criar(novo: NovoItem) {
    const r = await apiPost<{ item: Item }>('itens', { acao: 'criar', ...novo })
    setItens((lista) => [...lista, r.item])
    return r.item
  }

  async function remover(id: string) {
    await apiPost('itens', { acao: 'remover', id })
    // O banco apagou o item e tudo dentro dele; aqui fazemos o mesmo na lista
    setItens((lista) => {
      const sair = idsDaSubarvore(lista, id)
      return lista.filter((i) => !sair.has(i.id))
    })
  }

  return (
    <ContextoItens.Provider value={{ itens, carregando, erro, editar, criar, remover, trocarItem }}>
      {children}
    </ContextoItens.Provider>
  )
}
