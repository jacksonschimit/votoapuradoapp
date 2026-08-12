-- ============================================================
-- Views agregadas de eleitorado por Zona e por Local de Votação
-- (KPIs da Tela 4 — Visão Micro, Seção 4.6). security_invoker =
-- true desde a criação (mesma correção de segurança aplicada às
-- demais views desta sessão).
-- ============================================================
create view public.vw_eleitorado_zona
    with (security_invoker = true) as
select
    se.eleicao_id,
    se.zona_id,
    sum(es.qtde_aptos) as qtde_aptos,
    sum(es.qtde_comparecimento) as qtde_comparecimento,
    sum(es.qtde_abstencoes) as qtde_abstencoes,
    sum(es.qtde_votos_brancos) as qtde_votos_brancos,
    sum(es.qtde_votos_nulos) as qtde_votos_nulos
from public.eleitorado_secao es
join public.secao_eleitoral se on se.id = es.secao_id
group by se.eleicao_id, se.zona_id;

create view public.vw_eleitorado_local
    with (security_invoker = true) as
select
    se.eleicao_id,
    se.local_votacao_id,
    sum(es.qtde_aptos) as qtde_aptos,
    sum(es.qtde_comparecimento) as qtde_comparecimento,
    sum(es.qtde_abstencoes) as qtde_abstencoes,
    sum(es.qtde_votos_brancos) as qtde_votos_brancos,
    sum(es.qtde_votos_nulos) as qtde_votos_nulos
from public.eleitorado_secao es
join public.secao_eleitoral se on se.id = es.secao_id
group by se.eleicao_id, se.local_votacao_id;
