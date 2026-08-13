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
-- autenticação, em outro banco).
--
-- Os roles (anon/authenticated/service_role) e as funções
-- auth.uid()/auth.role() foram movidos para a migration
-- 20260811225117_auth_roles_and_functions.sql, bem mais cedo na
-- sequência — as políticas RLS das tabelas criadas logo em seguida
-- já dependem de "to authenticated" e auth.uid() existirem.
-- ============================================================

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
