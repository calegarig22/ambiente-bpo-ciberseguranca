import { useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import AdicionarItem from '../componentes/AdicionarItem'
import Arvore from '../componentes/Arvore'
import { Contadores } from '../componentes/Estados'
import PainelDetalhes from '../componentes/PainelDetalhes'
import { DESCRICAO_AREA, ehArea, podeVerArea } from '../lib/dominio'
import { filhosDe, useItens } from '../lib/itens'
import { useSessao } from '../lib/sessao'
import NaoEncontrada from './NaoEncontrada'

// Tela de uma área (/area/:nome): árvore recolhível e painel de detalhes.
// O item selecionado fica na URL (?item=id), então dá para abrir direto
// da visão geral e o botão "voltar" do navegador funciona.
export default function Area() {
  const { nome } = useParams()
  const { usuario } = useSessao()
  const { itens, carregando, erro } = useItens()
  const [busca, setBusca] = useSearchParams()
  const [recolhidos, setRecolhidos] = useState<Set<string>>(new Set())
  const refDetalhes = useRef<HTMLDivElement>(null)

  // Se alguém digitar uma área que não existe na URL, mostra "não encontrada"
  if (!ehArea(nome)) return <NaoEncontrada />

  // Coordenador tentando abrir outra área pela URL
  if (usuario && !podeVerArea(usuario, nome)) {
    return (
      <>
        <h1>Sem acesso</h1>
        <p className="lead">
          Seu login é da área {usuario.area}. <Link to={`/area/${usuario.area}`}>Ir para {usuario.area}</Link>.
        </p>
      </>
    )
  }

  if (carregando) return <p className="mute">Carregando…</p>
  if (erro) return <p className="err">{erro}</p>

  const daArea = itens.filter((i) => i.area === nome)
  const selecionado = daArea.find((i) => i.id === busca.get('item')) ?? null

  function selecionar(id: string) {
    setBusca({ item: id }, { replace: true })
    // Em telas estreitas o painel fica abaixo da árvore: rola até ele
    if (window.innerWidth <= 1100) {
      requestAnimationFrame(() => refDetalhes.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
    }
  }

  function alternar(id: string) {
    setRecolhidos((atual) => {
      const novo = new Set(atual)
      if (novo.has(id)) novo.delete(id)
      else novo.add(id)
      return novo
    })
  }

  function recolherTudo() {
    setRecolhidos(new Set(daArea.filter((i) => filhosDe(daArea, i.id).length).map((i) => i.id)))
  }

  return (
    <>
      <div className="ahead">
        <div>
          <h1>{nome}</h1>
          <p className="lead" style={{ marginBottom: 10 }}>
            {DESCRICAO_AREA[nome]}. {daArea.length} itens.
          </p>
          <Contadores itens={daArea} />
        </div>
        <div className="acts">
          <button type="button" className="btn ghost sm" onClick={recolherTudo}>
            Recolher tudo
          </button>
          <button type="button" className="btn ghost sm" onClick={() => setRecolhidos(new Set())}>
            Expandir tudo
          </button>
        </div>
      </div>

      <div className="cols" style={{ marginTop: 16 }}>
        <div>
          <Arvore
            itens={daArea}
            selecionado={selecionado?.id ?? null}
            recolhidos={recolhidos}
            aoSelecionar={selecionar}
            aoAlternar={alternar}
          />
          {daArea.length === 0 && <p className="mute">Nenhum item nesta área ainda.</p>}
          <AdicionarItem area={nome} itensDaArea={daArea} aoCriar={selecionar} />
        </div>

        <div className="det" ref={refDetalhes}>
          {selecionado ? (
            <PainelDetalhes
              key={selecionado.id}
              item={selecionado}
              itensDaArea={daArea}
              aoSelecionar={selecionar}
              aoRemover={() => setBusca({}, { replace: true })}
            />
          ) : (
            <div className="box">
              <h3>Detalhes</h3>
              <p className="mute" style={{ margin: 0 }}>
                Selecione um item da árvore para ver e editar os detalhes.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
