// Constantes do domínio: as cinco áreas, os tipos de item e os estados.
// Ficam num arquivo só para que telas diferentes usem sempre os mesmos textos.

export const AREAS = ['GRC', 'IAM', 'Network', 'Endpoint', 'SOC'] as const
export type Area = (typeof AREAS)[number]

export type Tipo = 'sistema' | 'config' | 'regra'
export type Estado = 'ok' | 'atencao' | 'pendente'

// Ordem fixa dos estados, usada em barras, contadores e botões
export const ESTADOS: Estado[] = ['ok', 'atencao', 'pendente']

// Matiz (0 a 360) de cada área, usado na cor dos chips
export const MATIZ: Record<Area, number> = {
  GRC: 265,
  IAM: 175,
  Network: 215,
  Endpoint: 22,
  SOC: 340,
}

export const DESCRICAO_AREA: Record<Area, string> = {
  GRC: 'Governança, riscos e conformidade',
  IAM: 'Identidades e acessos',
  Network: 'Rede e perímetro',
  Endpoint: 'Estações, e-mail e correções',
  SOC: 'Monitoramento e resposta',
}

export const NOME_TIPO: Record<Tipo, string> = {
  sistema: 'Sistema',
  config: 'Configuração',
  regra: 'Regra',
}

export const NOME_ESTADO: Record<Estado, string> = {
  ok: 'Em ordem',
  atencao: 'Atenção',
  pendente: 'Pendente',
}

// Confere se um texto da URL é uma área válida (ex.: /area/IAM)
export function ehArea(texto: string | undefined): texto is Area {
  return AREAS.includes(texto as Area)
}

// ---- Usuários e permissões ----
// Este arquivo também é usado pela API (pasta api/), então as regras de
// quem vê o quê ficam escritas num lugar só.

// admin: vê e edita tudo e gerencia usuários (aba Admin)
// visualizador: vê e edita tudo, mas não acessa a aba Admin
// coordenador: vê e edita só a própria área
export type Papel = 'admin' | 'visualizador' | 'coordenador'
export const PAPEIS: Papel[] = ['coordenador', 'visualizador', 'admin']
export const NOME_PAPEL: Record<Papel, string> = {
  admin: 'Admin',
  visualizador: 'Visualizador',
  coordenador: 'Coordenador',
}

// Dados do usuário que podem ir para o navegador (nunca a senha)
export interface Usuario {
  id: string
  nome: string
  email: string
  papel: Papel
  area: Area
}

// Admin e visualizador veem todas as áreas; coordenador, só a dele
export function areasDoUsuario(u: Usuario): Area[] {
  return u.papel === 'coordenador' ? [u.area] : [...AREAS]
}

export function podeVerArea(u: Usuario, area: Area): boolean {
  return areasDoUsuario(u).includes(area)
}

// ---- Itens do inventário ----

// Um item do inventário, como a API entrega
export interface Item {
  id: string
  area: Area
  tipo: Tipo
  nome: string
  detalhe: string
  estado: Estado
  pai_id: string | null
  ferramenta: string
  fornecedor: string
  versao: string
  ordem: number
  tem_print: boolean
  // Dados de inventário (usados nos sistemas; vazios em configurações e regras)
  tipo_ativo: TipoAtivo | null
  dono: string
  localizacao: string
  criticidade: Criticidade | null
  classificacao: Classificacao | null
}

// Campos que o painel de detalhes pode alterar
export type CamposEditaveis = Partial<
  Pick<
    Item,
    | 'nome'
    | 'detalhe'
    | 'estado'
    | 'ferramenta'
    | 'fornecedor'
    | 'versao'
    | 'tipo_ativo'
    | 'dono'
    | 'localizacao'
    | 'criticidade'
    | 'classificacao'
  >
>

export interface NovoItem extends CamposEditaveis {
  area: Area
  tipo: Tipo
  pai_id: string | null
  nome: string
  estado: Estado
}

// ---- Documentação (políticas, infraestrutura, BIA, DRP) ----

export type Categoria = 'politica' | 'infraestrutura' | 'bia' | 'drp'
export const CATEGORIAS: Categoria[] = ['politica', 'infraestrutura', 'bia', 'drp']

