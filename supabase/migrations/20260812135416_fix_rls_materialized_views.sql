-- ============================================================
-- CORREÇÃO DE SEGURANÇA (duas causas distintas, mesmo sintoma:
-- dados visíveis mesmo sem autenticação / fora do escopo do
-- usuário):
--
-- 1) Materialized views não suportam Row Level Security nativo no
--    Postgres (ALTER MATERIALIZED VIEW ... ENABLE ROW LEVEL
--    SECURITY não existe). As 3 materialized views de resultado
--    (Seção 2.7) ficaram, desde a criação, acessíveis
--    integralmente por qualquer usuário — inclusive anon.
--
-- 2) Toda VIEW comum criada pelo usuário `postgres` (superusuário,
--    com BYPASSRLS implícito) também ignora RLS das tabelas base
--    para QUALQUER pessoa que a consulte — não só para quem a
--    criou. Isso já afetava as views de dominância da Seção 2.8
--    desde a v1, e a vw_eleitorado_uf criada nesta sessão. A
--    correção é marcar toda view com security_invoker = true
--    (Postgres 15+), forçando-a a rodar com os privilégios/RLS de
--    quem está consultando, não do dono.
-- ============================================================

alter view public.vw_dominancia_secao set (security_invoker = true);
alter view public.vw_dominancia_local set (security_invoker = true);
alter view public.vw_dominancia_zona set (security_invoker = true);
alter view public.vw_eleitorado_uf set (security_invoker = true);

revoke select on public.mv_resultado_candidato_municipio from anon, authenticated;
revoke select on public.mv_resultado_candidato_local from anon, authenticated;
revoke select on public.mv_resultado_candidato_uf from anon, authenticated;

create view public.vw_resultado_candidato_municipio
    with (security_invoker = true) as
select mv.*
from public.mv_resultado_candidato_municipio mv
where exists (
    select 1 from public.usuarios_permissoes up
    where up.user_id = auth.uid()
      and (up.sigla_uf is null or up.sigla_uf = mv.sigla_uf)
      and (up.eleicao_id is null or up.eleicao_id = mv.eleicao_id)
);

create view public.vw_resultado_candidato_local
    with (security_invoker = true) as
select mv.*
from public.mv_resultado_candidato_local mv
where exists (
    select 1 from public.usuarios_permissoes up
    where up.user_id = auth.uid()
      and (up.sigla_uf is null or up.sigla_uf = mv.sigla_uf)
      and (up.eleicao_id is null or up.eleicao_id = mv.eleicao_id)
);

create view public.vw_resultado_candidato_uf
    with (security_invoker = true) as
select mv.*
from public.mv_resultado_candidato_uf mv
where exists (
    select 1 from public.usuarios_permissoes up
    where up.user_id = auth.uid()
      and (up.sigla_uf is null or up.sigla_uf = mv.sigla_uf)
      and (up.eleicao_id is null or up.eleicao_id = mv.eleicao_id)
);
