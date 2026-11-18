import { useState, type FocusEvent } from 'react'
import {
  ESTADOS,
  NOME_CLASSIFICACAO,
  NOME_CRITICIDADE,
  NOME_ESTADO,
  NOME_TIPO,
  NOME_TIPO_ATIVO,
  type CamposEditaveis,
  type Item,
} from '../lib/dominio'
import { filhosDe, idsDaSubarvore, useItens } from '../lib/itens'
import { ChipArea, ChipEstado } from './Chips'
import DialogoConfirmar from './DialogoConfirmar'

interface Props {
  item: Item
  itensDaArea: Item[]
  aoSelecionar: (id: string) => void
  aoRemover: () => void // limpa a seleção depois que o item some
}

// Rótulo do campo "detalhe", que muda de sentido conforme o tipo do item
const ROTULO_DETALHE = { sistema: 'Função', config: 'Como está configurado', regra: 'Observação' }

// Painel à direita da árvore: editar textos, trocar o estado, navegar para
// pai e filhos. Os campos salvam sozinhos quando o cursor sai deles.
// Quem usa este painel passa key={item.id}, então ao trocar de item os
// campos começam de novo com os valores certos.
export default function PainelDetalhes({ item, itensDaArea, aoSelecionar, aoRemover }: Props) {
  const { editar, remover } = useItens()
  const [confirmando, setConfirmando] = useState(false)
  const [removendo, setRemovendo] = useState(false)
  const [aviso, setAviso] = useState<{ texto: string; bom: boolean } | null>(null)

  const pai = itensDaArea.find((i) => i.id === item.pai_id)
  const filhos = filhosDe(itensDaArea, item.id)

  async function salvar(campos: CamposEditaveis) {
    setAviso({ texto: 'Salvando…', bom: true })
    try {
      await editar(item.id, campos)
      setAviso({ texto: 'Salvo.', bom: true })
    } catch (e) {
      setAviso({ texto: (e as Error).message, bom: false })
    }
  }

  // Quantos itens somem junto (o próprio item conta, por isso o -1)
  const qtdDentro = idsDaSubarvore(itensDaArea, item.id).size - 1

  async function confirmarRemocao() {
    setRemovendo(true)
    try {
      await remover(item.id)
      setConfirmando(false)
      aoRemover()
    } catch (e) {
      setAviso({ texto: (e as Error).message, bom: false })
      setConfirmando(false)
      setRemovendo(false)
    }
  }

  // Ao sair de um campo de texto: salva só se o valor mudou
  function aoSairDoCampo(campo: 'nome' | 'detalhe' | 'ferramenta' | 'fornecedor' | 'versao' | 'dono' | 'localizacao') {
    return (e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const valor = e.target.value.trim()
      if (valor === item[campo]) return
      if (campo === 'nome' && !valor) {
        e.target.value = item.nome // nome vazio não vale: volta o anterior
        setAviso({ texto: 'O nome não pode ficar vazio.', bom: false })
        return
      }
      salvar({ [campo]: valor })
    }
  }

  return (
    <div className="box">
      <div className="dh">
        <ChipArea area={item.area} />
        <span className="chip">{NOME_TIPO[item.tipo]}</span>
        <ChipEstado estado={item.estado} />
      </div>

      <div className="f">
        <label htmlFor="d-nome">Nome</label>
        <input id="d-nome" defaultValue={item.nome} maxLength={200} onBlur={aoSairDoCampo('nome')} />
      </div>
      <div className="f">
        <label htmlFor="d-det">{ROTULO_DETALHE[item.tipo]}</label>
        <textarea id="d-det" defaultValue={item.detalhe} maxLength={2000} onBlur={aoSairDoCampo('detalhe')} />
      </div>

      {item.tipo === 'sistema' && (
        <>
          <div className="f">
            <label htmlFor="d-fer">Ferramenta</label>
            <input id="d-fer" defaultValue={item.ferramenta} maxLength={120} onBlur={aoSairDoCampo('ferramenta')} />
          </div>
          <div className="f">
            <label htmlFor="d-forn">Fornecedor</label>
            <input id="d-forn" defaultValue={item.fornecedor} maxLength={120} onBlur={aoSairDoCampo('fornecedor')} />
          </div>
          <div className="f">
            <label htmlFor="d-ver">Versão</label>
            <input id="d-ver" defaultValue={item.versao} maxLength={120} onBlur={aoSairDoCampo('versao')} />
          </div>

          {/* Dados de inventário: as listas salvam assim que muda a opção */}
          <div className="form" style={{ margin: 0 }}>
            <div className="f">
              <label htmlFor="d-tipoat">Tipo</label>
              <select
                id="d-tipoat"
                value={item.tipo_ativo ?? ''}
                onChange={(e) => salvar({ tipo_ativo: (e.target.value || null) as Item['tipo_ativo'] })}
              >
                <option value="">—</option>
                {Object.entries(NOME_TIPO_ATIVO).map(([v, n]) => (
                  <option key={v} value={v}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <div className="f">
              <label htmlFor="d-crit">Criticidade</label>
              <select
                id="d-crit"
                value={item.criticidade ?? ''}
                onChange={(e) => salvar({ criticidade: (e.target.value || null) as Item['criticidade'] })}
              >
                <option value="">—</option>
                {Object.entries(NOME_CRITICIDADE).map(([v, n]) => (
                  <option key={v} value={v}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <div className="f">
              <label htmlFor="d-class">Classificação dos dados</label>
              <select
                id="d-class"
                value={item.classificacao ?? ''}
                onChange={(e) => salvar({ classificacao: (e.target.value || null) as Item['classificacao'] })}
              >
                <option value="">—</option>
                {Object.entries(NOME_CLASSIFICACAO).map(([v, n]) => (
                  <option key={v} value={v}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="f">
            <label htmlFor="d-dono">Dono (pessoa ou equipe)</label>
            <input id="d-dono" defaultValue={item.dono} maxLength={120} onBlur={aoSairDoCampo('dono')} />
          </div>
          <div className="f">
            <label htmlFor="d-local">Localização</label>
            <input id="d-local" defaultValue={item.localizacao} maxLength={120} onBlur={aoSairDoCampo('localizacao')} />
          </div>
        </>
      )}

      <div className="f">
        <span className="lab" id="d-est">
          Estado
        </span>
        <div className="seg" role="group" aria-labelledby="d-est">
          {ESTADOS.map((e) => (
            <button
              key={e}
              type="button"
              className={`e-${e}`}
              aria-pressed={item.estado === e}
              onClick={() => item.estado !== e && salvar({ estado: e })}
            >
              {NOME_ESTADO[e]}
            </button>
          ))}
        </div>
      </div>

      {pai && (
        <div className="f">
          <span className="lab">Faz parte de</span>
          <button type="button" className="lk" onClick={() => aoSelecionar(pai.id)}>
            <span className="chip">{NOME_TIPO[pai.tipo]}</span>
            <span className="ln">{pai.nome}</span>
          </button>
        </div>
      )}

      {filhos.length > 0 && (
        <div className="f">
          <span className="lab">Contém</span>
          {filhos.map((f) => (
            <button key={f.id} type="button" className="lk" onClick={() => aoSelecionar(f.id)}>
              <span className="chip">{NOME_TIPO[f.tipo]}</span>
              <span className="ln">{f.nome}</span>
            </button>
          ))}
        </div>
      )}

      <div className={`err${aviso?.bom ? ' good' : ''}`} role="status">
        {aviso?.texto}
      </div>

      <button type="button" className="btn danger sm" onClick={() => setConfirmando(true)}>
        Remover item{filhos.length > 0 && ' e o que está dentro dele'}
      </button>

      <DialogoConfirmar
        aberto={confirmando}
        titulo="Remover item?"
        rotuloConfirmar="Remover"
        ocupado={removendo}
        aoConfirmar={confirmarRemocao}
        aoCancelar={() => setConfirmando(false)}
      >
        <p>
          <strong>{item.nome}</strong> será removido
          {qtdDentro > 0 && ` junto com ${qtdDentro} ${qtdDentro === 1 ? 'item' : 'itens'} que estão dentro dele`}
          . Não dá para desfazer.
        </p>
      </DialogoConfirmar>
    </div>
  )
}
