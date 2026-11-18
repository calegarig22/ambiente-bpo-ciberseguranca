import { NOME_TIPO, type Item } from '../lib/dominio'
import { filhosDe } from '../lib/itens'
import { ChipEstado } from './Chips'

interface Props {
  itens: Item[] // só os itens da área
  selecionado: string | null
  recolhidos: Set<string> // ids dos itens com os filhos escondidos
  aoSelecionar: (id: string) => void
  aoAlternar: (id: string) => void // recolher ou expandir um item
}

// Árvore da área: sistema → configurações → regras.
// As linhas que ligam pai e filhos são desenhadas só com CSS (classes .kids e .nd,
// copiadas do protótipo), sem JavaScript medindo posições.
export default function Arvore(props: Props) {
  // Raízes: sistemas (ou, por segurança, itens cujo pai não está na lista)
  const ids = new Set(props.itens.map((i) => i.id))
  const raizes = props.itens.filter((i) => !i.pai_id || !ids.has(i.pai_id))

  // Fragmento (<>), e não <div>: assim a árvore pode ficar direto dentro de um
  // .kids (na Árvore geral) e as linhas de ligação do CSS continuam funcionando
  return (
    <>
      {raizes.map((r) => (
        <No key={r.id} item={r} profundidade={0} {...props} />
      ))}
    </>
  )
}

// Um item da árvore e, se não estiver recolhido, os filhos dele (recursivo)
function No({ item, profundidade, ...props }: Props & { item: Item; profundidade: number }) {
  const filhos = filhosDe(props.itens, item.id)
  const recolhido = props.recolhidos.has(item.id)
  const selecionado = props.selecionado === item.id

  return (
    <div className={`nd d${Math.min(profundidade, 2)}`}>
      <div className={`rw${selecionado ? ' sel' : ''}`}>
        {filhos.length ? (
          <button
            type="button"
            className="tg"
            aria-expanded={!recolhido}
            aria-label={`${recolhido ? 'Expandir' : 'Recolher'} ${item.nome}`}
            onClick={() => props.aoAlternar(item.id)}
          >
            {recolhido ? '+' : '−'}
          </button>
        ) : (
          <span className="sp" />
        )}

        <button
          type="button"
          className="rb"
          aria-current={selecionado ? 'true' : undefined}
          onClick={() => props.aoSelecionar(item.id)}
        >
          <span className={`dot d-${item.estado}`} />
          <span className="rt">
            <span className="rn">{item.nome}</span>
            {item.detalhe && <span className="rd">{item.detalhe}</span>}
          </span>
          <span className="rm">
            <ChipEstado estado={item.estado} />
            {item.tipo === 'sistema' ? (
              item.ferramenta && (
                <small>
                  {item.ferramenta}
                  {item.versao && ` ${item.versao}`}
                </small>
              )
            ) : (
              <small>{NOME_TIPO[item.tipo]}</small>
            )}
            {item.tem_print && <small>com print</small>}
          </span>
        </button>
      </div>

      {filhos.length > 0 && !recolhido && (
        <div className="kids">
          {filhos.map((f) => (
            <No key={f.id} item={f} profundidade={profundidade + 1} {...props} />
          ))}
        </div>
      )}
    </div>
  )
}
