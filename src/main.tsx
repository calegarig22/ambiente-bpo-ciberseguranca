import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import ProvedorSessao from './componentes/ProvedorSessao'
import './estilos/global.css'

// Ponto de entrada: liga o React à <div id="root"> do index.html,
// envolve a aplicação no roteador (navegação sem recarregar a página)
// e no provedor de sessão (quem está logado).
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ProvedorSessao>
        <App />
      </ProvedorSessao>
    </BrowserRouter>
  </StrictMode>,
)
