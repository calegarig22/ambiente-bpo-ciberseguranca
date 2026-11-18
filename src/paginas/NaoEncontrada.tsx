import { Link } from 'react-router-dom'

export default function NaoEncontrada() {
  return (
    <>
      <h1>Página não encontrada</h1>
      <p className="lead">
        Esse endereço não existe. <Link to="/">Voltar para a visão geral</Link>.
      </p>
    </>
  )
}
