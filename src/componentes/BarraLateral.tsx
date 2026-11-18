import { NavLink } from 'react-router-dom'
import { INFO_CATEGORIA, NOME_PAPEL, areasDoUsuario } from '../lib/dominio'
import { useItens } from '../lib/itens'
import { useSessao } from '../lib/sessao'

// Barra lateral fixa: "Visão geral", as áreas que o usuário pode ver e,
// para o Admin, a aba "Admin". Em telas estreitas o CSS transforma a barra
// numa linha de botões no topo. O NavLink marca o link ativo com
// aria-current="page", que o CSS usa para destacar.
export default function BarraLateral() {
  const { usuario, sair } = useSessao()
  const { itens, carregando } = useItens()
  // A barra só aparece dentro de RotaProtegida, então sempre há usuário
  if (!usuario) return null

  return (
    <nav className="side" aria-label="Áreas">
      <div className="brand">
        Ambiente da BPO financeira
        <span>Exemplo fictício</span>
      </div>

      {/* "end" faz a Visão geral ficar ativa só em "/", e não em "/area/..." */}
      <NavLink to="/" end className="nv">
        Visão geral
      </NavLink>
      <NavLink to="/arvore" className="nv">
        Árvore geral
      </NavLink>

      <span className="nv-grupo">Áreas</span>
      {areasDoUsuario(usuario).map((area) => (
        <NavLink key={area} to={`/area/${area}`} className="nv">
          <span>{area}</span>
          {/* Itens que não estão "Em ordem" (atenção + pendente) */}
          {!carregando && (
            <small>{itens.filter((i) => i.area === area && i.estado !== 'ok').length} em aberto</small>
          )}
        </NavLink>
      ))}

      {/* Documentação: políticas, inventário (com infraestrutura), BIA e DRP */}
      <span className="nv-grupo">Documentação</span>
      <NavLink to="/enviar" className="nv nv-destaque">
        ⇪ Enviar arquivos
      </NavLink>
      <NavLink to="/documentos/politica" className="nv">
        {INFO_CATEGORIA.politica.menu}
      </NavLink>
      <NavLink to="/inventario" className="nv">
        Inventário e infraestrutura
      </NavLink>
      <NavLink to="/documentos/bia" className="nv">
        {INFO_CATEGORIA.bia.menu}
      </NavLink>
      <NavLink to="/documentos/drp" className="nv">
        {INFO_CATEGORIA.drp.menu}
      </NavLink>

      {usuario.papel === 'admin' && (
        <NavLink to="/admin" className="nv">
          Admin
        </NavLink>
      )}

      <div className="quem">
        <span>{usuario.nome}</span>
        <small>{NOME_PAPEL[usuario.papel]} · {usuario.area}</small>
      </div>
      <button className="btn ghost sm" type="button" onClick={sair}>
        Sair
      </button>
    </nav>
  )
}
