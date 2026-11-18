import { useNavigate } from 'react-router-dom'
import { NOME_CLASSIFICACAO, NOME_CRITICIDADE, NOME_TIPO_ATIVO, type Criticidade, type Item } from '../lib/dominio'
import { ChipArea, ChipEstado } from './Chips'

// Selo da criticidade com as mesmas cores dos estados
const CLASSE_CRITICIDADE: Record<Criticidade, string> = {
  alta: 'es e-pendente',
  media: 'es e-atencao',
  baixa: 'es e-ok',
}

// Tabela do inventário de sistemas (sistemas e ativos são a mesma coisa).
// "completo" mostra também dono, localização e classificação dos dados.
// Clicar no nome abre o sistema na aba da área dele.
export default function TabelaInventario({ sistemas, completo = false }: { sistemas: Item[]; completo?: boolean }) {
  const navegar = useNavigate()

  if (!sistemas.length) return <p className="mute" style={{ margin: 0 }}>Nenhum sistema no inventário ainda.</p>

  return (
    <div className="mwrap">
      <table>
        <thead>
          <tr>
            <th>Área</th>
            <th>Sistema</th>
            <th>Tipo</th>
            <th>Ferramenta</th>
            <th>Fornecedor</th>
            <th>Versão</th>
            {completo && <th>Dono</th>}
            {completo && <th>Localização</th>}
            {completo && <th>Classificação</th>}
            <th>Criticidade</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {sistemas.map((i) => (
            <tr key={i.id}>
              <td>
                <ChipArea area={i.area} />
              </td>
              <td>
                <button type="button" onClick={() => navegar(`/area/${i.area}?item=${i.id}`)}>
                  {i.nome}
                </button>
              </td>
              <td>{i.tipo_ativo ? NOME_TIPO_ATIVO[i.tipo_ativo] : ''}</td>
              <td>{i.ferramenta}</td>
              <td>{i.fornecedor}</td>
              <td>{i.versao}</td>
              {completo && <td>{i.dono}</td>}
              {completo && <td>{i.localizacao}</td>}
              {completo && <td>{i.classificacao ? NOME_CLASSIFICACAO[i.classificacao] : ''}</td>}
              <td>
                {i.criticidade && <span className={CLASSE_CRITICIDADE[i.criticidade]}>{NOME_CRITICIDADE[i.criticidade]}</span>}
              </td>
              <td>
                <ChipEstado estado={i.estado} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
