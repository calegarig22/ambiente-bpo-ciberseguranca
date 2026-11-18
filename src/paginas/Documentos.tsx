import { useEffect, useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { ChipArea } from '../componentes/Chips'
import DialogoConfirmar from '../componentes/DialogoConfirmar'
import Importador from '../componentes/Importador'
import { apiDelete, apiEnviarArquivo, apiGet, apiPost } from '../lib/api'
import {
  INFO_CATEGORIA,
  MAX_ARQUIVO,
  NOME_STATUS,
  TIPOS_ARQUIVO,
  areasDoUsuario,
  ehCategoria,
  type Area,
  type Categoria,
  type Documento,
  type StatusDocumento,
} from '../lib/dominio'
import { dataBr, tamanho, tipoDoArquivo } from '../lib/formato'
import { useSessao } from '../lib/sessao'
import NaoEncontrada from './NaoEncontrada'

// Página de documentos de uma categoria (/documentos/politica, /infraestrutura, /bia, /drp).
// Cada documento é uma ficha simples com o arquivo (PDF, DOCX ou imagem) anexado.
export default function Documentos() {
  const { categoria } = useParams()
  if (!ehCategoria(categoria)) return <NaoEncontrada />
  // key: ao trocar de categoria, a lista recomeça do zero
  return <ListaDocumentos key={categoria} categoria={categoria} />
}

// Cor do selo de status (reaproveita as cores de estado)
const CLASSE_STATUS: Record<StatusDocumento, string> = {
  vigente: 'es e-ok',
  em_revisao: 'es e-atencao',
  rascunho: 'chip',
}

// "embutido": usada dentro de outra página (ex.: infraestrutura no Inventário),
// com um título menor e sem a área de soltar própria
export function ListaDocumentos({ categoria, embutido = false }: { categoria: Categoria; embutido?: boolean }) {
  const info = INFO_CATEGORIA[categoria]
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  // Qual ficha está aberta para edição: o id de um documento, ou null
  const [editando, setEditando] = useState<string | null>(null)
  const [removendo, setRemovendo] = useState<Documento | null>(null)

  // Busca a lista na API (ao abrir e depois de cada envio pelo importador)
  function recarregar() {
    return apiGet<{ documentos: Documento[] }>(`documentos?categoria=${categoria}`)
      .then((r) => setDocumentos(r.documentos))
      .catch((e: Error) => setErro(e.message))
      .finally(() => setCarregando(false))
  }

  useEffect(() => {
    apiGet<{ documentos: Documento[] }>(`documentos?categoria=${categoria}`)
      .then((r) => setDocumentos(r.documentos))
      .catch((e: Error) => setErro(e.message))
      .finally(() => setCarregando(false))
  }, [categoria])

  // Põe na lista a versão nova de um documento (criado ou alterado)
  function guardar(doc: Documento) {
    setDocumentos((lista) =>
      lista.some((d) => d.id === doc.id) ? lista.map((d) => (d.id === doc.id ? doc : d)) : [...lista, doc],
    )
    setEditando(null)
  }

  async function confirmarRemocao() {
    if (!removendo) return
    try {
      await apiPost('documentos', { acao: 'remover', id: removendo.id })
      setDocumentos((lista) => lista.filter((d) => d.id !== removendo.id))
    } catch (e) {
      setErro((e as Error).message)
    }
    setRemovendo(null)
  }

  return (
    <>
      {embutido ? (
        <h2 style={{ marginTop: 28 }}>{info.titulo}</h2>
      ) : (
        <>
          <div className="ahead">
            <div>
              <h1>{info.titulo}</h1>
              <p className="lead" style={{ marginBottom: 0 }}>
                {info.descricao}
              </p>
            </div>
          </div>
          {/* Solte o arquivo: a IA lê e preenche a ficha */}
          <Importador dica={categoria} aoSalvar={recarregar} />
        </>
      )}

      {erro && <p className="err">{erro}</p>}

      <div className="docs">
        {carregando && <p className="mute">Carregando…</p>}
        {!carregando && !documentos.length && <p className="mute">Nenhum documento ainda.</p>}

        {documentos.map((d) =>
          editando === d.id ? (
            <FichaDocumento
              key={d.id}
              categoria={categoria}
              documento={d}
              aoSalvar={guardar}
              aoCancelar={() => setEditando(null)}
            />
          ) : (
            <article key={d.id} className="box doc">
              <div className="dh">
                <ChipArea area={d.area} />
                <span className={CLASSE_STATUS[d.status]}>{NOME_STATUS[d.status]}</span>
              </div>
              <h2>{d.titulo}</h2>
              <p className="doc-meta">
                {[
                  d.versao && `Versão ${d.versao}`,
                  d.responsavel && `Responsável: ${d.responsavel}`,
                  d.revisao_em && `Revisão: ${dataBr(d.revisao_em)}`,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
              {d.resumo && <p className="doc-resumo">{d.resumo}</p>}
              {d.arquivo_nome ? (
                <a className="doc-arquivo" href={`/api/arquivo?id=${d.id}`} target="_blank" rel="noreferrer">
                  📄 {d.arquivo_nome}
                  <span className="mute">
                    {TIPOS_ARQUIVO[d.arquivo_tipo ?? '']} · {tamanho(d.arquivo_tamanho ?? 0)}
                  </span>
                </a>
              ) : (
                <p className="mute">Sem arquivo anexado.</p>
              )}
              <div className="acts">
                <button type="button" className="btn ghost sm" onClick={() => setEditando(d.id)}>
                  Editar
                </button>
                <button type="button" className="btn danger sm" onClick={() => setRemovendo(d)}>
                  Remover
                </button>
              </div>
            </article>
          ),
        )}
      </div>

      <DialogoConfirmar
        aberto={removendo !== null}
        titulo="Remover documento?"
        rotuloConfirmar="Remover"
        aoConfirmar={confirmarRemocao}
        aoCancelar={() => setRemovendo(null)}
      >
        <p>
          <strong>{removendo?.titulo}</strong> e o arquivo anexado serão removidos. Não dá para desfazer.
        </p>
      </DialogoConfirmar>
    </>
  )
}

interface PropsFicha {
  categoria: Categoria
  documento?: Documento // sem documento = criando um novo
  aoSalvar: (doc: Documento) => void
  aoCancelar: () => void
}

// Formulário da ficha (criar ou editar) com o envio do arquivo
function FichaDocumento({ categoria, documento, aoSalvar, aoCancelar }: PropsFicha) {
  const { usuario } = useSessao()
  const areas = usuario ? areasDoUsuario(usuario) : []
  const [campos, setCampos] = useState({
    titulo: documento?.titulo ?? '',
    area: documento?.area ?? usuario?.area ?? 'GRC',
    responsavel: documento?.responsavel ?? '',
    versao: documento?.versao ?? '',
    status: documento?.status ?? 'rascunho',
    revisao_em: documento?.revisao_em ?? '',
    resumo: documento?.resumo ?? '',
  })
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [tirarArquivo, setTirarArquivo] = useState(false)
  const [aviso, setAviso] = useState('')
  const [salvando, setSalvando] = useState(false)

  // Infraestrutura aceita imagem (diagramas); as outras, só documentos
  const aceita =
    categoria === 'infraestrutura' ? '.pdf,.docx,.png,.jpg,.jpeg' : '.pdf,.docx'

  function mudar(campo: keyof typeof campos, valor: string) {
    setCampos((c) => ({ ...c, [campo]: valor }))
  }

  function escolherArquivo(f: File | undefined) {
    setAviso('')
    if (!f) return setArquivo(null)
    const tipo = tipoDoArquivo(f)
    if (!tipo || (categoria !== 'infraestrutura' && tipo.startsWith('image/'))) {
      setAviso(categoria === 'infraestrutura' ? 'Use PDF, DOCX, PNG ou JPG.' : 'Use PDF ou DOCX.')
      return setArquivo(null)
    }
    if (f.size > MAX_ARQUIVO) {
      setAviso(`O arquivo tem ${tamanho(f.size)}; o máximo é 4 MB. Tente exportar o PDF em tamanho menor.`)
      return setArquivo(null)
    }
    setArquivo(f)
    setTirarArquivo(false)
  }

  async function salvar(e: FormEvent) {
    e.preventDefault()
    setSalvando(true)
    setAviso('')
    try {
      // 1) Salva a ficha
      const r = await apiPost<{ documento: Documento }>('documentos', {
        acao: 'salvar',
        id: documento?.id,
        categoria,
        ...campos,
      })
      let doc = r.documento

      // 2) Envia, troca ou tira o arquivo
      if (arquivo) {
        setAviso('Enviando arquivo…')
        const a = await apiEnviarArquivo<Pick<Documento, 'arquivo_nome' | 'arquivo_tipo' | 'arquivo_tamanho'>>(
          `arquivo?id=${doc.id}`,
          arquivo,
          tipoDoArquivo(arquivo),
          arquivo.name,
        )
        doc = { ...doc, ...a }
      } else if (tirarArquivo) {
        await apiDelete(`arquivo?id=${doc.id}`)
        doc = { ...doc, arquivo_nome: null, arquivo_tipo: null, arquivo_tamanho: null }
      }
      aoSalvar(doc)
    } catch (err) {
      setAviso((err as Error).message)
      setSalvando(false)
    }
  }

  return (
    <form className="box doc doc-form" onSubmit={salvar}>
      <h2>{documento ? 'Editar documento' : 'Novo documento'}</h2>
      <div className="f">
        <label htmlFor="d-titulo">Título</label>
        <input
          id="d-titulo"
          required
          maxLength={200}
          value={campos.titulo}
          onChange={(e) => mudar('titulo', e.target.value)}
          placeholder="Ex.: Política de controle de acesso"
        />
      </div>
      <div className="form">
        <div className="f">
          <label htmlFor="d-area">Área</label>
          <select id="d-area" value={campos.area} onChange={(e) => mudar('area', e.target.value as Area)}>
            {areas.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        <div className="f">
          <label htmlFor="d-status">Status</label>
          <select id="d-status" value={campos.status} onChange={(e) => mudar('status', e.target.value)}>
            {Object.entries(NOME_STATUS).map(([v, nome]) => (
              <option key={v} value={v}>
                {nome}
              </option>
            ))}
          </select>
        </div>
        <div className="f">
          <label htmlFor="d-versao">Versão</label>
          <input id="d-versao" maxLength={40} value={campos.versao} onChange={(e) => mudar('versao', e.target.value)} />
        </div>
        <div className="f">
          <label htmlFor="d-resp">Responsável</label>
          <input
            id="d-resp"
            maxLength={120}
            value={campos.responsavel}
            onChange={(e) => mudar('responsavel', e.target.value)}
          />
        </div>
        <div className="f">
          <label htmlFor="d-rev">Próxima revisão</label>
          <input id="d-rev" type="date" value={campos.revisao_em} onChange={(e) => mudar('revisao_em', e.target.value)} />
        </div>
      </div>
      <div className="f">
        <label htmlFor="d-resumo">Resumo (o que o documento define, em poucas linhas)</label>
        <textarea
          id="d-resumo"
          maxLength={4000}
          rows={4}
          value={campos.resumo}
          onChange={(e) => mudar('resumo', e.target.value)}
        />
      </div>

      <div className="f">
        <span className="lab">Arquivo ({categoria === 'infraestrutura' ? 'PDF, DOCX, PNG ou JPG' : 'PDF ou DOCX'}, até 4 MB)</span>
        {documento?.arquivo_nome && !arquivo && !tirarArquivo && (
          <p className="doc-atual">
            Atual: <strong>{documento.arquivo_nome}</strong>{' '}
            <button type="button" className="link" onClick={() => setTirarArquivo(true)}>
              tirar arquivo
            </button>
          </p>
        )}
        {tirarArquivo && <p className="mute">O arquivo atual será removido ao salvar.</p>}
        <input type="file" accept={aceita} onChange={(e) => escolherArquivo(e.target.files?.[0])} />
      </div>

      <div className="acts">
        <button type="submit" className="btn sm" disabled={salvando}>
          {salvando ? 'Salvando…' : 'Salvar'}
        </button>
        <button type="button" className="btn ghost sm" onClick={aoCancelar} disabled={salvando}>
          Cancelar
        </button>
      </div>
      <div className="err" role="alert">
        {aviso}
      </div>
    </form>
  )
}
