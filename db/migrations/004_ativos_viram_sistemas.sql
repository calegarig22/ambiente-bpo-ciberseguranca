-- 004: inventário único. Ativos viram sistemas do inventário.
--
-- O "Inventário de ativos" e o "Inventário de sistemas" passam a ser a mesma coisa:
-- cada ativo vira um item do tipo sistema na área dele, e os dados que só o ativo
-- tinha (tipo, dono, localização, criticidade, classificação) ganham colunas em itens.
-- Depois disso a tabela ativos deixa de existir.

alter table itens
  add column tipo_ativo tipo_ativo,
  add column dono text not null default '',
  add column localizacao text not null default '',
  add column criticidade criticidade_ativo,
  add column classificacao classificacao_dado;

-- Cada ativo vira um sistema (estado inicial "Em ordem"; dá para mudar depois).
-- A ordem continua depois dos itens que já existem.
insert into itens (area, tipo, nome, detalhe, estado, tipo_ativo, dono, localizacao, criticidade, classificacao, ordem, criado_por, criado_em)
select a.area, 'sistema', a.nome, a.observacoes, 'ok', a.tipo, a.dono, a.localizacao, a.criticidade, a.classificacao,
       (select coalesce(max(ordem), 0) from itens) + row_number() over (order by a.area, a.nome),
       a.criado_por, a.criado_em
from ativos a;

drop table ativos;
