-- ============================================================
-- TABELA: votacao_secao — TABELA CRÍTICA (maior volume do sistema).
-- Particionada por sigla_uf (partition by list). Cada UF ganha sua
-- própria partição física, criada sob demanda à medida que novos
-- estados forem importados (ver Seção 2.6 do TSE_APP_ARCHITECTURE.md).
--
-- Nesta primeira etapa criamos partições apenas para PR, SC e RS,
-- que são as UFs planejadas para a primeira importação. Para
-- importar qualquer outra UF no futuro, é necessário criar uma
-- nova migração com:
--   create table public.votacao_secao_xx partition of public.votacao_secao
--       for values in ('XX');
-- ANTES de rodar o importador Python para essa UF — senão o INSERT
-- falha por não haver partição correspondente.
-- ============================================================
create table public.votacao_secao (
    id               bigint      generated always as identity,
    eleicao_id       bigint      not null references public.eleicao(id),
    sq_candidato     bigint      not null references public.candidatos(sq_candidato),
    secao_id         bigint      not null references public.secao_eleitoral(id),
    local_votacao_id bigint      not null references public.local_votacao(id), -- desnormalizado para evitar JOIN no agregado por local
    zona_id          bigint      not null references public.zona_eleitoral(id),  -- desnormalizado para evitar JOIN no agregado por zona
    codigo_municipio integer     not null references public.municipio(codigo_ibge),
    sigla_uf         char(2)     not null references public.uf(sigla_uf),
    cargo            cargo_enum  not null,
    qtde_votos       integer     not null default 0 check (qtde_votos >= 0),
    criado_em        timestamptz not null default now(),
    primary key (id, sigla_uf),
    unique (eleicao_id, sq_candidato, secao_id, sigla_uf)
)
partition by list (sigla_uf);

-- Índice composto principal: eleição sempre é o primeiro filtro aplicado
-- pelo dashboard, seguido da hierarquia geográfica.
create index idx_votacao_eleicao_uf_muni_secao on public.votacao_secao
    (eleicao_id, sigla_uf, codigo_municipio, secao_id, cargo);

-- Índice para a granularidade de Local de Votação
create index idx_votacao_local on public.votacao_secao
    (eleicao_id, local_votacao_id, cargo) include (qtde_votos, sq_candidato);

-- Índice para a granularidade de Zona Eleitoral
create index idx_votacao_zona on public.votacao_secao
    (eleicao_id, zona_id, cargo) include (qtde_votos, sq_candidato);

-- Índice para agregações por candidato (visão "candidato" do dashboard)
create index idx_votacao_candidato on public.votacao_secao (sq_candidato);

-- ============================================================
-- Partições físicas — apenas UFs da primeira leva de importação.
-- ============================================================
create table public.votacao_secao_pr partition of public.votacao_secao for values in ('PR');
create table public.votacao_secao_sc partition of public.votacao_secao for values in ('SC');
create table public.votacao_secao_rs partition of public.votacao_secao for values in ('RS');
