-- ============================================================
-- Correção da correção anterior: as views vw_resultado_candidato_*
-- não podem usar security_invoker = true, porque isso faz TODO o
-- corpo da view — inclusive o acesso à materialized view por trás
-- — rodar com os privilégios de quem consulta. Como revogamos o
-- SELECT direto nas materialized views de anon/authenticated, a
-- própria view-wrapper ficava sem conseguir ler a mat view.
--
-- A segurança aqui não depende de security_invoker: o filtro
-- explícito "where exists (... auth.uid() ...)" já garante o
-- isolamento por usuário, porque auth.uid() lê o JWT da sessão
-- atual independentemente de qual role interna executa a query.
-- Com security_invoker de volta ao padrão (false), a view roda com
-- os privilégios do dono (postgres), que tem acesso à mat view —
-- e o WHERE EXISTS continua restringindo as linhas corretamente.
-- ============================================================
alter view public.vw_resultado_candidato_municipio reset (security_invoker);
alter view public.vw_resultado_candidato_local reset (security_invoker);
alter view public.vw_resultado_candidato_uf reset (security_invoker);
