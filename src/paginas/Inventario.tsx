import { useState } from 'react'
import Importador from '../componentes/Importador'
import TabelaInventario from '../componentes/TabelaInventario'
import { useItens } from '../lib/itens'
import { ListaDocumentos } from './Documentos'

// Inventário e infraestrutura (/inventario): o inventário único do ambiente.
// Sistemas e ativos são a mesma coisa (cada um é um "sistema" da sua área),
// e os documentos/diagramas de infraestrutura ficam logo abaixo.
export default function Inventario() {
  const { itens, carregando } = useItens()
  // Muda a cada envio, para a lista de documentos de infraestrutura recarregar
  const [envios, setEnvios] = useState(0)
  const sistemas = itens.filter((i) => i.tipo === 'sistema')

  return (
    <>
      <h1>Inventário e infraestrutura</h1>
      <p className="lead">
        Todos os sistemas e ativos do ambiente (servidores, equipamentos de rede, estações, aplicações, bancos de
        dados, serviços em nuvem) e os documentos de infraestrutura. Solte uma planilha ou foto com a lista, ou um
        diagrama, e a IA preenche.
      </p>

      <Importador dica="inventario" aoSalvar={() => setEnvios((n) => n + 1)} />

      <div className="box" style={{ marginTop: 8 }}>
        <h2>
          Inventário de sistemas {!carregando && <span className="chip">{sistemas.length}</span>}
        </h2>
        {carregando ? <p className="mute">Carregando…</p> : <TabelaInventario sistemas={sistemas} completo />}
        <p className="mute" style={{ margin: '10px 0 0', fontSize: 13.5 }}>
          Clique no nome para editar o sistema (tipo, dono, criticidade, estado…) e ver as configurações e regras dele.
          Para criar um à mão, use “Adicionar item” na aba da área.
        </p>
      </div>

      <ListaDocumentos key={envios} categoria="infraestrutura" embutido />
    </>
  )
}
