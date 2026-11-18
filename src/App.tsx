import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './componentes/Layout'
import RotaProtegida from './componentes/RotaProtegida'
import Admin from './paginas/Admin'
import Area from './paginas/Area'
import ArvoreGeral from './paginas/ArvoreGeral'
import Documentos from './paginas/Documentos'
import Enviar from './paginas/Enviar'
import Inventario from './paginas/Inventario'
import Login from './paginas/Login'
import NaoEncontrada from './paginas/NaoEncontrada'
import VisaoGeral from './paginas/VisaoGeral'

// Mapa de rotas da aplicação.
// O login fica fora do Layout porque não mostra a barra lateral.
// Todo o resto exige login (RotaProtegida), e /admin exige ser Admin.
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<RotaProtegida />}>
        <Route element={<Layout />}>
          <Route path="/" element={<VisaoGeral />} />
          <Route path="/arvore" element={<ArvoreGeral />} />
          <Route path="/area/:nome" element={<Area />} />
          {/* Infraestrutura e ativos agora fazem parte do inventário único */}
          <Route path="/documentos/infraestrutura" element={<Navigate to="/inventario" replace />} />
          <Route path="/documentos/:categoria" element={<Documentos />} />
          <Route path="/inventario" element={<Inventario />} />
          <Route path="/ativos" element={<Navigate to="/inventario" replace />} />
          <Route path="/enviar" element={<Enviar />} />
          <Route element={<RotaProtegida soAdmin />}>
            <Route path="/admin" element={<Admin />} />
          </Route>
          <Route path="*" element={<NaoEncontrada />} />
        </Route>
      </Route>
    </Routes>
  )
}
