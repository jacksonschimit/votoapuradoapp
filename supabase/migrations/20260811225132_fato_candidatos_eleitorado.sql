-- ============================================================
-- TABELA: candidatos
-- ============================================================
create table public.candidatos (
    sq_candidato          bigint                    primary key, -- SQ_CANDIDATO original do TSE (único globalmente por pleito)
    eleicao_id            bigint                    not null references public.eleicao(id),
    nr_candidato          integer                   not null,
    nm_candidato          text                      not null,
    nm_urna_candidato     text                      not null,
    nm_social_candidato   text,
    cargo                 cargo_enum                not null,
    sigla_uf              char(2)                   not null references public.uf(sigla_uf),
    codigo_municipio      integer                   references public.municipio(codigo_ibge), -- obrigatório para cargos municipais
    sigla_partido         text                      not null,
    nome_partido          text                      not null,
    numero_partido        smallint                  not null,
    sigla_coligacao       text,
    nome_coligacao        text,
    situacao_candidatura  situacao_candidatura_enum,
    situacao_totalizacao  text,
    genero                text,
    grau_instrucao        text,
    ocupacao              text,
    idade_posse           smallint,
    foto_url              text,
    criado_em             timestamptz               not null default now()
);

create index idx_candidatos_eleicao_uf_cargo on public.candidatos (eleicao_id, sigla_uf, cargo);
create index idx_candidatos_municipio on public.candidatos (codigo_municipio, eleicao_id) where codigo_municipio is not null;
create index idx_candidatos_partido on public.candidatos (sigla_partido, eleicao_id);
create index idx_candidatos_numero on public.candidatos (nr_candidato, sigla_uf, cargo, eleicao_id);
create index idx_candidatos_nome_trgm on public.candidatos using gin (nm_urna_candidato gin_trgm_ops);

-- ============================================================
-- TABELA: eleitorado_secao
-- ============================================================
create table public.eleitorado_secao (
    secao_id            bigint  primary key references public.secao_eleitoral(id),
    eleicao_id          bigint  not null references public.eleicao(id),
    qtde_aptos          integer not null default 0,
    qtde_comparecimento integer not null default 0,
    qtde_abstencoes     integer not null default 0,
    qtde_votos_brancos  integer not null default 0,
    qtde_votos_nulos    integer not null default 0
);

create index idx_eleitorado_eleicao on public.eleitorado_secao (eleicao_id);
