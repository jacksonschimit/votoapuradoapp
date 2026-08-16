-- ============================================================
-- TABELA: cenarios_salvos — persistência do Simulador de Cenários
-- (Épico 5, doc 06 §4 "salvar cenário"). Cada linha é um cenário
-- completo (meta total + territórios com a meta simulada de cada
-- um) salvo por um usuário, para um candidato/cargo/eleição/UF
-- específicos — mesma disciplina de contexto do resto do produto
-- (doc 01 §6: Eleição+Turno+Cargo+Candidato+Território consistentes).
--
-- `territorios` guarda um array jsonb em vez de uma tabela filha
-- porque é sempre lido/gravado por inteiro (o cenário todo é uma
-- unidade — não há caso de uso pra consultar territórios de um
-- cenário isoladamente), e o volume por linha é pequeno (dezenas de
-- municípios no máximo).
-- ============================================================
create table public.cenarios_salvos (
    id             bigint      generated always as identity primary key,
    user_id        uuid        not null, -- sem FK: auth.users vive num banco Supabase separado (ver split_auth_de_dados.sql)
    eleicao_id     bigint      not null references public.eleicao(id),
    sigla_uf       char(2)     not null references public.uf(sigla_uf),
    cargo          cargo_enum  not null,
    sq_candidato   bigint      not null references public.candidatos(sq_candidato),
    nome           text        not null,
    meta_total     numeric     not null default 0,
    territorios    jsonb       not null default '[]'::jsonb,
    criado_em      timestamptz not null default now(),
    atualizado_em  timestamptz not null default now()
);

create index idx_cenarios_salvos_usuario on public.cenarios_salvos (user_id, sq_candidato);

alter table public.cenarios_salvos enable row level security;

create policy "usuario_le_proprios_cenarios"
    on public.cenarios_salvos for select to authenticated
    using (user_id = auth.uid());

create policy "usuario_grava_proprios_cenarios"
    on public.cenarios_salvos for insert to authenticated
    with check (user_id = auth.uid());

create policy "usuario_atualiza_proprios_cenarios"
    on public.cenarios_salvos for update to authenticated
    using (user_id = auth.uid())
    with check (user_id = auth.uid());

create policy "usuario_exclui_proprios_cenarios"
    on public.cenarios_salvos for delete to authenticated
    using (user_id = auth.uid());

-- SELECT em tabelas novas já é concedido por
-- "alter default privileges ... grant select on tables" (migration
-- split_auth_de_dados.sql) — falta declarar escrita explicitamente,
-- igual foi feito para usuarios_perfil.
grant insert, update, delete on public.cenarios_salvos to authenticated;
