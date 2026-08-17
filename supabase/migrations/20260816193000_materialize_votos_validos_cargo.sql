-- ============================================================
-- vw_votos_validos_cargo_municipio/uf (migration
-- participacao_territorial.sql) recalculavam sum(qtde_votos) direto
-- de votacao_secao a cada requisição. Isso é barato para cargos com
-- poucos candidatos (Governador, Presidente), mas para Deputado
-- Federal/Estadual (632/902 candidatos em pleitos majoritários maiores)
-- a fatia da tabela filtrada por cargo passa de 1 milhão de linhas —
-- mesmo com o índice de cobertura idx_votacao_cargo_eleicao_uf, o
-- agregado sozinho levava 11-20s em produção (reportado como "tudo
-- ficou lento" ao testar Deputado Federal — EXPLAIN ANALYZE confirmou
-- o custo real, não é regressão de código, é escala: cargo nunca
-- tinha sido exercitado nessas telas antes).
--
-- Resultado eleitoral não muda depois de importado, então vira
-- materialized view — mesmo padrão de mv_dominancia_municipio
-- (materialize_dominancia_municipio.sql): revoga select direto de
-- anon/authenticated, e a view pública com o mesmo nome de antes
-- passa a ler da mat view com o filtro de usuarios_permissoes
-- replicado manualmente (mat view não suporta RLS nativo).
-- ============================================================

drop view public.vw_votos_validos_cargo_municipio;
drop view public.vw_votos_validos_cargo_uf;

create materialized view public.mv_votos_validos_cargo_municipio as
select
    v.eleicao_id, v.codigo_municipio, m.nome_municipio, v.sigla_uf, v.cargo,
    sum(v.qtde_votos) as votos_validos
from public.votacao_secao v
join public.municipio m on m.codigo_ibge = v.codigo_municipio
group by v.eleicao_id, v.codigo_municipio, m.nome_municipio, v.sigla_uf, v.cargo;

create unique index idx_mv_votos_validos_cargo_municipio_pk on public.mv_votos_validos_cargo_municipio
    (eleicao_id, codigo_municipio, cargo);

create materialized view public.mv_votos_validos_cargo_uf as
select
    v.eleicao_id, v.sigla_uf, v.cargo,
    sum(v.qtde_votos) as votos_validos
from public.votacao_secao v
group by v.eleicao_id, v.sigla_uf, v.cargo;

create unique index idx_mv_votos_validos_cargo_uf_pk on public.mv_votos_validos_cargo_uf
    (eleicao_id, sigla_uf, cargo);

revoke select on public.mv_votos_validos_cargo_municipio from anon, authenticated;
revoke select on public.mv_votos_validos_cargo_uf from anon, authenticated;

create view public.vw_votos_validos_cargo_municipio as
select mv.*
from public.mv_votos_validos_cargo_municipio mv
where exists (
    select 1 from public.usuarios_permissoes up
    where up.user_id = auth.uid()
      and (up.sigla_uf is null or up.sigla_uf = mv.sigla_uf)
      and (up.eleicao_id is null or up.eleicao_id = mv.eleicao_id)
);

create view public.vw_votos_validos_cargo_uf as
select mv.*
from public.mv_votos_validos_cargo_uf mv
where exists (
    select 1 from public.usuarios_permissoes up
    where up.user_id = auth.uid()
      and (up.sigla_uf is null or up.sigla_uf = mv.sigla_uf)
      and (up.eleicao_id is null or up.eleicao_id = mv.eleicao_id)
);
