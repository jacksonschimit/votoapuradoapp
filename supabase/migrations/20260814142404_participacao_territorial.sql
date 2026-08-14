-- ============================================================
-- Épico 3 (V1.0, docs/11) — base para Participação Territorial (PT),
-- Contribuição Eleitoral (CE) e Quociente Locacional (QL), doc 03 §2.
--
-- Decisão registrada em conversa com o usuário: PT/CE/QL são
-- calculados direto de votacao_secao, NÃO de eleitorado_secao (essa
-- foi carregada usando Governador como referência para
-- branco/nulo — TSE_APP_ARCHITECTURE.md §7.2 — o que herdaria
-- imprecisão para os demais cargos). votacao_secao já contém só
-- votos válidos por candidato (branco/nulo/legenda não têm
-- sq_candidato > 0, ver importador/loaders/votacao_secao.py), então
-- "votos válidos do cargo" = soma de qtde_votos de todos os
-- candidatos daquele cargo/eleição no território.
--
-- Estas duas views entregam só os agregados de referência (todos os
-- candidatos somados) — o número por candidato já existe em
-- vw_resultado_candidato_municipio/vw_resultado_candidato_uf
-- (Seção 2.7). A fórmula de PT/CE/QL em si (razão entre dois números
-- já agregados) fica em código TypeScript puro e testado
-- (dashboard/src/lib/metrics/), não aqui — só a agregação pesada
-- sobre votacao_secao é responsabilidade do banco (regra do prompt
-- mestre: não recalcular grande agregação no navegador).
--
-- Reaproveita o índice idx_votacao_cargo_eleicao_uf (cargo,
-- eleicao_id, sigla_uf) já existente — sem migration de índice novo.
-- ============================================================

create view public.vw_votos_validos_cargo_municipio
    with (security_invoker = true) as
select
    v.eleicao_id, v.codigo_municipio, m.nome_municipio, v.sigla_uf, v.cargo,
    sum(v.qtde_votos) as votos_validos
from public.votacao_secao v
join public.municipio m on m.codigo_ibge = v.codigo_municipio
group by v.eleicao_id, v.codigo_municipio, m.nome_municipio, v.sigla_uf, v.cargo;

create view public.vw_votos_validos_cargo_uf
    with (security_invoker = true) as
select
    v.eleicao_id, v.sigla_uf, v.cargo,
    sum(v.qtde_votos) as votos_validos
from public.votacao_secao v
group by v.eleicao_id, v.sigla_uf, v.cargo;
