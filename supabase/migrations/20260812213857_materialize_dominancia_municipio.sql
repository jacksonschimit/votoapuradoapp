-- ============================================================
-- vw_dominancia_municipio precisa varrer TODOS os votos de um
-- cargo (sem filtro adicional de zona/local/seção, já que
-- alimenta o mapa coroplético inteiro) — mesmo com o índice de
-- cargo/eleicao_id/sigla_uf, o join+agregação final ainda custava
-- ~1,5s em produção. Como o resultado eleitoral não muda depois de
-- importado, vira materialized view (mesmo padrão das 3 views de
-- resultado da Seção 2.7): pré-calculada, e como mat views não
-- suportam RLS nativo, a view pública fica com o filtro de
-- usuarios_permissoes replicado manualmente (mesmo padrão de
-- fix_rls_materialized_views.sql).
-- ============================================================

drop view public.vw_dominancia_municipio;

create materialized view public.mv_dominancia_municipio as
select
    v.eleicao_id, v.codigo_municipio, m.nome_municipio, v.sigla_uf,
    v.sq_candidato, c.nm_urna_candidato, c.sigla_partido, v.cargo,
    sum(v.qtde_votos) as qtde_votos,
    max(comp.total_comparecimento) as qtde_comparecimento,
    round(
        (sum(v.qtde_votos)::numeric / nullif(max(comp.total_comparecimento), 0)) * 100, 2
    ) as percentual_dominancia
from public.votacao_secao v
join public.candidatos c on c.sq_candidato = v.sq_candidato
join public.municipio m on m.codigo_ibge = v.codigo_municipio
join (
    select se.codigo_municipio, sum(es.qtde_comparecimento) as total_comparecimento
    from public.eleitorado_secao es
    join public.secao_eleitoral se on se.id = es.secao_id
    group by se.codigo_municipio
) comp on comp.codigo_municipio = v.codigo_municipio
group by v.eleicao_id, v.codigo_municipio, m.nome_municipio, v.sigla_uf,
         v.sq_candidato, c.nm_urna_candidato, c.sigla_partido, v.cargo;

create unique index idx_mv_dominancia_municipio_pk on public.mv_dominancia_municipio
    (eleicao_id, codigo_municipio, sq_candidato);

create index idx_mv_dominancia_municipio_filtro on public.mv_dominancia_municipio
    (eleicao_id, sigla_uf, cargo);

revoke select on public.mv_dominancia_municipio from anon, authenticated;

-- security_invoker NÃO é usado aqui (diferente das outras views de
-- dominância) — precisa rodar com o privilégio do dono (postgres)
-- pra conseguir ler a materialized view, já que revogamos o acesso
-- direto de anon/authenticated a ela. O WHERE EXISTS abaixo continua
-- filtrando pela sessão atual normalmente, pois auth.uid() lê o
-- JWT da requisição independente de qual role executa a query
-- (mesma lógica de fix_security_invoker_mv_wrappers.sql).
create view public.vw_dominancia_municipio as
select mv.*
from public.mv_dominancia_municipio mv
where exists (
    select 1 from public.usuarios_permissoes up
    where up.user_id = auth.uid()
      and (up.sigla_uf is null or up.sigla_uf = mv.sigla_uf)
      and (up.eleicao_id is null or up.eleicao_id = mv.eleicao_id)
);
