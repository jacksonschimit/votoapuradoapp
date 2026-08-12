-- ============================================================
-- View agregada de eleitorado por UF (usada pelos KPIs da Tela 2
-- — Visão Geral do Estado, Seção 4.4). eleitorado_secao não tem
-- sigla_uf direto, então agregamos via join com secao_eleitoral.
-- ============================================================
create view public.vw_eleitorado_uf as
select
    se.eleicao_id,
    se.sigla_uf,
    sum(es.qtde_aptos) as qtde_aptos,
    sum(es.qtde_comparecimento) as qtde_comparecimento,
    sum(es.qtde_abstencoes) as qtde_abstencoes,
    sum(es.qtde_votos_brancos) as qtde_votos_brancos,
    sum(es.qtde_votos_nulos) as qtde_votos_nulos,
    count(distinct se.codigo_municipio) as qtde_municipios_apurados
from public.eleitorado_secao es
join public.secao_eleitoral se on se.id = es.secao_id
group by se.eleicao_id, se.sigla_uf;
