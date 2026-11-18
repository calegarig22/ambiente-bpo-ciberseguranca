import type { Area, Item, Tipo } from './dominio'
import { idsDaSubarvore } from './itens'

// Caminhos na árvore (funções sem React), usados pela Árvore geral:
// descobrir o pai de um item, o caminho até ele e o que existe dentro dele.
//
// Cada ponto da árvore tem uma "chave":
//   "raiz"      → BPO financeira
//   "area:IAM"  → uma área
//   id do item  → sistema, configuração ou regra

export interface Bolha {
  chave: string
  tipo: 'raiz' | 'area' | Tipo
  nome: string
  area: Area | null
  item: Item | null
}

// ---- Funções de navegação na árvore (sem React) ----

export function bolhaDe(chave: string, itens: Item[]): Bolha | null {
  if (chave === 'raiz') return { chave, tipo: 'raiz', nome: 'BPO financeira', area: null, item: null }
  if (chave.startsWith('area:')) {
    const area = chave.slice(5) as Area
    return { chave, tipo: 'area', nome: area, area, item: null }
  }
  const item = itens.find((i) => i.id === chave)
  return item ? { chave, tipo: item.tipo, nome: item.nome, area: item.area, item } : null
}

export function paiDe(chave: string, itens: Item[]): string | null {
  if (chave === 'raiz') return null
  if (chave.startsWith('area:')) return 'raiz'
  const item = itens.find((i) => i.id === chave)
  if (!item) return 'raiz'
  return item.pai_id ?? `area:${item.area}`
}

// Caminho da raiz até a chave: ["raiz", "area:IAM", "<id do sistema>", ...]
export function trilhaAte(chave: string, itens: Item[]): string[] {
  const caminho: string[] = []
  for (let c: string | null = chave; c; c = paiDe(c, itens)) caminho.unshift(c)
  return caminho
}

// Todos os itens "dentro" de uma bolha (para contar estados)
export function itensDentro(chave: string, itens: Item[]): Item[] {
  if (chave === 'raiz') return itens
  if (chave.startsWith('area:')) return itens.filter((i) => i.area === chave.slice(5))
  const ids = idsDaSubarvore(itens, chave)
  ids.delete(chave)
  return itens.filter((i) => ids.has(i.id))
}
