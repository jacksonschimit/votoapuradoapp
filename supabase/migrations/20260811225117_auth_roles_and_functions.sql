-- ============================================================
-- Roles (anon/authenticated/service_role) e funções auth.uid()/
-- auth.role() — infraestrutura real do PostgREST, necessária em
-- qualquer ambiente onde ele rodar (local ou produção). Extraído
-- de split_auth_de_dados.sql para ficar bem no início da sequência:
-- as políticas RLS das próximas migrations já usam "to authenticated"
-- e auth.uid(), então os roles precisam existir antes de qualquer
-- tabela com RLS ser criada.
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
