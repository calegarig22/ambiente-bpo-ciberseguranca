import { useState, type FormEvent } from 'react'
import { ESTADOS, NOME_ESTADO, type Area, type Estado, type Item, type Tipo } from '../lib/dominio'
import { useItens } from '../lib/itens'

interface Props {
  area: Area
  itensDaArea: Item[]
  aoCriar: (id: string) => void // seleciona o item novo na árvore
}

// Formulário "Adicionar item". O campo "faz parte de" mostra sistemas
// (para uma configuração) ou configurações (para uma regra) desta área.
// Sistema novo não tem pai.
export default function AdicionarItem({ area, itensDaArea, aoCriar }: Props) {
  const { criar } = useItens()
  const [tipo, setTipo] = useState<Tipo>('sistema')
  const [paiEscolhido, setPaiEscolhido] = useState('')
  const [nome, setNome] = useState('')
  const [estado, setEstado] = useState<Estado>('pendente')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  // Quais itens podem ser pai do tipo escolhido
  const tipoDoPai = tipo === 'config' ? 'sistema' : 'config'
  const opcoesDePai = tipo === 'sistema' ? [] : itensDaArea.filter((i) => i.tipo === tipoDoPai)
  // Se o pai escolhido não serve mais (trocou o tipo), usa o primeiro da lista
  const pai = opcoesDePai.some((i) => i.id === paiEscolhido) ? paiEscolhido : (opcoesDePai[0]?.id ?? '')

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setErro('')
    if (!nome.trim()) return setErro('Dê um nome ao item antes de adicionar.')
    if (tipo !== 'sistema' && !pai) {
      return setErro(
        tipo === 'config'
          ? 'Crie um sistema antes: toda configuração fica dentro de um sistema.'
          : 'Crie uma configuração antes: toda regra fica dentro de uma configuração.',
      )
    }
    setEnviando(true)
    try {
      const novo = await criar({ area, tipo, pai_id: tipo === 'sistema' ? null : pai, nome: nome.trim(), estado })
      setNome('')
      aoCriar(novo.id)
    } catch (err) {
      setErro((err as Error).message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <details className="add">
      <summary>Adicionar item</summary>
      <form className="box" onSubmit={enviar}>
        <div className="form">
          <select aria-label="Tipo" value={tipo} onChange={(e) => setTipo(e.target.value as Tipo)}>
            <option value="sistema">Sistema</option>
            <option value="config">Configuração</option>
            <option value="regra">Regra</option>
          </select>
          <select
            aria-label="Faz parte de"
            value={pai}
            disabled={tipo === 'sistema'}
            onChange={(e) => setPaiEscolhido(e.target.value)}
          >
            {tipo === 'sistema' && <option value="">Sistema novo, sem origem</option>}
            {tipo !== 'sistema' && !opcoesDePai.length && <option value="">Nenhum item disponível</option>}
            {opcoesDePai.map((i) => (
              <option key={i.id} value={i.id}>
                {i.nome}
              </option>
            ))}
          </select>
          <input
            aria-label="Nome do item"
            placeholder="Nome do item"
            maxLength={200}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
          <select aria-label="Estado" value={estado} onChange={(e) => setEstado(e.target.value as Estado)}>
            {ESTADOS.map((e) => (
              <option key={e} value={e}>
                {NOME_ESTADO[e]}
              </option>
            ))}
          </select>
        </div>
        <div className="acts" style={{ marginTop: 10 }}>
          <button className="btn sm" type="submit" disabled={enviando}>
            {enviando ? 'Adicionando…' : 'Adicionar'}
          </button>
        </div>
        <div className="err" role="alert">
          {erro}
        </div>
      </form>
    </details>
  )
}
