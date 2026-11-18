import { useEffect, useState } from 'react'
import { apiGet, apiPost } from '../lib/api'

type Contagem = { itens: number; documentos: number }

// "Zona de perigo" da aba Admin: apagar em massa o inventário e/ou os
// documentos, para começar com os dados reais.
// Exige digitar APAGAR. Usuários nunca são apagados.
export default function ApagarDados() {
  const [contagem, setContagem] = useState<Contagem | null>(null)
  const [marcados, setMarcados] = useState({ itens: true, documentos: false })
  const [confirmacao, setConfirmacao] = useState('')
  const [aviso, setAviso] = useState<{ texto: string; bom: boolean } | null>(null)
  const [apagando, setApagando] = useState(false)

  useEffect(() => {
    apiGet<{ contagem: Contagem }>('limpar')
      .then((r) => setContagem(r.contagem))
      .catch(() => {})
  }, [])

  async function apagar() {
    setApagando(true)
    setAviso(null)
    try {
      const r = await apiPost<{ apagados: Contagem }>('limpar', { ...marcados, confirmacao })
      const a = r.apagados
      setAviso({
        texto: `Apagados: ${a.itens} itens do inventário e ${a.documentos} documentos. Atualizando a página…`,
        bom: true,
      })
      // Recarrega para todas as telas (barra lateral, árvore...) mostrarem o banco vazio
      setTimeout(() => window.location.reload(), 1500)
    } catch (e) {
      setAviso({ texto: (e as Error).message, bom: false })
      setApagando(false)
    }
  }

  const opcoes: { chave: keyof Contagem; nome: string; detalhe: string }[] = [
    { chave: 'itens', nome: 'Inventário', detalhe: 'sistemas/ativos, configurações e regras de todas as áreas, com os prints' },
    { chave: 'documentos', nome: 'Documentos', detalhe: 'políticas, infraestrutura, BIA e DRP, com os arquivos anexados' },
  ]
  const algumMarcado = marcados.itens || marcados.documentos

  return (
    <div className="box perigo">
      <h2>Apagar dados</h2>
      <p className="mute">
        Use para tirar os dados de exemplo e começar com os dados reais. Não dá para desfazer pela tela
        (os 71 itens de exemplo podem voltar com <code>npm run db:seed</code>). Os usuários não são apagados.
      </p>

      <div className="perigo-opcoes">
        {opcoes.map((o) => (
          <label key={o.chave} className="perigo-opcao">
            <input
              type="checkbox"
              checked={marcados[o.chave]}
              onChange={(e) => setMarcados((m) => ({ ...m, [o.chave]: e.target.checked }))}
            />
            <span>
              <strong>
                {o.nome}
                {contagem && ` (${contagem[o.chave]})`}
              </strong>
              <small>{o.detalhe}</small>
            </span>
          </label>
        ))}
      </div>

      <div className="f" style={{ maxWidth: 320 }}>
        <label htmlFor="conf-apagar">
          Para confirmar, digite <strong>APAGAR</strong>
        </label>
        <input
          id="conf-apagar"
          autoComplete="off"
          value={confirmacao}
          onChange={(e) => setConfirmacao(e.target.value)}
        />
      </div>

      <div className="acts">
        <button
          type="button"
          className="btn danger"
          disabled={apagando || confirmacao !== 'APAGAR' || !algumMarcado}
          onClick={apagar}
        >
          {apagando ? 'Apagando…' : 'Apagar o que está marcado'}
        </button>
      </div>
      <div className={`err${aviso?.bom ? ' good' : ''}`} role="alert">
        {aviso?.texto}
      </div>
    </div>
  )
}
