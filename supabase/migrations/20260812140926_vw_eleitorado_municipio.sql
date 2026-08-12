-- ============================================================
-- View agregada de eleitorado por Município (KPIs da Tela 3 —
-- Detalhamento por Município, Seção 4.5). security_invoker = true
-- desde a criação (ver correção de segurança em
-- fix_rls_materialized_views.sql).
-- ============================================================
create view public.vw_eleitorado_municipio
    with (security_invoker = true) as
select
    se.eleicao_id,
    se.codigo_municipio,
    se.sigla_uf,
    sum(es.qtde_aptos) as qtde_aptos,
    sum(es.qtde_comparecimento) as qtde_comparecimento,
    sum(es.qtde_abstencoes) as qtde_abstencoes,
    sum(es.qtde_votos_brancos) as qtde_votos_brancos,
    sum(es.qtde_votos_nulos) as qtde_votos_nulos
from public.eleitorado_secao es
join public.secao_eleitoral se on se.id = es.secao_id
group by se.eleicao_id, se.codigo_municipio, se.sigla_uf;
