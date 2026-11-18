import { useState, type CSSProperties, type KeyboardEvent } from 'react'
import { MATIZ, NOME_ESTADO, NOME_TIPO, type Area, type Estado, type Item } from '../lib/dominio'

// Árvore ilustrada da Árvore geral, desenhada em SVG à mão:
//   tronco  = BPO financeira
//   galhos  = as áreas (uma placa colorida com o nome)
//   frutos  = os sistemas
//   folhas  = as configurações, e folhinhas penduradas nelas = as regras
//   raízes  = a base documental (políticas, inventário e infraestrutura, BIA, DRP)
// Para não poluir, as folhas só aparecem na área escolhida (ou na busca).
// A folha mostra o estado: verde com ✓ (em ordem), amarela com ! (atenção)
// e só o contorno tracejado (pendente, "folha que ainda falta").

// Tamanho do desenho (as coordenadas abaixo usam essa escala)
const LARGURA = 1000
const ALTURA = 860
const TOPO_TRONCO = { x: 500, y: 480 }

// Ângulo de cada galho de área (graus; -90 = para cima), da esquerda para a direita
function angulosDasAreas(qtd: number): number[] {
  if (qtd === 1) return [-90]
  const inicio = -165
  const fim = -15
  return Array.from({ length: qtd }, (_, i) => inicio + ((fim - inicio) * i) / (qtd - 1))
}

const rad = (graus: number) => (graus * Math.PI) / 180
const andar = (p: { x: number; y: number }, graus: number, dist: number) => ({
  x: p.x + dist * Math.cos(rad(graus)),
  y: p.y + dist * Math.sin(rad(graus)),
})

// Distribui "qtd" ângulos num leque de "abertura" graus em volta de "centro"
function leque(centro: number, abertura: number, qtd: number): number[] {
  if (qtd === 1) return [centro]
  return Array.from({ length: qtd }, (_, i) => centro - abertura / 2 + (abertura * i) / (qtd - 1))
}

interface Ponto {
  x: number
  y: number
}

interface GalhoArea {
  area: Area
  angulo: number
  fim: Ponto
  controle: Ponto // ponto que curva o galho
  placa: Ponto
}

interface Fruto {
  item: Item
  base: Ponto
  ponta: Ponto
}

interface Folha {
  item: Item
  base: Ponto
  angulo: number
  comprimento: number
  ordem: number // para a animação de brotar em sequência
}

// Calcula onde fica cada galho, fruto e folha
function montarDesenho(itens: Item[], areas: Area[]) {
  const galhos: GalhoArea[] = []
  const frutos: Fruto[] = []
  const folhas: Folha[] = []
  const filhos = (id: string) => itens.filter((i) => i.pai_id === id)
  let ordem = 0

  angulosDasAreas(areas.length).forEach((angulo, i) => {
    const area = areas[i]
    const fim = andar(TOPO_TRONCO, angulo, 230)
    // A curva puxa o galho um pouco para cima, como um galho de verdade
    const controle = { x: (TOPO_TRONCO.x + fim.x) / 2, y: Math.min(TOPO_TRONCO.y, fim.y) - 40 }
    // A placa fica em 70% do caminho do galho (ponto na curva), longe do tronco
    // para as placas vizinhas não se encostarem
    const t = 0.7
    const placa = {
      x: (1 - t) ** 2 * TOPO_TRONCO.x + 2 * (1 - t) * t * controle.x + t ** 2 * fim.x,
      y: (1 - t) ** 2 * TOPO_TRONCO.y + 2 * (1 - t) * t * controle.y + t ** 2 * fim.y,
    }
    galhos.push({ area, angulo, fim, controle, placa })

    const sistemas = itens.filter((it) => it.area === area && !it.pai_id)
    leque(angulo, sistemas.length > 2 ? 84 : 56, sistemas.length).forEach((anguloSis, j) => {
      const sistema = sistemas[j]
      const ponta = andar(fim, anguloSis, 105)
      frutos.push({ item: sistema, base: fim, ponta })

      const configs = filhos(sistema.id)
      leque(anguloSis, configs.length > 1 ? 70 : 0, configs.length).forEach((anguloCfg, k) => {
        const config = configs[k]
        const base = andar(ponta, anguloCfg, 9)
        folhas.push({ item: config, base, angulo: anguloCfg, comprimento: 44, ordem: ordem++ })

        // Regras penduradas na ponta da folha da configuração
        const pontaCfg = andar(base, anguloCfg, 44)
        const regras = filhos(config.id)
        leque(anguloCfg, regras.length > 1 ? 56 : 0, regras.length).forEach((anguloRegra, m) => {
          folhas.push({
            item: regras[m],
            base: andar(pontaCfg, anguloRegra, 3),
            angulo: anguloRegra,
            comprimento: 32,
            ordem: ordem++,
          })
        })
      })
    })
  })

  return { galhos, frutos, folhas }
}

