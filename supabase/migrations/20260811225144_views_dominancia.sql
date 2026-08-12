-- ============================================================
-- Views analíticas de "dominância" (currais eleitorais), nas três
-- granularidades suportadas pelo dashboard: Seção, Local de
-- Votação e Zona Eleitoral.
-- ============================================================

-- Nível Seção
create view public.vw_dominancia_secao as
select
    v.eleicao_id, v.secao_id, v.sq_candidato, c.nm_urna_candidato, c.sigla_partido, v.cargo,
    v.qtde_votos, e.qtde_comparecimento,
    round((v.qtde_votos::numeric / nullif(e.qtde_comparecimento, 0)) * 100, 2) as percentual_dominancia
from public.votacao_secao v
join public.candidatos c on c.sq_candidato = v.sq_candidato
join public.eleitorado_secao e on e.secao_id = v.secao_id;

-- Nível Local de Votação (soma de comparecimento das seções do local)
create view public.vw_dominancia_local as
select
    v.eleicao_id, v.local_votacao_id, lv.nome_local, lv.endereco,
    v.sq_candidato, c.nm_urna_candidato, c.sigla_partido, v.cargo,
    sum(v.qtde_votos) as qtde_votos,
    max(comp.total_comparecimento) as qtde_comparecimento,
    round(
        (sum(v.qtde_votos)::numeric / nullif(max(comp.total_comparecimento), 0)) * 100, 2
    ) as percentual_dominancia
from public.votacao_secao v
join public.candidatos c on c.sq_candidato = v.sq_candidato
join public.local_votacao lv on lv.id = v.local_votacao_id
join (
    select se.local_votacao_id, sum(es.qtde_comparecimento) as total_comparecimento
    from public.eleitorado_secao es
    join public.secao_eleitoral se on se.id = es.secao_id
    group by se.local_votacao_id
) comp on comp.local_votacao_id = v.local_votacao_id
group by v.eleicao_id, v.local_votacao_id, lv.nome_local, lv.endereco,
         v.sq_candidato, c.nm_urna_candidato, c.sigla_partido, v.cargo;

-- Nível Zona Eleitoral
create view public.vw_dominancia_zona as
select
    v.eleicao_id, v.zona_id, ze.numero_zona,
    v.sq_candidato, c.nm_urna_candidato, c.sigla_partido, v.cargo,
    sum(v.qtde_votos) as qtde_votos,
    max(comp.total_comparecimento) as qtde_comparecimento,
    round(
        (sum(v.qtde_votos)::numeric / nullif(max(comp.total_comparecimento), 0)) * 100, 2
    ) as percentual_dominancia
from public.votacao_secao v
join public.candidatos c on c.sq_candidato = v.sq_candidato
join public.zona_eleitoral ze on ze.id = v.zona_id
join (
    select se.zona_id, sum(es.qtde_comparecimento) as total_comparecimento
    from public.eleitorado_secao es
    join public.secao_eleitoral se on se.id = es.secao_id
    group by se.zona_id
) comp on comp.zona_id = v.zona_id
group by v.eleicao_id, v.zona_id, ze.numero_zona, v.sq_candidato, c.nm_urna_candidato,
         c.sigla_partido, v.cargo;
