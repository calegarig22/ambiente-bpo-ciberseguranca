import { useEffect, useRef, useState, type DragEvent } from 'react'
import { Link } from 'react-router-dom'
import { ErroApi, apiEnviarArquivo, apiGet, apiPost } from '../lib/api'
import {
  AREAS,
  CATEGORIAS,
  INFO_CATEGORIA,
  MAX_ARQUIVO,
  NOME_CLASSIFICACAO,
  NOME_CRITICIDADE,
  NOME_STATUS,
  NOME_TIPO_ATIVO,
  TIPOS_ARQUIVO,
  areasDoUsuario,
  ehCategoria,
  type Documento,
  type Leitura,
} from '../lib/dominio'
import { normalizar, useItens } from '../lib/itens'
import { tamanho, tipoDoArquivo } from '../lib/formato'
import { useSessao } from '../lib/sessao'
import { ChipArea } from './Chips'

// Área para soltar arquivos. Cada arquivo é lido pela IA (/api/ler), que
// devolve a ficha do documento ou a lista de sistemas/ativos já preenchida.
// A pessoa só confere e clica em Salvar. Se já existir um documento com o mesmo
// título (ou um sistema com o mesmo nome na mesma área), ele é atualizado em vez de duplicado.

type DocumentoLido = NonNullable<Leitura['documento']>
type AtivoLido = Leitura['ativos'][number]

interface Envio {
  chave: number
  arquivo: File
  tipo: string
  estado: 'lendo' | 'pronto' | 'salvando' | 'salvo' | 'erro'
  documento?: DocumentoLido
  ativos?: AtivoLido[]
  manual?: boolean // IA indisponível: ficha vazia para preencher à mão
  mensagem?: string
}

interface Props {
  dica: string // "geral", "inventario" ou uma categoria de documento
  aoSalvar?: () => void
}

let proximaChave = 1

