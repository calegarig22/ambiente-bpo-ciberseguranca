import { Outlet, useLocation } from 'react-router-dom'
import BarraLateral from './BarraLateral'
import ProvedorItens from './ProvedorItens'

// Moldura comum das telas internas: barra lateral + conteúdo da rota atual.
export default function Layout() {
  const local = useLocation()

  return (
    // ProvedorItens fica aqui dentro: só carrega itens depois do login
    <ProvedorItens>
      <div className="app">
        <BarraLateral />
        {/* A key muda a cada rota, então o <main> é recriado e a transição de opacidade roda de novo */}
        <main key={local.pathname}>
          <Outlet />
          <p className="note">
            Ambiente fictício criado para o projeto. Ferramentas, fornecedores e versões são de exemplo.
          </p>
        </main>
      </div>
    </ProvedorItens>
  )
}
