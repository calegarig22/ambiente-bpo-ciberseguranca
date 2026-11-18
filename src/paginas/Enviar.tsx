import Importador from '../componentes/Importador'

// Enviar arquivos (/enviar): o lugar único para soltar qualquer coisa.
// A IA descobre se é política, infraestrutura, BIA, DRP ou lista de ativos
// e manda para a página certa depois que a pessoa confere.
export default function Enviar() {
  return (
    <>
      <h1>Enviar arquivos</h1>
      <p className="lead">
        Solte aqui políticas, documentos de infraestrutura, BIA, DRP ou listas de ativos (planilha, PDF, DOCX
        ou foto). A IA lê, descobre do que se trata e preenche tudo. Você só confere e salva.
      </p>
      <Importador dica="geral" />
    </>
  )
}
