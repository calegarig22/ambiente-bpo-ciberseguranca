-- 002: documentação (políticas, infraestrutura, BIA, DRP) e inventário de ativos

create type categoria_documento as enum ('politica', 'infraestrutura', 'bia', 'drp');
create type status_documento as enum ('rascunho', 'vigente', 'em_revisao');

-- Documentos: uma ficha simples e o arquivo anexado (PDF, DOCX ou imagem).
-- O arquivo fica no próprio banco; a API só entrega para quem tem acesso à área.
create table documentos (
  id uuid primary key default gen_random_uuid(),
  categoria categoria_documento not null,
  area text not null check (area in ('GRC','IAM','Network','Endpoint','SOC')),
  titulo text not null check (length(trim(titulo)) > 0),
  resumo text not null default '',
  responsavel text not null default '',
  versao text not null default '',
  status status_documento not null default 'rascunho',
  revisao_em date, -- próxima revisão (ou a última, se preferir)
  arquivo bytea,
  arquivo_nome text,
  arquivo_tipo text,
  -- 4 MB: limite do corpo de requisição nas funções gratuitas da Vercel
  arquivo_tamanho int check (arquivo_tamanho is null or arquivo_tamanho <= 4194304),
  criado_por uuid references usuarios(id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index on documentos (categoria, area);

create trigger documentos_atualizado before update on documentos
  for each row execute function toca_atualizado_em();

create type tipo_ativo as enum ('servidor', 'estacao', 'rede', 'nuvem', 'aplicacao', 'banco_dados', 'outro');
create type criticidade_ativo as enum ('alta', 'media', 'baixa');
create type classificacao_dado as enum ('publico', 'interno', 'confidencial', 'restrito');

-- Inventário de ativos: o que existe no ambiente, de quem é e o quanto importa
create table ativos (
  id uuid primary key default gen_random_uuid(),
  area text not null check (area in ('GRC','IAM','Network','Endpoint','SOC')),
  nome text not null check (length(trim(nome)) > 0),
  tipo tipo_ativo not null default 'outro',
  dono text not null default '',
  localizacao text not null default '',
  criticidade criticidade_ativo not null default 'media',
  classificacao classificacao_dado not null default 'interno',
  -- sistema do inventário ligado a este ativo (opcional)
  sistema_id uuid references itens(id) on delete set null,
  observacoes text not null default '',
  criado_por uuid references usuarios(id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index on ativos (area);

create trigger ativos_atualizado before update on ativos
  for each row execute function toca_atualizado_em();