// Formato de folha com a base no ponto (0,0) e a ponta para a direita
function caminhoFolha(comprimento: number): string {
  const c = comprimento
  const a = c / 2.5 // "gordura" da folha
  return `M0 0 C ${c * 0.25} ${-a}, ${c * 0.75} ${-a}, ${c} 0 C ${c * 0.75} ${a}, ${c * 0.25} ${a}, 0 0 Z`
}

// Largura da placa conforme o tamanho do nome da área
const larguraPlaca = (nome: string) => 28 + nome.length * 11

const SIMBOLO: Record<Estado, string> = { ok: '✓', atencao: '!', pendente: '' }

// Raízes: as seções de documentação, com a rota de cada página
const RAIZES = [
  { nome: 'Políticas', rota: '/documentos/politica', x: 175 },
  { nome: 'Inventário', rota: '/inventario', x: 390 },
  { nome: 'BIA', rota: '/documentos/bia', x: 610 },
  { nome: 'DRP', rota: '/documentos/drp', x: 825 },
]

interface Props {
  itens: Item[]
  areas: Area[]
  aoAbrirSecao: (rota: string) => void
  selecionado: string | null // "area:IAM" ou id de item
  achados: Set<string> | null // resultado da busca (null = sem busca)
  aoSelecionar: (chave: string) => void
}

