import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSessao } from '../lib/sessao'

// Só deixa passar quem está logado. Quem não está vai para /login,
// e depois de entrar volta para a página que tentou abrir.
// "soAdmin" fecha a rota para coordenadores.
// Isto só organiza a interface: quem barra os dados de verdade é a API.
export default function RotaProtegida({ soAdmin = false }: { soAdmin?: boolean }) {
  const { usuario, carregando } = useSessao()
  const local = useLocation()

  if (carregando) return <p className="mute" style={{ padding: 24 }}>Carregando…</p>
  if (!usuario) return <Navigate to="/login" replace state={{ de: local.pathname }} />
  if (soAdmin && usuario.papel !== 'admin') return <Navigate to="/" replace />
  return <Outlet />
}
