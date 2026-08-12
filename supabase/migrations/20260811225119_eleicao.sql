-- ============================================================
-- TABELA: eleicao — dimensão mestre de ciclo eleitoral.
-- Toda tabela de fato referencia esta tabela via eleicao_id,
-- habilitando o suporte multieleitoral (qualquer ano/tipo/turno).
-- ============================================================
create table public.eleicao (
    id                bigint              generated always as identity primary key,
    ano               smallint            not null,
    tipo_eleicao      tipo_eleicao_enum   not null,
    turno             smallint            not null check (turno in (1,2)),
    descricao         text                not null, -- ex.: "Eleições Gerais 2022 - 1º Turno"
    data_pleito       date,
    ativa_para_import boolean             not null default true, -- flag operacional do backoffice
    criado_em         timestamptz         not null default now(),
    unique (ano, tipo_eleicao, turno)
);

create index idx_eleicao_ano_tipo on public.eleicao (ano, tipo_eleicao);
