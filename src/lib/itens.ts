import { createContext, useContext } from 'react'
import type { CamposEditaveis, Estado, Item, NovoItem } from './dominio'

// O que as telas podem ler e fazer com os itens
export interface Inventario {
  itens: Item[]
  carregando: boolean
  erro: string
  editar: (id: string, campos: CamposEditaveis) => Promise<void>
  criar: (novo: NovoItem) => Promise<Item>
  remover: (id: string) => Promise<void>
  trocarItem: (item: Item) => void // usado pelos prints para marcar "com print"
}

export const ContextoItens = createContext<Inventario | null>(null)

export function useItens(): Inventario {
  const inv = useContext(ContextoItens)
  if (!inv) throw new Error('useItens precisa estar dentro de <ProvedorItens>')
  return inv
}

// ---- Funções de apoio (sem React) ----

export function contar(lista: Item[], estado: Estado): number {
  return lista.filter((i) => i.estado === estado).length
}

export function filhosDe(itens: Item[], id: string): Item[] {
  return itens.filter((i) => i.pai_id === id)
}

// O id do item e de todos que estão dentro dele (filhos, netos...)
export function idsDaSubarvore(itens: Item[], id: string): Set<string> {
  const ids = new Set([id])
  const fila = [id]
  while (fila.length) {
    const atual = fila.pop()!
    for (const filho of filhosDe(itens, atual)) {
      ids.add(filho.id)
      fila.push(filho.id)
    }
  }
  return ids
}

// ---- Busca (usada na Árvore geral) ----

// Tira acentos e maiúsculas, para "mfa" achar "MFA" e "criptografia" achar "Criptografia"
export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

// Procura o termo em nome, detalhe, ferramenta, fornecedor e versão.
// Devolve os itens achados e também os "ancestrais" deles (pai, avô), para
// que o caminho até cada item apareça inteiro na árvore.
// Sem termo, devolve tudo e achados = null (não está buscando).
export function buscarItens(itens: Item[], busca: string): { visiveis: Item[]; achados: Set<string> | null } {
  const termo = normalizar(busca.trim())
  if (!termo) return { visiveis: itens, achados: null }

  const porId = new Map(itens.map((i) => [i.id, i]))
  const achados = new Set<string>()
  const mostrar = new Set<string>()
  for (const i of itens) {
    const texto = normalizar([i.nome, i.detalhe, i.ferramenta, i.fornecedor, i.versao].join(' '))
    if (!texto.includes(termo)) continue
    achados.add(i.id)
    // Sobe da regra até o sistema marcando o caminho
    let atual: Item | undefined = i
    while (atual) {
      mostrar.add(atual.id)
      atual = atual.pai_id ? porId.get(atual.pai_id) : undefined
    }
  }
  return { visiveis: itens.filter((i) => mostrar.has(i.id)), achados }
}
