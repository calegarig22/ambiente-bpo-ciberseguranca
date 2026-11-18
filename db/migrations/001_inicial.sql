-- 001: estrutura inicial do banco (usuários, itens do inventário e prints)

create type papel_usuario as enum ('admin', 'coordenador');
create type tipo_item as enum ('sistema', 'config', 'regra');
create type estado_item as enum ('ok', 'atencao', 'pendente');

-- Usuários do sistema. Não há cadastro público: o primeiro Admin vem do
-- script criar-admin e os coordenadores são criados pela aba Admin.
create table usuarios (
  id uuid primary key default gen_random_uuid(),
  -- e-mail sempre guardado em minúsculas, para o login não depender de maiúsculas
  email text not null unique check (email = lower(trim(email)) and email like '%_@_%'),
  nome text not null check (length(trim(nome)) > 0),
  senha_hash text not null,
  papel papel_usuario not null,
  area text not null check (area in ('GRC','IAM','Network','Endpoint','SOC')),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  -- o Admin é sempre o coordenador de GRC
  check (papel = 'coordenador' or area = 'GRC')
);

create table itens (
  id uuid primary key default gen_random_uuid(),
  area text not null check (area in ('GRC','IAM','Network','Endpoint','SOC')),
  tipo tipo_item not null,
  nome text not null check (length(trim(nome)) > 0),
  detalhe text not null default '',
  estado estado_item not null default 'pendente',
  pai_id uuid references itens(id) on delete cascade,
  ferramenta text not null default '',
  fornecedor text not null default '',
  versao text not null default '',
  ordem int not null default 0,
  -- quem criou o item (vazio nos itens do seed)
  criado_por uuid references usuarios(id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  -- sistema é raiz; configuração e regra sempre têm pai
  check ((tipo = 'sistema' and pai_id is null) or (tipo <> 'sistema' and pai_id is not null))
);

create index on itens (area);
create index on itens (pai_id);

-- Um print por item. Fica numa tabela separada para que listar os itens
-- não carregue as imagens. Remover o item remove o print (cascade).
create table prints (
  item_id uuid primary key references itens(id) on delete cascade,
  dados bytea not null,
  -- tamanho em bytes; a imagem já chega reduzida, então 2 MB é folga
  tamanho int not null check (tamanho > 0 and tamanho <= 2097152),
  atualizado_em timestamptz not null default now()
);

-- Atualiza atualizado_em a cada alteração de um item
create function toca_atualizado_em() returns trigger language plpgsql as $$
begin
  new.atualizado_em = now();
  return new;
end $$;

create trigger itens_atualizado before update on itens
  for each row execute function toca_atualizado_em();

-- Garante a hierarquia: configuração dentro de sistema, regra dentro de
-- configuração, sempre na mesma área. A API também confere, mas o banco é
-- a última barreira caso alguém erre no código.
create function valida_pai() returns trigger language plpgsql as $$
declare
  pai record;
begin
  if new.pai_id is null then
    return new;
  end if;

  select tipo, area into pai from itens where id = new.pai_id;

  if not found then
    raise exception 'O item pai não existe';
  end if;
  if pai.area <> new.area then
    raise exception 'O item pai precisa ser da mesma área';
  end if;
  if new.tipo = 'config' and pai.tipo <> 'sistema' then
    raise exception 'Uma configuração precisa estar dentro de um sistema';
  end if;
  if new.tipo = 'regra' and pai.tipo <> 'config' then
    raise exception 'Uma regra precisa estar dentro de uma configuração';
  end if;

  return new;
end $$;

create trigger itens_valida_pai before insert or update of pai_id, tipo, area on itens
  for each row execute function valida_pai();
