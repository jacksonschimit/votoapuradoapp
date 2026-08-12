-- ============================================================
-- TABELA: log_importacoes — auditoria de cada arquivo processado
-- pelo importador (Python). Sem política de RLS para
-- 'authenticated': tabela invisível ao app cliente, acessível
-- apenas via Service Role Key (importador) ou Supabase Studio.
-- ============================================================
create table public.log_importacoes (
    id                 bigint      generated always as identity primary key,
    admin_id           uuid        references auth.users(id),
    eleicao_id         bigint      not null references public.eleicao(id),
    tipo_arquivo       text        not null,
    nome_arquivo       text        not null,
    linhas_processadas integer     not null default 0,
    linhas_descartadas integer     not null default 0,
    ip_origem          inet,
    iniciado_em        timestamptz not null,
    finalizado_em      timestamptz,
    status             text        not null check (status in ('sucesso','falha','em_andamento')),
    detalhes_erro      text
);

alter table public.log_importacoes enable row level security;
-- Nenhuma política para 'authenticated' proposital.
