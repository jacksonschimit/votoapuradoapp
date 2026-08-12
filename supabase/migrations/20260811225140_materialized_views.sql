-- ============================================================
-- Materialized views de resultado agregado, por candidato, nos
-- três níveis geográficos usados pelo dashboard (Município, Local
-- de Votação e UF). Ficam vazias até a primeira importação e o
-- primeiro refresh, disparado pelo importador Python.
-- ============================================================
create materialized view public.mv_resultado_candidato_municipio as
select
    v.eleicao_id, e.ano, e.tipo_eleicao,
    v.sq_candidato, c.nm_urna_candidato, c.sigla_partido, c.cargo,
    v.sigla_uf, v.codigo_municipio, m.nome_municipio,
    sum(v.qtde_votos) as total_votos
from public.votacao_secao v
join public.candidatos c on c.sq_candidato = v.sq_candidato
join public.municipio m on m.codigo_ibge = v.codigo_municipio
join public.eleicao e on e.id = v.eleicao_id
group by v.eleicao_id, e.ano, e.tipo_eleicao, v.sq_candidato, c.nm_urna_candidato,
         c.sigla_partido, c.cargo, v.sigla_uf, v.codigo_municipio, m.nome_municipio;

create unique index idx_mv_resultado_pk on public.mv_resultado_candidato_municipio
    (eleicao_id, sq_candidato, codigo_municipio);

-- Agregação por Local de Votação (mapa de currais por prédio/bairro)
create materialized view public.mv_resultado_candidato_local as
select
    v.eleicao_id, v.sq_candidato, c.nm_urna_candidato, c.sigla_partido, v.cargo,
    v.local_votacao_id, lv.nome_local, lv.endereco, lv.latitude, lv.longitude,
    v.codigo_municipio, v.sigla_uf,
    sum(v.qtde_votos) as total_votos
from public.votacao_secao v
join public.candidatos c on c.sq_candidato = v.sq_candidato
join public.local_votacao lv on lv.id = v.local_votacao_id
group by v.eleicao_id, v.sq_candidato, c.nm_urna_candidato, c.sigla_partido, v.cargo,
         v.local_votacao_id, lv.nome_local, lv.endereco, lv.latitude, lv.longitude,
         v.codigo_municipio, v.sigla_uf;

create unique index idx_mv_resultado_local_pk on public.mv_resultado_candidato_local
    (eleicao_id, sq_candidato, local_votacao_id);

create materialized view public.mv_resultado_candidato_uf as
select eleicao_id, sq_candidato, nm_urna_candidato, sigla_partido, cargo, sigla_uf,
       sum(total_votos) as total_votos_estado
from public.mv_resultado_candidato_municipio
group by eleicao_id, sq_candidato, nm_urna_candidato, sigla_partido, cargo, sigla_uf;

create unique index idx_mv_resultado_uf_pk on public.mv_resultado_candidato_uf (eleicao_id, sq_candidato);