// Nome no menu, título da página e explicação curta de cada categoria
export const INFO_CATEGORIA: Record<Categoria, { menu: string; titulo: string; descricao: string }> = {
  politica: {
    menu: 'Políticas',
    titulo: 'Políticas',
    descricao: 'Políticas de segurança da empresa: senhas, acesso, backup, LGPD, uso aceitável e outras.',
  },
  infraestrutura: {
    menu: 'Infraestrutura',
    titulo: 'Documentos de infraestrutura',
    descricao: 'Diagramas e descrições de como o ambiente está montado: redes, datacenter, nuvem, conexões.',
  },
  bia: {
    menu: 'BIA',
    titulo: 'BIA: análise de impacto no negócio',
    descricao: 'Processos críticos, impacto de uma parada e tempos aceitáveis de recuperação (RTO e RPO).',
  },
  drp: {
    menu: 'DRP',
    titulo: 'DRP: plano de recuperação de desastres',
    descricao: 'Como recuperar sistemas e dados depois de um incidente grave ou desastre.',
  },
}

export function ehCategoria(texto: string | undefined): texto is Categoria {
  return CATEGORIAS.includes(texto as Categoria)
}

export type StatusDocumento = 'rascunho' | 'vigente' | 'em_revisao'
export const NOME_STATUS: Record<StatusDocumento, string> = {
  rascunho: 'Rascunho',
  vigente: 'Vigente',
  em_revisao: 'Em revisão',
}

// Ficha do documento, como a API entrega (sem os bytes do arquivo)
export interface Documento {
  id: string
  categoria: Categoria
  area: Area
  titulo: string
  resumo: string
  responsavel: string
  versao: string
  status: StatusDocumento
  revisao_em: string | null // AAAA-MM-DD
  arquivo_nome: string | null
  arquivo_tipo: string | null
  arquivo_tamanho: number | null
  atualizado_em: string
}

// Tipos de arquivo aceitos e o tamanho máximo (limite das funções da Vercel)
export const TIPOS_ARQUIVO: Record<string, string> = {
  'application/pdf': 'PDF',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'image/png': 'PNG',
  'image/jpeg': 'JPG',
}
export const MAX_ARQUIVO = 4 * 1024 * 1024

// ---- Dados de inventário dos sistemas (tipo, criticidade, classificação) ----

export type TipoAtivo = 'servidor' | 'estacao' | 'rede' | 'nuvem' | 'aplicacao' | 'banco_dados' | 'outro'
export const NOME_TIPO_ATIVO: Record<TipoAtivo, string> = {
  servidor: 'Servidor',
  estacao: 'Estação de trabalho',
  rede: 'Equipamento de rede',
  nuvem: 'Serviço em nuvem',
  aplicacao: 'Aplicação',
  banco_dados: 'Banco de dados',
  outro: 'Outro',
}

export type Criticidade = 'alta' | 'media' | 'baixa'
export const NOME_CRITICIDADE: Record<Criticidade, string> = { alta: 'Alta', media: 'Média', baixa: 'Baixa' }

export type Classificacao = 'publico' | 'interno' | 'confidencial' | 'restrito'
export const NOME_CLASSIFICACAO: Record<Classificacao, string> = {
  publico: 'Público',
  interno: 'Interno',
  confidencial: 'Confidencial',
  restrito: 'Restrito',
}


// ---- Leitura automática de arquivos (IA) ----

// Tipos de arquivo que a leitura automática aceita
export const TIPOS_LEITURA: Record<string, string> = {
  ...TIPOS_ARQUIVO,
  'image/webp': 'WEBP',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
  'text/csv': 'CSV',
  'text/plain': 'TXT',
}

// Um sistema/ativo encontrado pela IA numa lista de inventário
export interface SistemaLido {
  area: Area
  nome: string
  tipo: TipoAtivo
  ferramenta: string
  fornecedor: string
  versao: string
  dono: string
  localizacao: string
  criticidade: Criticidade
  classificacao: Classificacao
  observacoes: string
}

// O que a IA entendeu de um arquivo: ou é um documento, ou uma lista de sistemas/ativos
export interface Leitura {
  tipo: 'documento' | 'ativos'
  documento: {
    categoria: Categoria
    area: Area
    titulo: string
    versao: string
    responsavel: string
    status: StatusDocumento
    revisao_em: string | null
    resumo: string
  } | null
  ativos: SistemaLido[]
}
