-- ============================================================
-- TABELA: usuarios_permissoes — escopo de acesso por usuário
-- (UF e/ou ciclo eleitoral), concedido manualmente por um admin.
-- ============================================================
create table public.usuarios_permissoes (
    id            bigint      generated always as identity primary key,
    user_id       uuid        not null references auth.users(id) on delete cascade,
    sigla_uf      char(2)     references public.uf(sigla_uf), -- null = acesso a todas as UFs
    eleicao_id    bigint      references public.eleicao(id),  -- null = acesso a todos os ciclos dentro da UF liberada
    papel         text        not null default 'cliente' check (papel in ('cliente','admin')),
    concedido_em  timestamptz not null default now(),
    concedido_por uuid        references auth.users(id),
    unique (user_id, sigla_uf, eleicao_id)
);

alter table public.usuarios_permissoes enable row level security;

create policy "usuario_le_apenas_suas_permissoes"
    on public.usuarios_permissoes for select to authenticated
    using (user_id = auth.uid());

-- ============================================================
-- Habilita RLS em todas as tabelas de fato e dimensão de dados
-- eleitorais. Sem nenhuma política de INSERT/UPDATE/DELETE para
-- 'authenticated', a escrita permanece bloqueada por padrão para
-- todo usuário que não seja Service Role (usada pelo importador).
-- ============================================================
alter table public.eleicao enable row level security;
alter table public.uf enable row level security;
alter table public.municipio enable row level security;
alter table public.zona_eleitoral enable row level security;
alter table public.local_votacao enable row level security;
alter table public.secao_eleitoral enable row level security;
alter table public.candidatos enable row level security;
alter table public.votacao_secao enable row level security;
alter table public.eleitorado_secao enable row level security;

-- Metadados sem dado sensível de escopo: leitura liberada a todo
-- usuário autenticado.
create policy "leitura_eleicoes" on public.eleicao for select to authenticated using (true);
create policy "leitura_uf" on public.uf for select to authenticated using (true);

-- Município, zona, local de votação e seção herdam o escopo por UF
-- (e, quando aplicável, por ciclo eleitoral) através da própria
-- sigla_uf/eleicao_id de cada tabela.
create policy "leitura_municipio_restrita" on public.municipio
    for select to authenticated
    using (
        exists (
            select 1 from public.usuarios_permissoes up
            where up.user_id = auth.uid()
              and (up.sigla_uf is null or up.sigla_uf = municipio.sigla_uf)
        )
    );

create policy "leitura_zona_restrita" on public.zona_eleitoral
    for select to authenticated
    using (
        exists (
            select 1 from public.usuarios_permissoes up
            where up.user_id = auth.uid()
              and (up.sigla_uf is null or up.sigla_uf = zona_eleitoral.sigla_uf)
        )
    );

create policy "leitura_local_votacao_restrita" on public.local_votacao
    for select to authenticated
    using (
        exists (
            select 1 from public.usuarios_permissoes up
            where up.user_id = auth.uid()
              and (up.sigla_uf is null or up.sigla_uf = local_votacao.sigla_uf)
              and (up.eleicao_id is null or up.eleicao_id = local_votacao.eleicao_id)
        )
    );

create policy "leitura_secao_restrita" on public.secao_eleitoral
    for select to authenticated
    using (
        exists (
            select 1 from public.usuarios_permissoes up
            where up.user_id = auth.uid()
              and (up.sigla_uf is null or up.sigla_uf = secao_eleitoral.sigla_uf)
              and (up.eleicao_id is null or up.eleicao_id = secao_eleitoral.eleicao_id)
        )
    );

create policy "leitura_candidatos_restrita" on public.candidatos
    for select to authenticated
    using (
        exists (
            select 1 from public.usuarios_permissoes up
            where up.user_id = auth.uid()
              and (up.sigla_uf is null or up.sigla_uf = candidatos.sigla_uf)
              and (up.eleicao_id is null or up.eleicao_id = candidatos.eleicao_id)
        )
    );

-- Política de leitura restrita por UF E por ciclo eleitoral autorizados
-- (tabela crítica de maior volume).
create policy "leitura_votacao_restrita" on public.votacao_secao
    for select to authenticated
    using (
        exists (
            select 1 from public.usuarios_permissoes up
            where up.user_id = auth.uid()
              and (up.sigla_uf is null or up.sigla_uf = votacao_secao.sigla_uf)
              and (up.eleicao_id is null or up.eleicao_id = votacao_secao.eleicao_id)
        )
    );

create policy "leitura_eleitorado_restrita" on public.eleitorado_secao
    for select to authenticated
    using (
        exists (
            select 1 from public.usuarios_permissoes up
            where up.user_id = auth.uid()
              and (up.eleicao_id is null or up.eleicao_id = eleitorado_secao.eleicao_id)
        )
    );
