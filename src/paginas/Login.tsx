import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useSessao } from '../lib/sessao'

export default function Login() {
  const { usuario, carregando, entrar } = useSessao()
  const navegar = useNavigate()
  const local = useLocation()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  // Página que a pessoa tentou abrir antes de cair no login
  const destino = (local.state as { de?: string } | null)?.de ?? '/'

  if (carregando) return null
  if (usuario) return <Navigate to={destino} replace />

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setErro('')
    setEnviando(true)
    try {
      await entrar(email, senha)
      navegar(destino, { replace: true })
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível entrar.')
      setEnviando(false)
    }
  }

  return (
    <div className="login">
      <form className="box" onSubmit={enviar}>
        <h1 style={{ fontSize: 24 }}>Entrar</h1>
        <p className="mute" style={{ margin: 0 }}>
          Ambiente da BPO financeira
        </p>
        <div className="f">
          <label htmlFor="l-email">E-mail</label>
          <input
            id="l-email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="f">
          <label htmlFor="l-senha">Senha</label>
          <input
            id="l-senha"
            type="password"
            autoComplete="current-password"
            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
        </div>
        <button className="btn" type="submit" disabled={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
        <div className="err" role="alert">
          {erro}
        </div>
      </form>
    </div>
  )
}
