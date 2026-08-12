-- ============================================================
-- Uso local (dev) apenas. Desde a migration
-- 20260812024148_split_auth_de_dados.sql, os roles
-- (anon/authenticated/service_role) e a função auth.uid() já são
-- parte real e versionada do schema (necessários em qualquer
-- ambiente onde o PostgREST rodar, local ou produção).
--
-- O que resta aqui é só uma tabela auth.users vestigial, útil
-- unicamente se algum dia quisermos simular localmente um insert
-- de usuário sem depender do fluxo real via Supabase Auth + JWT.
-- Nenhuma FK do schema real aponta mais para ela.
-- ============================================================
create extension if not exists pgcrypto;

create schema if not exists auth;

create table if not exists auth.users (
    id uuid primary key default gen_random_uuid(),
    email text,
    raw_user_meta_data jsonb not null default '{}'::jsonb
);
