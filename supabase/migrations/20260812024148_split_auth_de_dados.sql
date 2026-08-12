-- ============================================================
-- Mudança de arquitetura: autenticação (login Google) passa a
-- viver em um projeto Supabase separado, usado SOMENTE para
-- Auth (gratuito). Os dados da aplicação (este banco) rodam em
-- Postgres próprio (local em dev, Locaweb/Hostinger em produção),
-- servidos via PostgREST configurado para validar os JWTs
-- emitidos por aquele projeto Supabase.
--
-- Isso exige que este banco NUNCA dependa de uma tabela real
-- auth.users (que passa a existir só no projeto Supabase de
-- autenticação, em outro banco). Mas o schema `auth`, os roles
-- (anon/authenticated/service_role) e a função auth.uid() são
-- infraestrutura real do PostgREST — precisam existir em
-- qualquer ambiente (local ou produção) onde o PostgREST rodar.
-- ============================================================

create schema if not exists auth;

do $$
begin
    if not exists (select 1 from pg_roles where rolname = 'anon') then
        create role anon nologin;
    end if;
    if not exists (select 1 from pg_roles where rolname = 'authenticated') then
        create role authenticated nologin;
    end if;
    if not exists (select 1 from pg_roles where rolname = 'service_role') then
        create role service_role nologin bypassrls;
    end if;
end
$$;

-- Lê o usuário autenticado a partir dos claims do JWT que o
-- PostgREST valida e expõe via a GUC "request.jwt.claims" —
-- mesmo mecanismo usado internamente pelo Supabase.
create or replace function auth.uid() returns uuid
    language sql stable
    as $$
    select nullif(
        current_setting('request.jwt.claims', true)::jsonb ->> 'sub',
        ''
    )::uuid
$$;

create or replace function auth.role() returns text
    language sql stable
    as $$
    select nullif(
        current_setting('request.jwt.claims', true)::jsonb ->> 'role',
        ''
    )
$$;

-- Remove o trigger/função de auto-criação de usuarios_perfil, que
-- dependia de auth.users estar na mesma base (não é mais o caso).
-- O perfil passa a ser gravado pelo próprio cliente autenticado,
-- logo após o login, via upsert na própria linha (políticas abaixo).
do $$
begin
    if exists (
        select 1 from information_schema.tables
        where table_schema = 'auth' and table_name = 'users'
    ) then
        execute 'drop trigger if exists on_auth_user_created on auth.users';
    end if;
end
$$;

drop function if exists public.handle_novo_usuario();

-- Remove as FKs para auth.users — não existe FK entre bancos
-- diferentes; a integridade referencial do lado do usuário passa
-- a ser garantida pelo próprio Supabase Auth (fonte da verdade).
alter table public.usuarios_perfil
    drop constraint if exists usuarios_perfil_user_id_fkey;

alter table public.usuarios_permissoes
    drop constraint if exists usuarios_permissoes_user_id_fkey;

alter table public.usuarios_permissoes
    drop constraint if exists usuarios_permissoes_concedido_por_fkey;

-- Permite que o usuário autenticado grave/atualize seu próprio
-- perfil (substitui o trigger que fazia isso automaticamente).
create policy "usuario_grava_proprio_perfil"
    on public.usuarios_perfil for insert to authenticated
    with check (user_id = auth.uid());

create policy "usuario_atualiza_proprio_perfil"
    on public.usuarios_perfil for update to authenticated
    using (user_id = auth.uid())
    with check (user_id = auth.uid());

-- ============================================================
-- GRANTs: o Supabase concede isso automaticamente em todo projeto
-- novo; em Postgres puro precisamos declarar explicitamente. RLS
-- continua sendo a linha de defesa real — estes GRANTs só liberam
-- a operação no nível da tabela, sem eles nenhuma policy roda.
-- ============================================================
grant usage on schema public to anon, authenticated;

grant select on all tables in schema public to anon, authenticated;
alter default privileges in schema public grant select on tables to anon, authenticated;

grant insert, update on public.usuarios_perfil to authenticated;
