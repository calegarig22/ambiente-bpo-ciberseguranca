import { Link, useNavigate } from 'react-router-dom'
import { ChipArea } from '../componentes/Chips'
import TabelaInventario from '../componentes/TabelaInventario'
import { BarraEstados, Contadores } from '../componentes/Estados'
import { DESCRICAO_AREA, NOME_TIPO, areasDoUsuario, type Item } from '../lib/dominio'
import { useItens } from '../lib/itens'
import { useSessao } from '../lib/sessao'

const MAXIMO_NA_LISTA = 8

// Lista curta de itens (até 8), com aviso de quantos existem no total
function Lista({ lista, abrir }: { lista: Item[]; abrir: (i: Item) => void }) {
  if (!lista.length) return <p className="mute" style={{ margin: 0 }}>Nada por aqui.</p>
  return (
    <>
      {lista.slice(0, MAXIMO_NA_LISTA).map((i) => (
        <button key={i.id} type="button" className="li" onClick={() => abrir(i)}>
          <ChipArea area={i.area} />
          <span className="ln">{i.nome}</span>
          <span className="chip">{NOME_TIPO[i.tipo]}</span>
        </button>
      ))}
      {lista.length > MAXIMO_NA_LISTA && (
        <p className="mute" style={{ margin: '8px 0 0', fontSize: 13.5 }}>
          Mostrando {MAXIMO_NA_LISTA} de {lista.length}. O restante está na árvore de cada área.
        </p>
      )}
    </>
  )
}

// Tela inicial (/): painéis por área, listas de pendentes e em atenção,
// e a tabela com todos os sistemas.
export default function VisaoGeral() {
  const { usuario } = useSessao()
  const { itens, carregando, erro } = useItens()
  const navegar = useNavigate()

  if (carregando) return <p className="mute">Carregando…</p>
  if (erro) return <p className="err">{erro}</p>
  if (!usuario) return null

  const areas = areasDoUsuario(usuario)
  const pendentes = itens.filter((i) => i.estado === 'pendente')
  const emAtencao = itens.filter((i) => i.estado === 'atencao')
  const sistemas = itens.filter((i) => i.tipo === 'sistema')

  // Abre a área do item já com ele selecionado (?item=id na URL)
  function abrir(i: Item) {
    navegar(`/area/${i.area}?item=${i.id}`)
  }

  return (
    <>
      <h1>Visão geral do ambiente</h1>
      <p className="lead">
        {itens.length} itens em {areas.length === 1 ? '1 área' : `${areas.length} áreas`}. Cada área tem
        sistemas, as configurações deles e as regras que valem por causa dessas configurações.
      </p>

      <div className="tiles">
        {areas.map((a) => {
          const daArea = itens.filter((i) => i.area === a)
          const nSistemas = daArea.filter((i) => i.tipo === 'sistema').length
          return (
            <button key={a} type="button" className="tile" onClick={() => navegar(`/area/${a}`)}>
              <b>{a}</b>
              <span className="d">{DESCRICAO_AREA[a]}</span>
              <BarraEstados itens={daArea} />
              <span className="mute" style={{ fontSize: 13.5 }}>
                {nSistemas} sistemas, {daArea.length} itens
              </span>
              <Contadores itens={daArea} />
            </button>
          )
        })}
      </div>

      <div className="cols2">
        <div className="box">
          <h2>
            Pendentes <span className="es e-pendente">{pendentes.length}</span>
          </h2>
          <Lista lista={pendentes} abrir={abrir} />
        </div>
        <div className="box">
          <h2>
            Em atenção <span className="es e-atencao">{emAtencao.length}</span>
          </h2>
          <Lista lista={emAtencao} abrir={abrir} />
        </div>
      </div>

      <div className="box">
        <h2>
          Inventário de sistemas <span className="chip">{sistemas.length}</span>
        </h2>
        <TabelaInventario sistemas={sistemas} />
        <p style={{ margin: '10px 0 0', fontSize: 13.5 }}>
          <Link to="/inventario">Ver inventário completo e infraestrutura →</Link>
        </p>
      </div>
    </>
  )
}