export default function ArvoreIlustrada({ itens, areas, aoAbrirSecao, selecionado, achados, aoSelecionar }: Props) {
  const { galhos, frutos, folhas } = montarDesenho(itens, areas)
  const [sobre, setSobre] = useState<{ item: Item; x: number; y: number } | null>(null)

  // Área em destaque: a da placa clicada ou a do item selecionado
  const areaEmFoco = selecionado?.startsWith('area:')
    ? selecionado.slice(5)
    : (itens.find((i) => i.id === selecionado)?.area ?? null)

  // Apaga o que não está em foco (outra área, ou fora do resultado da busca)
  function apagado(item: Item): boolean {
    if (achados) return !achados.has(item.id)
    return areaEmFoco !== null && item.area !== areaEmFoco
  }

  // Folhas visíveis: na busca, as encontradas; senão, só as da área em foco
  const folhasVisiveis = folhas.filter((f) => (achados ? achados.has(f.item.id) : f.item.area === areaEmFoco))

  function teclado(e: KeyboardEvent, chave: string) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      aoSelecionar(chave)
    }
  }

  // Propriedades comuns de folhas e frutos (clique, teclado, dica ao passar o mouse)
  function interacao(item: Item, ponto: Ponto) {
    return {
      role: 'button',
      tabIndex: 0,
      'aria-label': `${NOME_TIPO[item.tipo]}: ${item.nome}. ${NOME_ESTADO[item.estado]}. Ver detalhes.`,
      'aria-pressed': selecionado === item.id,
      onClick: () => aoSelecionar(item.id),
      onKeyDown: (e: KeyboardEvent) => teclado(e, item.id),
      onPointerEnter: () => setSobre({ item, ...ponto }),
      onPointerLeave: () => setSobre(null),
      onFocus: () => setSobre({ item, ...ponto }),
      onBlur: () => setSobre(null),
    }
  }

  return (
    <div className="arvore-ilustrada">
      <svg viewBox={`0 0 ${LARGURA} ${ALTURA}`} role="group" aria-label="Árvore ilustrada do ambiente">
        <defs>
          <linearGradient id="madeira" x1="0" x2="1">
            <stop offset="0" stopColor="#6b4423" />
            <stop offset=".5" stopColor="#8d5f34" />
            <stop offset="1" stopColor="#5a381c" />
          </linearGradient>
          <radialGradient id="chao" cx=".5" cy=".5" r=".5">
            <stop offset="0" className="chao-1" />
            <stop offset="1" className="chao-2" />
          </radialGradient>
        </defs>

        {/* Solo (onde ficam as raízes) e a grama */}
        <rect className="solo" x={0} y={712} width={LARGURA} height={ALTURA - 712} />
        <ellipse cx={500} cy={712} rx={470} ry={22} fill="url(#chao)" />

        {/* Copa: nuvens coloridas atrás de cada área */}
        {galhos.map((g) => (
          <g key={g.area} className={`copa${areaEmFoco && areaEmFoco !== g.area ? ' apagado' : ''}`} style={{ '--h': MATIZ[g.area] } as CSSProperties}>
            <circle cx={g.fim.x} cy={g.fim.y} r={105} />
            {frutos
              .filter((f) => f.item.area === g.area)
              .map((f) => (
                <circle key={f.item.id} cx={f.ponta.x} cy={f.ponta.y} r={72} />
              ))}
          </g>
        ))}

        {/* Tronco e raízes */}
        <path
          className="tronco"
          d="M452 712 C 468 650, 476 580, 484 480 L 516 480 C 524 580, 532 650, 548 712 Z"
          fill="url(#madeira)"
        />
        {/* Raízes: uma para cada seção da documentação */}
        {RAIZES.map((r) => (
          <path key={r.nome} className="raiz" d={`M ${500 + (r.x - 500) * 0.06} 708 C ${500 + (r.x - 500) * 0.3} 760, ${r.x} 740, ${r.x} 790`} />
        ))}
        <text className="solo-titulo" x={500} y={842}>
          BASE DOCUMENTAL
        </text>

        {/* Galhos das áreas e galhos finos até os sistemas */}
        {galhos.map((g) => (
          <path
            key={g.area}
            className="galho-area"
            d={`M ${TOPO_TRONCO.x} ${TOPO_TRONCO.y} Q ${g.controle.x} ${g.controle.y} ${g.fim.x} ${g.fim.y}`}
          />
        ))}
        {frutos.map((f) => (
          <path
            key={f.item.id}
            className={`galho-sistema${apagado(f.item) ? ' apagado' : ''}`}
            d={`M ${f.base.x} ${f.base.y} L ${f.ponta.x} ${f.ponta.y}`}
          />
        ))}

        {/* Folhas: configurações e regras */}
        {folhasVisiveis.map((f) => {
          const classes = ['folha', `fe-${f.item.estado}`, f.item.tipo === 'regra' && 'regra']
          if (apagado(f.item)) classes.push('apagado')
          if (achados?.has(f.item.id)) classes.push('achado')
          if (selecionado === f.item.id) classes.push('sel')
          const meio = andar(f.base, f.angulo, f.comprimento / 2)
          // O texto (✓ ou !) fica sempre em pé, mesmo com a folha inclinada
          return (
            <g key={f.item.id} className={classes.filter(Boolean).join(' ')} {...interacao(f.item, meio)}>
              <g transform={`translate(${f.base.x} ${f.base.y}) rotate(${f.angulo})`}>
                <g className="balanco" style={{ animationDelay: `${(f.ordem % 7) * -0.6}s, ${f.ordem * 0.025}s` }}>
                  <path className="folha-forma" d={caminhoFolha(f.comprimento)} />
                  <path className="folha-veio" d={`M2 0 L ${f.comprimento - 4} 0`} />
                </g>
              </g>
              {SIMBOLO[f.item.estado] && (
                <text className="folha-simbolo" x={meio.x} y={meio.y + 3.5}>
                  {SIMBOLO[f.item.estado]}
                </text>
              )}
            </g>
          )
        })}

        {/* Frutos: os sistemas */}
        {frutos.map((f) => {
          const classes = ['fruto', `fe-${f.item.estado}`]
          if (apagado(f.item)) classes.push('apagado')
          if (achados?.has(f.item.id)) classes.push('achado')
          if (selecionado === f.item.id) classes.push('sel')
          return (
            <g key={f.item.id} className={classes.join(' ')} {...interacao(f.item, f.ponta)}>
              <circle cx={f.ponta.x} cy={f.ponta.y} r={11} />
              {SIMBOLO[f.item.estado] && (
                <text x={f.ponta.x} y={f.ponta.y + 4}>
                  {SIMBOLO[f.item.estado]}
                </text>
              )}
            </g>
          )
        })}

        {/* Placas das áreas, sobre os galhos */}
        {galhos.map((g) => (
          <g
            key={g.area}
            className={`placa${selecionado === `area:${g.area}` ? ' sel' : ''}`}
            style={{ '--h': MATIZ[g.area] } as CSSProperties}
            role="button"
            tabIndex={0}
            aria-label={`Área ${g.area}. Ver resumo e destacar os galhos dela.`}
            aria-pressed={selecionado === `area:${g.area}`}
            onClick={() => aoSelecionar(`area:${g.area}`)}
            onKeyDown={(e) => teclado(e, `area:${g.area}`)}
          >
            <rect x={g.placa.x - larguraPlaca(g.area) / 2} y={g.placa.y - 17} width={larguraPlaca(g.area)} height={34} rx={17} />
            <text x={g.placa.x} y={g.placa.y + 6}>
              {g.area}
            </text>
          </g>
        ))}

        {/* Placas das raízes: levam às páginas de documentação */}
        {RAIZES.map((r) => (
          <g
            key={r.nome}
            className="placa placa-raiz"
            role="link"
            tabIndex={0}
            aria-label={`Abrir ${r.nome}`}
            onClick={() => aoAbrirSecao(r.rota)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                aoAbrirSecao(r.rota)
              }
            }}
          >
            <rect x={r.x - (24 + r.nome.length * 5.6)} y={774} width={48 + r.nome.length * 11.2} height={34} rx={8} />
            <text x={r.x} y={797}>
              {r.nome}
            </text>
          </g>
        ))}

        {/* Placa do tronco */}
        <g
          className={`placa placa-tronco${selecionado === 'raiz' ? ' sel' : ''}`}
          role="button"
          tabIndex={0}
          aria-label="BPO financeira. Ver resumo geral."
          onClick={() => aoSelecionar('raiz')}
          onKeyDown={(e) => teclado(e, 'raiz')}
        >
          <rect x={410} y={614} width={180} height={40} rx={10} />
          <text x={500} y={640}>
            BPO financeira
          </text>
        </g>
      </svg>

      {/* Dica com o nome ao passar o mouse (posição em % do desenho) */}
      {sobre && (
        <div
          className="dica-folha"
          style={{ left: `${(sobre.x / LARGURA) * 100}%`, top: `${(sobre.y / ALTURA) * 100}%` }}
          aria-hidden="true"
        >
          <strong>{sobre.item.nome}</strong>
          <span>
            {sobre.item.area} · {NOME_TIPO[sobre.item.tipo]} · {NOME_ESTADO[sobre.item.estado]}
          </span>
        </div>
      )}
    </div>
  )
}
