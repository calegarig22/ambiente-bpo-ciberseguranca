import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Arvore from '../componentes/Arvore'
import { ChipArea, ChipEstado } from '../componentes/Chips'
import { Contadores } from '../componentes/Estados'
import ArvoreIlustrada from '../componentes/ArvoreIlustrada'
import { DESCRICAO_AREA, NOME_TIPO, areasDoUsuario, type Area, type Item } from '../lib/dominio'
import { buscarItens, useItens } from '../lib/itens'
import { bolhaDe, itensDentro, trilhaAte } from '../lib/caminhos'
import { useSessao } from '../lib/sessao'

// Árvore geral (/arvore): todas as áreas do usuário num lugar só, para achar
// rápido onde está cada coisa (por exemplo, quando o professor perguntar).
// Dois modos:
//   Árvore → desenho de uma árvore: tronco, galhos (áreas), frutos (sistemas)
//            e folhas (configurações e regras), com a cor do estado
//   Lista  → a árvore inteira em texto (mais simples para leitor de tela)
// A busca acende as folhas encontradas e lista os resultados com a aba e o caminho.
export default function ArvoreGeral() {
  const { usuario } = useSessao()
  const { itens, carregando, erro } = useItens()
  const navegar = useNavigate()
  const [busca, setBusca] = useState('')
  const [modo, setModo] = useState<'arvore' | 'lista'>('arvore')
  // O que aparece no painel: "raiz", "area:IAM" ou o id de um item
  const [selecionado, setSelecionado] = useState<string | null>(null)
  // Lista: ids recolhidos. Áreas usam a chave "area:GRC", itens usam o próprio id.
  const [recolhidos, setRecolhidos] = useState<Set<string>>(new Set())
  const refPainel = useRef<HTMLDivElement>(null)

  if (carregando) return <p className="mute">Carregando…</p>
  if (erro) return <p className="err">{erro}</p>
  if (!usuario) return null

  const areas = areasDoUsuario(usuario)
  const { visiveis, achados } = buscarItens(itens, busca)
  const buscando = achados !== null
  // Coordenador vê só a área dele: o painel começa nela
  const chavePainel = selecionado ?? (areas.length === 1 ? `area:${areas[0]}` : 'raiz')

  // Clicar de novo no mesmo item volta ao resumo geral
  function selecionar(chave: string) {
    setSelecionado((atual) => (atual === chave ? null : chave))
    // Em telas estreitas o painel fica abaixo da árvore: rola até ele
    if (window.innerWidth <= 1100) {
      requestAnimationFrame(() => refPainel.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
    }
  }

  function abrirItem(item: Item) {
    navegar(`/area/${item.area}?item=${item.id}`)
  }

  function alternar(chave: string) {
    setRecolhidos((atual) => {
      const novo = new Set(atual)
      if (novo.has(chave)) novo.delete(chave)
      else novo.add(chave)
      return novo
    })
  }

  // Resultados da busca: cada um mostra a aba (área) e o caminho até o item
  const resultados = buscando && (
        <div className="resultados" role="region" aria-label="Resultados da busca">
          <p className="mute" role="status">
            {achados.size === 0
              ? 'Nada encontrado.'
              : `${achados.size} ${achados.size === 1 ? 'resultado' : 'resultados'}${modo === 'arvore' ? ', acesos na árvore' : ''}. Clique para ver os detalhes.`}
          </p>
          {itens
            .filter((i) => achados.has(i.id))
            .map((i) => (
              <button
                key={i.id}
                type="button"
                className="resultado"
                aria-pressed={selecionado === i.id}
                onClick={() => {
                  setModo('arvore')
                  selecionar(i.id)
                }}
              >
                <ChipArea area={i.area} />
                <span className="r-texto">
                  <span className="r-nome">{i.nome}</span>
                  <span className="r-caminho">
                    Aba {i.area} ›{' '}
                    {trilhaAte(i.id, itens)
                      .slice(2, -1)
                      .map((c) => bolhaDe(c, itens)?.nome)
                      .concat(NOME_TIPO[i.tipo])
                      .join(' › ')}
                  </span>
                </span>
                <ChipEstado estado={i.estado} />
              </button>
            ))}
        </div>
  )

  return (
    <>
      <div className="ahead">
        <div>
          <h1>Árvore geral</h1>
          <p className="lead" style={{ marginBottom: 0 }}>
            Cada galho é uma área e cada fruto um sistema. Clique na placa de uma área para ver as folhas
            dela (configurações e regras). As raízes levam à documentação.
          </p>
        </div>
        <div className="seg modo" role="group" aria-label="Modo de exibição">
          <button type="button" aria-pressed={modo === 'arvore'} onClick={() => setModo('arvore')}>
            Árvore
          </button>
          <button type="button" aria-pressed={modo === 'lista'} onClick={() => setModo('lista')}>
            Lista
          </button>
        </div>
      </div>

      <div className="busca">
        <label htmlFor="busca" className="sr">
          Buscar
        </label>
        <input
          id="busca"
          type="search"
          placeholder="Buscar: MFA, firewall, CrowdStrike, phishing…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          autoComplete="off"
        />
      </div>

      {/* Na Lista, os resultados aparecem aqui em cima; na Árvore, ao lado do desenho */}
      {modo === 'lista' && resultados}

      {modo === 'arvore' && (
        <div className="mapa-grade">
          <div>
            <ArvoreIlustrada
              itens={itens}
              areas={areas}
              aoAbrirSecao={(rota) => navegar(rota)}
              selecionado={selecionado}
              achados={achados}
              aoSelecionar={selecionar}
            />
            <div className="legenda-arvore" aria-hidden="true">
              <span><i className="lg-folha fe-ok">✓</i> Em ordem</span>
              <span><i className="lg-folha fe-atencao">!</i> Atenção</span>
              <span><i className="lg-folha fe-pendente" /> Pendente</span>
              <span><i className="lg-fruto" /> Fruto = sistema</span>
              <span>Folha = configuração · folhinha = regra</span>
            </div>
          </div>
          <div ref={refPainel} className="coluna-lateral">
            {resultados}
            <PainelBolha
              chave={chavePainel}
              itens={itens}
              aoAbrirItem={abrirItem}
              aoAbrirArea={(a) => navegar(`/area/${a}`)}
              aoVoltar={selecionado ? () => setSelecionado(null) : undefined}
            />
          </div>
        </div>
      )}

      {modo === 'lista' && !buscando && (
        <>
          <div className="acts" style={{ marginBottom: 12 }}>
            <button
              type="button"
              className="btn ghost sm"
              onClick={() => setRecolhidos(new Set(areas.map((a) => `area:${a}`)))}
            >
              Recolher tudo
            </button>
            <button type="button" className="btn ghost sm" onClick={() => setRecolhidos(new Set())}>
              Expandir tudo
            </button>
          </div>
          {areas.map((a) => (
            <BlocoArea
              key={a}
              area={a}
              todosDaArea={itens.filter((i) => i.area === a)}
              visiveis={visiveis.filter((i) => i.area === a)}
              buscando={false}
              recolhidos={recolhidos}
              aoAlternar={alternar}
              aoAbrir={(id) => {
                const item = itens.find((i) => i.id === id)
                if (item) abrirItem(item)
              }}
              aoAbrirArea={() => navegar(`/area/${a}`)}
            />
          ))}
        </>
      )}
    </>
  )
}

interface PropsPainel {
  chave: string
  itens: Item[]
  aoAbrirItem: (item: Item) => void
  aoAbrirArea: (area: Area) => void
  aoVoltar?: () => void
}

// Painel ao lado do mapa: detalhes da bolha escolhida e o atalho para a aba
function PainelBolha({ chave, itens, aoAbrirItem, aoAbrirArea, aoVoltar }: PropsPainel) {
  const bolha = bolhaDe(chave, itens)
  if (!bolha) return null
  const dentro = itensDentro(chave, itens)

  return (
    <aside className="box painel-bolha" aria-live="polite">
      {bolha.tipo === 'raiz' && (
        <>
          <h2>BPO financeira</h2>
          <p className="mute">Ambiente fictício. Cada galho é uma área de segurança: clique na placa de uma área para ver as folhas dela. As raízes levam às políticas, infraestrutura, ativos, BIA e DRP.</p>
          <Contadores itens={dentro} />
        </>
      )}

      {bolha.tipo === 'area' && bolha.area && (
        <>
          <div className="dh">
            <ChipArea area={bolha.area} />
          </div>
          <h2>{DESCRICAO_AREA[bolha.area]}</h2>
          <p className="mute">{dentro.length} itens nesta área.</p>
          <Contadores itens={dentro} />
          <button type="button" className="btn sm" onClick={() => aoAbrirArea(bolha.area!)}>
            Abrir a aba {bolha.area}
          </button>
        </>
      )}

      {bolha.item && (
        <>
          <div className="dh">
            <ChipArea area={bolha.item.area} />
            <span className="chip">{NOME_TIPO[bolha.item.tipo]}</span>
            <ChipEstado estado={bolha.item.estado} />
          </div>
          <h2>{bolha.item.nome}</h2>
          <p className="caminho">
            Aba {bolha.item.area}
            {trilhaAte(chave, itens)
              .slice(2, -1)
              .map((c) => ` › ${bolhaDe(c, itens)?.nome}`)
              .join('')}
          </p>
          {bolha.item.detalhe && <p>{bolha.item.detalhe}</p>}
          {bolha.item.tipo === 'sistema' && (
            <dl className="fichas">
              <dt>Ferramenta</dt>
              <dd>{bolha.item.ferramenta || '—'}</dd>
              <dt>Fornecedor</dt>
              <dd>{bolha.item.fornecedor || '—'}</dd>
              <dt>Versão</dt>
              <dd>{bolha.item.versao || '—'}</dd>
            </dl>
          )}
          {dentro.length > 0 && (
            <>
              <p className="mute">{dentro.length} itens dentro dele.</p>
              <Contadores itens={dentro} />
            </>
          )}
          {bolha.item.tem_print && <p className="mute">📎 Tem print anexado como evidência.</p>}
          <button type="button" className="btn sm" onClick={() => aoAbrirItem(bolha.item!)}>
            Abrir na aba {bolha.item.area}
          </button>
        </>
      )}

      {aoVoltar && (
        <button type="button" className="btn ghost sm" onClick={aoVoltar}>
          ← Voltar ao resumo geral
        </button>
      )}
    </aside>
  )
}

interface PropsBloco {
  area: Area
  todosDaArea: Item[]
  visiveis: Item[]
  buscando: boolean
  recolhidos: Set<string>
  aoAlternar: (chave: string) => void
  aoAbrir: (id: string) => void
  aoAbrirArea: () => void
}

// Uma área como "raiz" da árvore geral, com os sistemas dela pendurados
function BlocoArea(p: PropsBloco) {
  // Na busca, área sem resultado some, e tudo fica expandido para mostrar os caminhos
  if (p.buscando && !p.visiveis.length) return null
  const recolhida = !p.buscando && p.recolhidos.has(`area:${p.area}`)

  return (
    <div className="nd ag">
      <div className="rw">
        <button
          type="button"
          className="tg"
          aria-expanded={!recolhida}
          aria-label={`${recolhida ? 'Expandir' : 'Recolher'} ${p.area}`}
          onClick={() => p.aoAlternar(`area:${p.area}`)}
          disabled={p.buscando}
        >
          {recolhida ? '+' : '−'}
        </button>
        <button type="button" className="rb" onClick={p.aoAbrirArea}>
          <span className="rt">
            <span className="rn">
              <ChipArea area={p.area} /> {DESCRICAO_AREA[p.area]}
            </span>
            <span className="rd">{p.todosDaArea.length} itens · abrir a aba {p.area}</span>
          </span>
          <span className="rm">
            <Contadores itens={p.todosDaArea} />
          </span>
        </button>
      </div>

      {!recolhida && (
        <div className="kids">
          <Arvore
            itens={p.visiveis}
            selecionado={null}
            recolhidos={p.buscando ? new Set() : p.recolhidos}
            aoSelecionar={p.aoAbrir}
            aoAlternar={p.aoAlternar}
          />
        </div>
      )}
    </div>
  )
}
