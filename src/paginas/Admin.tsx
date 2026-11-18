import { useEffect, useState, type FormEvent } from 'react'
import ApagarDados from '../componentes/ApagarDados'
import { ChipArea } from '../componentes/Chips'
import DialogoConfirmar from '../componentes/DialogoConfirmar'
import { apiGet, apiPost } from '../lib/api'
import { AREAS, NOME_PAPEL, PAPEIS, type Area, type Papel, type Usuario } from '../lib/dominio'
import { useSessao } from '../lib/sessao'

// Usuário como a lista do Admin recebe (com a situação ativo/inativo)
type UsuarioLista = Usuario & { ativo: boolean }

// Mensagem de retorno de um formulário: texto e se é de sucesso (verde) ou erro (vermelho)
type Aviso = { texto: string; bom: boolean }

// O que cada perfil pode fazer, mostrado no formulário
const EXPLICA_PAPEL: Record<Papel, string> = {
  coordenador: 'Vê e edita só a área escolhida.',
  visualizador: 'Vê e edita todas as áreas, o inventário e os documentos, mas não acessa a aba Admin.',
  admin: 'Vê e edita tudo e gerencia os usuários nesta aba.',
}

// Aba Admin (/admin): criar usuários, mudar perfil e área, desativar/reativar e trocar senhas.
export default function Admin() {
  const { usuario: eu } = useSessao()
  const [usuarios, setUsuarios] = useState<UsuarioLista[]>([])
  const [avisoLista, setAvisoLista] = useState<Aviso | null>(null)

  // Formulário "Novo usuário"
  const [papel, setPapel] = useState<Papel>('coordenador')
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [area, setArea] = useState<Area>('IAM')
  const [senhaInicial, setSenhaInicial] = useState('')
  const [avisoNovo, setAvisoNovo] = useState<Aviso | null>(null)

  // Formulário "Definir nova senha" (começa no próprio Admin)
  const [idSenha, setIdSenha] = useState(eu?.id ?? '')
  const [senhaNova, setSenhaNova] = useState('')
  const [avisoSenha, setAvisoSenha] = useState<Aviso | null>(null)

  const [ocupado, setOcupado] = useState(false)
  // Usuário que está para ser apagado (abre o diálogo de confirmação)
  const [apagando, setApagando] = useState<UsuarioLista | null>(null)

  // Busca a lista na API. Devolve a promessa para quem quiser esperar o fim.
  function carregar() {
    return apiGet<{ usuarios: UsuarioLista[] }>('usuarios')
      .then((r) => setUsuarios(r.usuarios))
      .catch((e: Error) => setAvisoLista({ texto: e.message, bom: false }))
  }

  // Carrega a lista ao abrir a tela
  useEffect(() => {
    apiGet<{ usuarios: UsuarioLista[] }>('usuarios')
      .then((r) => setUsuarios(r.usuarios))
      .catch((e: Error) => setAvisoLista({ texto: e.message, bom: false }))
  }, [])

  // Envia uma ação para a API, mostra o resultado e recarrega a lista
  async function executar(corpo: object, mostrar: (a: Aviso) => void, sucesso: string) {
    setOcupado(true)
    try {
      await apiPost('usuarios', corpo)
      mostrar({ texto: sucesso, bom: true })
      await carregar()
      return true
    } catch (e) {
      mostrar({ texto: (e as Error).message, bom: false })
      return false
    } finally {
      setOcupado(false)
    }
  }

  async function criar(e: FormEvent) {
    e.preventDefault()
    const ok = await executar(
      { acao: 'criar', nome, email, papel, area, senha: senhaInicial },
      setAvisoNovo,
      `${NOME_PAPEL[papel]} criado. Passe o e-mail e a senha inicial para a pessoa.`,
    )
    if (ok) {
      setNome('')
      setEmail('')
      setSenhaInicial('')
    }
  }

  async function trocarSenha(e: FormEvent) {
    e.preventDefault()
    const alvo = usuarios.find((u) => u.id === idSenha)
    const ok = await executar(
      { acao: 'senha', id: idSenha, senha: senhaNova },
      setAvisoSenha,
      `Senha de ${alvo?.nome ?? 'usuário'} atualizada.`,
    )
    if (ok) setSenhaNova('')
  }

  // Troca o perfil ou a área direto na tabela
  function mudarPerfil(u: UsuarioLista, novoPapel: Papel, novaArea: Area) {
    executar(
      { acao: 'perfil', id: u.id, papel: novoPapel, area: novaArea },
      setAvisoLista,
      `${u.nome} agora é ${NOME_PAPEL[novoPapel]} (${novaArea}).`,
    )
  }

  async function confirmarApagar() {
    if (!apagando) return
    const u = apagando
    setApagando(null)
    await executar({ acao: 'apagar', id: u.id }, setAvisoLista, `${u.nome} foi apagado.`)
    // Se estava selecionado no "Definir nova senha", volta para você
    if (idSenha === u.id) setIdSenha(eu?.id ?? '')
  }

  function alternarAtivo(u: UsuarioLista) {
    executar(
      { acao: u.ativo ? 'desativar' : 'ativar', id: u.id },
      setAvisoLista,
      u.ativo ? `${u.nome} não consegue mais entrar.` : `${u.nome} pode entrar de novo.`,
    )
  }

  return (
    <>
      <h1>Admin</h1>
      <p className="lead">
        Logins da equipe. <strong>Coordenador</strong> vê e edita só a própria área;{' '}
        <strong>Visualizador</strong> vê e edita tudo, menos esta aba; <strong>Admin</strong> faz tudo, inclusive
        gerenciar usuários. Troque perfil e área direto na tabela. Usuários desativados perdem o acesso na hora.
      </p>

      <div className="box" style={{ marginBottom: 16 }}>
        <h2>Usuários</h2>
        <div className="mwrap">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Perfil</th>
                <th>Área</th>
                <th>Situação</th>
                <th>
                  <span className="sr">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id}>
                  <td>{u.nome}</td>
                  <td>{u.email}</td>
                  <td>
                    {/* Você não pode tirar o seu próprio Admin (para não se trancar para fora) */}
                    <select
                      aria-label={`Perfil de ${u.nome}`}
                      value={u.papel}
                      disabled={ocupado || u.id === eu?.id}
                      onChange={(e) => mudarPerfil(u, e.target.value as Papel, u.area)}
                    >
                      {PAPEIS.map((p) => (
                        <option key={p} value={p}>
                          {NOME_PAPEL[p]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <div className="area-celula">
                      <ChipArea area={u.area} />
                      <select
                        aria-label={`Área de ${u.nome}`}
                        value={u.area}
                        disabled={ocupado}
                        onChange={(e) => mudarPerfil(u, u.papel, e.target.value as Area)}
                      >
                        {AREAS.map((a) => (
                          <option key={a} value={a}>
                            {a}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className={u.ativo ? '' : 'mute'}>{u.ativo ? 'Ativo' : 'Desativado'}</td>
                  <td>
                    {u.id !== eu?.id && (
                      <button
                        type="button"
                        className="btn ghost sm"
                        disabled={ocupado}
                        onClick={() => alternarAtivo(u)}
                      >
                        {u.ativo ? 'Desativar' : 'Reativar'}
                      </button>
                    )}
                    {u.id !== eu?.id && (
                      <button
                        type="button"
                        className="btn danger sm"
                        style={{ marginLeft: 6 }}
                        disabled={ocupado}
                        onClick={() => setApagando(u)}
                      >
                        Apagar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={`err${avisoLista?.bom ? ' good' : ''}`} role="alert">
          {avisoLista?.texto}
        </div>
      </div>

      <div className="cols2">
        <form className="box" onSubmit={criar}>
          <h2>Novo usuário</h2>
          <div className="form" style={{ gridTemplateColumns: '1fr' }}>
            <div className="f">
              <label htmlFor="n-papel">Perfil</label>
              <select id="n-papel" value={papel} onChange={(e) => setPapel(e.target.value as Papel)}>
                {PAPEIS.map((p) => (
                  <option key={p} value={p}>
                    {NOME_PAPEL[p]}
                  </option>
                ))}
              </select>
              <span className="mute" style={{ fontSize: 13 }}>
                {EXPLICA_PAPEL[papel]}
              </span>
            </div>
            <div className="f">
              <label htmlFor="n-nome">Nome</label>
              <input id="n-nome" required value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div className="f">
              <label htmlFor="n-email">E-mail</label>
              <input
                id="n-email"
                type="email"
                required
                autoComplete="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="f">
              <label htmlFor="n-area">{papel === 'coordenador' ? 'Área que ele coordena' : 'Área de origem'}</label>
              <select id="n-area" value={area} onChange={(e) => setArea(e.target.value as Area)}>
                {AREAS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
            <div className="f">
              <label htmlFor="n-senha">Senha inicial (mínimo 8 caracteres)</label>
              <input
                id="n-senha"
                type="text"
                required
                minLength={8}
                autoComplete="off"
                value={senhaInicial}
                onChange={(e) => setSenhaInicial(e.target.value)}
              />
            </div>
          </div>
          <div className="acts" style={{ marginTop: 10 }}>
            <button className="btn sm" type="submit" disabled={ocupado}>
              Criar usuário
            </button>
          </div>
          <div className={`err${avisoNovo?.bom ? ' good' : ''}`} role="alert">
            {avisoNovo?.texto}
          </div>
        </form>

        <form className="box" onSubmit={trocarSenha}>
          <h2>Definir nova senha</h2>
          <div className="form" style={{ gridTemplateColumns: '1fr' }}>
            <div className="f">
              <label htmlFor="s-usuario">Usuário</label>
              <select id="s-usuario" value={idSenha} onChange={(e) => setIdSenha(e.target.value)}>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.id === eu?.id ? `${u.nome} (você)` : `${u.nome} · ${NOME_PAPEL[u.papel]} · ${u.area}`}
                  </option>
                ))}
              </select>
            </div>
            <div className="f">
              <label htmlFor="s-senha">Nova senha (mínimo 8 caracteres)</label>
              <input
                id="s-senha"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={senhaNova}
                onChange={(e) => setSenhaNova(e.target.value)}
              />
            </div>
          </div>
          <div className="acts" style={{ marginTop: 10 }}>
            <button className="btn sm" type="submit" disabled={ocupado}>
              Salvar senha
            </button>
          </div>
          <div className={`err${avisoSenha?.bom ? ' good' : ''}`} role="alert">
            {avisoSenha?.texto}
          </div>
        </form>
      </div>

      <DialogoConfirmar
        aberto={apagando !== null}
        titulo="Apagar usuário?"
        rotuloConfirmar="Apagar"
        aoConfirmar={confirmarApagar}
        aoCancelar={() => setApagando(null)}
      >
        <p>
          <strong>{apagando?.nome}</strong> ({apagando?.email}) perde o acesso e sai da lista de vez. O que essa
          pessoa cadastrou continua na plataforma. Se quiser só bloquear por um tempo, use Desativar.
        </p>
      </DialogoConfirmar>

      <ApagarDados />
    </>
  )
}
