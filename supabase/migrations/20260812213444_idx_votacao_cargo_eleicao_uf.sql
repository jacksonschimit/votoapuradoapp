-- ============================================================
-- Índice faltante descoberto em produção: as 4 views de dominância
-- (Seção/Local/Zona/Município — Seção 2.8) e o mapa coroplético
-- filtram votacao_secao por cargo (+ eleicao_id/sigla_uf), mas
-- nenhum índice existente tem "cargo" como coluna líder. Isso
-- forçava um Seq Scan completo em cada partição (~900 mil linhas
-- na de PR) a cada consulta — confirmado via EXPLAIN ANALYZE
-- (~1,8-3s por consulta no VPS de produção).
-- ============================================================
create index idx_votacao_cargo_eleicao_uf on public.votacao_secao
    (cargo, eleicao_id, sigla_uf)
    include (codigo_municipio, sq_candidato, qtde_votos, secao_id, local_votacao_id, zona_id);