export default function Importador({ dica, aoSalvar }: Props) {
  const { usuario } = useSessao()
  const [envios, setEnvios] = useState<Envio[]>([])
  const [arrastando, setArrastando] = useState(false)
  const [existentesDocs, setExistentesDocs] = useState<Documento[]>([])
  // Sistemas já cadastrados (lista compartilhada com a árvore e as outras telas)
  const { itens, criar, editar } = useItens()
  const entrada = useRef<HTMLInputElement>(null)

  // Documentos que já existem, para atualizar em vez de duplicar
  function carregarExistentes() {
    apiGet<{ documentos: Documento[] }>('documentos').then((r) => setExistentesDocs(r.documentos)).catch(() => {})
  }
  useEffect(() => {
    apiGet<{ documentos: Documento[] }>('documentos').then((r) => setExistentesDocs(r.documentos)).catch(() => {})
  }, [])

  if (!usuario) return null
  const minhaArea = usuario.area

  function atualizar(chave: number, mudancas: Partial<Envio>) {
    setEnvios((lista) => lista.map((e) => (e.chave === chave ? { ...e, ...mudancas } : e)))
  }

  // Recebe os arquivos, confere tipo e tamanho e manda ler um por vez
  // (um por vez para não estourar o limite por minuto da IA gratuita)
  async function receber(arquivos: FileList | null) {
    if (!arquivos?.length) return
    const novos: Envio[] = [...arquivos].map((arquivo) => {
      const tipo = tipoDoArquivo(arquivo)
      const base = { chave: proximaChave++, arquivo, tipo }
      if (!tipo) return { ...base, estado: 'erro', mensagem: 'Tipo não aceito. Use PDF, DOCX, XLSX, CSV, TXT ou imagem.' }
      if (arquivo.size > MAX_ARQUIVO) {
        return { ...base, estado: 'erro', mensagem: `Tem ${tamanho(arquivo.size)}; o máximo é 4 MB.` }
      }
      return { ...base, estado: 'lendo' }
    })
    setEnvios((lista) => [...novos, ...lista])
    for (const envio of novos.filter((e) => e.estado === 'lendo')) await ler(envio)
  }

  async function ler(envio: Envio) {
    try {
      const r = await apiEnviarArquivo<{ leitura: Leitura }>('ler', envio.arquivo, envio.tipo, envio.arquivo.name, {
        'X-Dica': dica,
      })
      const { leitura } = r
      if (leitura.tipo === 'ativos') atualizar(envio.chave, { estado: 'pronto', ativos: leitura.ativos })
      else atualizar(envio.chave, { estado: 'pronto', documento: leitura.documento ?? fichaVazia(envio.arquivo) })
    } catch (e) {
      // IA não configurada: segue com a ficha vazia para preencher à mão
      if (e instanceof ErroApi && e.status === 503 && /configurada/.test(e.message)) {
        atualizar(envio.chave, { estado: 'pronto', manual: true, documento: fichaVazia(envio.arquivo) })
      } else {
        atualizar(envio.chave, { estado: 'erro', mensagem: (e as Error).message })
      }
    }
  }

  function fichaVazia(arquivo: File): DocumentoLido {
    return {
      categoria: ehCategoria(dica) ? dica : 'politica',
      area: minhaArea,
      titulo: arquivo.name.replace(/\.[^.]+$/, ''),
      versao: '',
      responsavel: '',
      status: 'rascunho',
      revisao_em: null,
      resumo: '',
    }
  }

  // Documento com o mesmo título na mesma categoria (para atualizar)
  function docExistente(d: DocumentoLido) {
    return existentesDocs.find((x) => x.categoria === d.categoria && normalizar(x.titulo) === normalizar(d.titulo))
  }
  // Sistema com o mesmo nome na mesma área (para atualizar)
  function ativoExistente(a: AtivoLido) {
    return itens.find((x) => x.tipo === 'sistema' && x.area === a.area && normalizar(x.nome) === normalizar(a.nome))
  }

  async function salvarDocumento(envio: Envio) {
    const d = envio.documento!
    if (!d.titulo.trim()) return atualizar(envio.chave, { mensagem: 'Dê um título ao documento.' })
    atualizar(envio.chave, { estado: 'salvando', mensagem: '' })
    try {
      const existente = docExistente(d)
      const r = await apiPost<{ documento: Documento }>('documentos', { acao: 'salvar', id: existente?.id, ...d })
      // Anexa o arquivo original (PDF, DOCX ou imagem) ao documento
      if (TIPOS_ARQUIVO[envio.tipo]) {
        await apiEnviarArquivo(`arquivo?id=${r.documento.id}`, envio.arquivo, envio.tipo, envio.arquivo.name)
      }
      atualizar(envio.chave, {
        estado: 'salvo',
        mensagem: `${existente ? 'Atualizado' : 'Salvo'} em ${INFO_CATEGORIA[d.categoria].menu}.`,
      })
      carregarExistentes()
      aoSalvar?.()
    } catch (e) {
      atualizar(envio.chave, { estado: 'pronto', mensagem: (e as Error).message })
    }
  }

  async function salvarAtivos(envio: Envio) {
    const lista = envio.ativos ?? []
    atualizar(envio.chave, { estado: 'salvando', mensagem: '' })
    let novos = 0
    let atualizados = 0
    try {
      for (const a of lista) {
        const existente = ativoExistente(a)
        // Cada linha da lista vira (ou atualiza) um sistema do inventário
        const campos = {
          tipo_ativo: a.tipo,
          ferramenta: a.ferramenta || existente?.ferramenta || '',
          fornecedor: a.fornecedor || existente?.fornecedor || '',
          versao: a.versao || existente?.versao || '',
          dono: a.dono || existente?.dono || '',
          localizacao: a.localizacao || existente?.localizacao || '',
          criticidade: a.criticidade,
          classificacao: a.classificacao,
          detalhe: a.observacoes || existente?.detalhe || '',
        }
        if (existente) {
          await editar(existente.id, campos)
          atualizados++
        } else {
          await criar({ area: a.area, tipo: 'sistema', pai_id: null, nome: a.nome, estado: 'ok', ...campos })
          novos++
        }
      }
      atualizar(envio.chave, {
        estado: 'salvo',
        mensagem: `${novos} sistemas novos e ${atualizados} atualizados no inventário.`,
      })
      carregarExistentes()
      aoSalvar?.()
    } catch (e) {
      atualizar(envio.chave, {
        estado: 'pronto',
        mensagem: `Parou no meio (${novos + atualizados} de ${lista.length} salvos): ${(e as Error).message}`,
      })
    }
  }

  function soltar(e: DragEvent) {
    e.preventDefault()
    setArrastando(false)
    receber(e.dataTransfer.files)
  }

  const textoDica =
    dica === 'inventario'
      ? 'uma planilha, foto ou documento com a lista de sistemas/ativos, ou um diagrama de infraestrutura'
      : ehCategoria(dica)
        ? `o documento (${INFO_CATEGORIA[dica].menu.toLowerCase()})`
        : 'políticas, BIA, DRP, infraestrutura ou listas de sistemas/ativos'

  return (
    <div className="importador">
      <button
        type="button"
        className={`soltar${arrastando ? ' ativo' : ''}`}
        onClick={() => entrada.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setArrastando(true)
        }}
        onDragLeave={() => setArrastando(false)}
        onDrop={soltar}
      >
        <span className="soltar-icone" aria-hidden="true">
          ⇪
        </span>
        <span className="soltar-titulo">Solte aqui {textoDica}</span>
        <span className="soltar-sub">
          ou clique para escolher · PDF, DOCX, XLSX, CSV ou imagem · até 4 MB · a IA lê e preenche para você
        </span>
      </button>
      <input
        ref={entrada}
        type="file"
        multiple
        hidden
        accept=".pdf,.docx,.xlsx,.csv,.txt,.png,.jpg,.jpeg,.webp"
        onChange={(e) => {
          receber(e.target.files)
          e.target.value = ''
        }}
      />

      {envios.map((envio) => (
        <div key={envio.chave} className={`box envio e-${envio.estado}`}>
          <div className="envio-topo">
            <span className="envio-arquivo">📄 {envio.arquivo.name}</span>
            {envio.estado !== 'salvando' && (
              <button
                type="button"
                className="fechar"
                aria-label="Dispensar"
                onClick={() => setEnvios((l) => l.filter((x) => x.chave !== envio.chave))}
              >
                ×
              </button>
            )}
          </div>

          {envio.estado === 'lendo' && (
            <p className="lendo">
              <span className="giro" aria-hidden="true" /> A IA está lendo o arquivo…
            </p>
          )}
          {envio.estado === 'erro' && (
            <>
              <p className="err">{envio.mensagem}</p>
              {/* Só oferece de novo se o arquivo em si é válido (tipo e tamanho aceitos) */}
              {envio.tipo && envio.arquivo.size <= MAX_ARQUIVO && (
                <div className="acts">
                  <button
                    type="button"
                    className="btn sm"
                    onClick={() => {
                      atualizar(envio.chave, { estado: 'lendo', mensagem: '' })
                      ler(envio)
                    }}
                  >
                    Tentar de novo
                  </button>
                  <button
                    type="button"
                    className="btn ghost sm"
                    onClick={() =>
                      atualizar(envio.chave, { estado: 'pronto', manual: true, mensagem: '', documento: fichaVazia(envio.arquivo) })
                    }
                  >
                    Preencher à mão
                  </button>
                </div>
              )}
            </>
          )}
          {envio.estado === 'salvo' && (
            <p className="salvo">
              ✓ {envio.mensagem}{' '}
              {envio.documento && (
                <Link to={`/documentos/${envio.documento.categoria}`}>Ver {INFO_CATEGORIA[envio.documento.categoria].menu}</Link>
              )}
              {envio.ativos && <Link to="/inventario">Ver inventário</Link>}
            </p>
          )}

          {/* Ficha do documento, já preenchida: só conferir e salvar */}
          {envio.documento && (envio.estado === 'pronto' || envio.estado === 'salvando') && (
            <FichaLida
              documento={envio.documento}
              manual={envio.manual}
              existente={!!docExistente(envio.documento)}
              areas={areasDoUsuario(usuario)}
              salvando={envio.estado === 'salvando'}
              mensagem={envio.mensagem}
              aoMudar={(d) => atualizar(envio.chave, { documento: d })}
              aoSalvar={() => salvarDocumento(envio)}
            />
          )}

          {/* Lista de ativos encontrada no arquivo */}
          {envio.ativos && (envio.estado === 'pronto' || envio.estado === 'salvando') && (
            <>
              <p className="envio-resumo">
                <strong>{envio.ativos.length} sistemas/ativos encontrados</strong> ·{' '}
                {envio.ativos.filter((a) => ativoExistente(a)).length} já existem e serão atualizados
              </p>
              <div className="mwrap">
                <table className="tabela-compacta">
                  <thead>
                    <tr>
                      <th>Área</th>
                      <th>Sistema/ativo</th>
                      <th>Tipo</th>
                      <th>Classificação</th>
                      <th>Criticidade</th>
                      <th>
                        <span className="sr">Tirar</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {envio.ativos.map((a, i) => (
                      <tr key={i}>
                        <td>
                          <ChipArea area={a.area} />
                        </td>
                        <td>
                          {a.nome} {ativoExistente(a) && <span className="chip">atualiza</span>}
                        </td>
                        <td>{NOME_TIPO_ATIVO[a.tipo]}</td>
                        <td>{NOME_CLASSIFICACAO[a.classificacao]}</td>
                        <td>{NOME_CRITICIDADE[a.criticidade]}</td>
                        <td>
                          <button
                            type="button"
                            className="link"
                            aria-label={`Tirar ${a.nome} da lista`}
                            onClick={() => atualizar(envio.chave, { ativos: envio.ativos!.filter((_, j) => j !== i) })}
                          >
                            tirar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="acts">
                <button
                  type="button"
                  className="btn sm"
                  disabled={envio.estado === 'salvando' || !envio.ativos.length}
                  onClick={() => salvarAtivos(envio)}
                >
                  {envio.estado === 'salvando' ? 'Salvando…' : `Salvar ${envio.ativos.length} no inventário`}
                </button>
              </div>
              {envio.mensagem && <p className="err">{envio.mensagem}</p>}
            </>
          )}
        </div>
      ))}
    </div>
  )
}

interface PropsFicha {
  documento: DocumentoLido
  manual?: boolean
  existente: boolean
  areas: typeof AREAS[number][]
  salvando: boolean
  mensagem?: string
  aoMudar: (d: DocumentoLido) => void
  aoSalvar: () => void
}

// Ficha preenchida pela IA. Tudo editável, mas a ideia é só conferir e salvar.
function FichaLida({ documento: d, manual, existente, areas, salvando, mensagem, aoMudar, aoSalvar }: PropsFicha) {
  const mudar = (campo: keyof DocumentoLido, valor: string) => aoMudar({ ...d, [campo]: valor || (campo === 'revisao_em' ? null : '') })

  return (
    <div className="ficha-lida">
      <p className="envio-resumo">
        {manual
          ? 'A leitura automática não está configurada: preencha os campos e salve.'
          : 'A IA preencheu a ficha abaixo. Confira e clique em Salvar.'}
        {existente && <strong> Já existe um documento com este título: salvar vai atualizá-lo.</strong>}
      </p>
      <input
        className="ficha-titulo"
        aria-label="Título"
        value={d.titulo}
        maxLength={200}
        onChange={(e) => mudar('titulo', e.target.value)}
      />
      <div className="ficha-linha">
        <select aria-label="Categoria" value={d.categoria} onChange={(e) => mudar('categoria', e.target.value)}>
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>
              {INFO_CATEGORIA[c].menu}
            </option>
          ))}
        </select>
        <select aria-label="Área" value={d.area} onChange={(e) => mudar('area', e.target.value)}>
          {areas.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <select aria-label="Status" value={d.status} onChange={(e) => mudar('status', e.target.value)}>
          {Object.entries(NOME_STATUS).map(([v, nome]) => (
            <option key={v} value={v}>
              {nome}
            </option>
          ))}
        </select>
        <input aria-label="Versão" placeholder="Versão" value={d.versao} maxLength={40} onChange={(e) => mudar('versao', e.target.value)} />
        <input
          aria-label="Responsável"
          placeholder="Responsável"
          value={d.responsavel}
          maxLength={120}
          onChange={(e) => mudar('responsavel', e.target.value)}
        />
        <input
          aria-label="Próxima revisão"
          type="date"
          value={d.revisao_em ?? ''}
          onChange={(e) => mudar('revisao_em', e.target.value)}
        />
      </div>
      <textarea
        aria-label="Resumo"
        placeholder="Resumo do documento"
        rows={4}
        maxLength={4000}
        value={d.resumo}
        onChange={(e) => mudar('resumo', e.target.value)}
      />
      <div className="acts">
        <button type="button" className="btn sm" disabled={salvando} onClick={aoSalvar}>
          {salvando ? 'Salvando…' : existente ? 'Atualizar documento' : 'Salvar'}
        </button>
      </div>
      {mensagem && <p className="err">{mensagem}</p>}
    </div>
  )
}
