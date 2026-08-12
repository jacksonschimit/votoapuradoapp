-- ============================================================
-- TABELA: usuarios_perfil — espelha auth.users com dados de exibição.
-- Populada automaticamente via trigger no primeiro login (Google
-- OAuth ou e-mail/senha), independente do provedor configurado.
-- ============================================================
create table public.usuarios_perfil (
    user_id       uuid        primary key references auth.users(id) on delete cascade,
    email         text        not null,
    nome_exibicao text,
    avatar_url    text,
    criado_em     timestamptz not null default now()
);

alter table public.usuarios_perfil enable row level security;

create policy "usuario_le_proprio_perfil"
    on public.usuarios_perfil for select to authenticated
    using (user_id = auth.uid());

-- Trigger que popula usuarios_perfil automaticamente a cada novo login
create function public.handle_novo_usuario()
returns trigger as $$
begin
    insert into public.usuarios_perfil (user_id, email, nome_exibicao, avatar_url)
    values (
        new.id, new.email,
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'avatar_url'
    )
    on conflict (user_id) do nothing;
    return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_novo_usuario();
