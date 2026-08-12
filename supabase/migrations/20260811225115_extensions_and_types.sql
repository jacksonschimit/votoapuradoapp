-- ============================================================
-- Extensions necessárias para busca fuzzy (trgm), índices GIN
-- compostos e cálculo de distância geográfica (mapa de locais
-- de votação).
-- ============================================================
create extension if not exists pg_trgm;
create extension if not exists btree_gin;
create extension if not exists cube;
create extension if not exists earthdistance;

-- ============================================================
-- Enums compartilhados entre as tabelas de dimensão e fato.
-- Criados antes de qualquer tabela pois são referenciados por
-- várias delas.
-- ============================================================
create type tipo_eleicao_enum as enum ('GERAL', 'MUNICIPAL');

create type cargo_enum as enum (
    'PRESIDENTE','GOVERNADOR','SENADOR','DEPUTADO FEDERAL','DEPUTADO ESTADUAL',
    'PREFEITO','VICE-PREFEITO','VEREADOR'
);

create type situacao_candidatura_enum as enum (
    'DEFERIDO','INDEFERIDO','CASSADO','RENUNCIA','FALECIDO','INAPTO',
    '2º TURNO','ELEITO','NAO ELEITO','SUPLENTE'
);
