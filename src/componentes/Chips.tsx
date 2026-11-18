import type { CSSProperties } from 'react'
import { MATIZ, NOME_ESTADO, type Area, type Estado } from '../lib/dominio'

// Chip colorido com o nome da área. A cor vem do matiz fixo de cada área
// (variável --h, que o CSS da classe "ta" usa).
export function ChipArea({ area }: { area: Area }) {
  return (
    <span className="chip ta" style={{ '--h': MATIZ[area] } as CSSProperties}>
      {area}
    </span>
  )
}

// Chip de estado: sempre com texto, para não depender só da cor
export function ChipEstado({ estado }: { estado: Estado }) {
  return <span className={`es e-${estado}`}>{NOME_ESTADO[estado]}</span>
}
