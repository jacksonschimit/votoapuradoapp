-- ============================================================
-- TABELA: uf (dimensão de Unidade Federativa)
-- ============================================================
create table public.uf (
    sigla_uf char(2) primary key,
    nome_uf  text    not null,
    regiao   text    not null check (regiao in
                ('Norte','Nordeste','Centro-Oeste','Sudeste','Sul','Nacional'))
);

-- ============================================================
-- TABELA: municipio (dimensão de Município)
-- ============================================================
create table public.municipio (
    codigo_ibge    integer primary key,
    codigo_tse     integer not null,
    nome_municipio text    not null,
    sigla_uf       char(2) not null references public.uf(sigla_uf),
    capital        boolean not null default false
);

create index idx_municipio_uf on public.municipio (sigla_uf);
create index idx_municipio_nome_trgm on public.municipio using gin (nome_municipio gin_trgm_ops);
create unique index idx_municipio_codigo_tse on public.municipio (codigo_tse);

-- ============================================================
-- TABELA: zona_eleitoral (dimensão)
-- ============================================================
create table public.zona_eleitoral (
    id               bigint   generated always as identity primary key,
    numero_zona      smallint not null,
    codigo_municipio integer  not null references public.municipio(codigo_ibge),
    sigla_uf         char(2)  not null references public.uf(sigla_uf),
    unique (numero_zona, codigo_municipio)
);

create index idx_zona_municipio on public.zona_eleitoral (codigo_municipio);

-- ============================================================
-- TABELA: local_votacao — dimensão própria do prédio/endereço.
-- Um local de votação hospeda várias seções eleitorais (1-N).
-- Vinculado a eleicao_id porque nome/endereço podem mudar entre
-- pleitos (reforma, renumeração, mudança de escola etc.).
-- ============================================================
create table public.local_votacao (
    id               bigint  generated always as identity primary key,
    eleicao_id       bigint  not null references public.eleicao(id),
    codigo_local_tse integer not null, -- CD_LOCAL_VOTACAO do TSE
    nome_local       text    not null,
    endereco         text,
    bairro           text,
    cep              text,
    zona_id          bigint  not null references public.zona_eleitoral(id),
    codigo_municipio integer not null references public.municipio(codigo_ibge),
    sigla_uf         char(2) not null references public.uf(sigla_uf),
    latitude         numeric(10,7),
    longitude        numeric(10,7),
    unique (eleicao_id, codigo_local_tse, zona_id)
);

create index idx_local_votacao_municipio on public.local_votacao (codigo_municipio, eleicao_id);
create index idx_local_votacao_zona on public.local_votacao (zona_id, eleicao_id);
create index idx_local_votacao_nome_trgm on public.local_votacao using gin (nome_local gin_trgm_ops);
create index idx_local_votacao_endereco_trgm on public.local_votacao using gin (endereco gin_trgm_ops);
create index idx_local_votacao_geo on public.local_votacao using gist (
    ll_to_earth(latitude, longitude)
) where latitude is not null and longitude is not null;

-- ============================================================
-- TABELA: secao_eleitoral (dimensão — granularidade "micro").
-- Referencia local_votacao em vez de carregar nome/endereço soltos.
-- ============================================================
create table public.secao_eleitoral (
    id               bigint   generated always as identity primary key,
    eleicao_id       bigint   not null references public.eleicao(id),
    numero_secao     smallint not null,
    local_votacao_id bigint   not null references public.local_votacao(id),
    zona_id          bigint   not null references public.zona_eleitoral(id),
    codigo_municipio integer  not null references public.municipio(codigo_ibge),
    sigla_uf         char(2)  not null references public.uf(sigla_uf),
    unique (eleicao_id, numero_secao, zona_id)
);

create index idx_secao_municipio on public.secao_eleitoral (codigo_municipio, eleicao_id);
create index idx_secao_zona on public.secao_eleitoral (zona_id, eleicao_id);
create index idx_secao_local_votacao on public.secao_eleitoral (local_votacao_id);
