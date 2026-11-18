import type { CSSProperties } from 'react'
import { ESTADOS, NOME_ESTADO } from '../lib/dominio'
import { contar } from '../lib/itens'
import type { Item } from '../lib/dominio'

// Cor de cada estado na barra (variáveis do CSS global)
const COR = { ok: 'var(--ok)', atencao: 'var(--at)', pendente: 'var(--pe)' }

// Barra horizontal com a proporção de itens em cada estado.
// O aria-label descreve os números para quem usa leitor de tela.
export function BarraEstados({ itens }: { itens: Item[] }) {
  const total = itens.length || 1
  const rotulo = `${contar(itens, 'ok')} em ordem, ${contar(itens, 'atencao')} em atenção, ${contar(itens, 'pendente')} pendentes`
  return (
    <div className="bar" role="img" aria-label={rotulo}>
      {ESTADOS.map((e) => {
        const n = contar(itens, e)
        if (!n) return null
        const estilo: CSSProperties = { width: `${(n / total) * 100}%`, background: COR[e] }
        return <i key={e} style={estilo} />
      })}
    </div>
  )
}

// Três chips com a contagem de cada estado ("3 em ordem", "2 atenção"...)
export function Contadores({ itens }: { itens: Item[] }) {
  return (
    <div className="cnts">
      {ESTADOS.map((e) => (
        <span key={e} className={`es e-${e}`}>
          {contar(itens, e)} {NOME_ESTADO[e].toLowerCase()}
        </span>
      ))}
    </div>
  )
}
