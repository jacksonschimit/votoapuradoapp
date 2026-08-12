-- ============================================================
-- View de dominância por Município (Seção 2.8 do documento não
-- previu esse nível — só Seção/Local/Zona — mas o mapa coroplético
-- da Tela 2, Seção 4.4, precisa dele). Mesmo padrão das demais
-- views de dominância, incluindo security_invoker = true desde a
-- criação (ver correção de segurança em fix_rls_materialized_views).
-- ============================================================
create view public.vw_dominancia_municipio
    with (security_invoker = true) as
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
