-- ============================================================
-- vw_dominancia_secao (Tela de Seção, Seção 4.6) filtra
-- votacao_secao só por secao_id, sem cargo — nenhum índice
-- existente tem secao_id como coluna líder (só aparece em posições
-- intermediárias em índices compostos por eleicao_id/zona/local).
-- Descoberto em produção: ~13,4s numa seção com poucos votos.
-- ============================================================
create index idx_votacao_secao_id on public.votacao_secao
    (secao_id) include (sq_candidato, cargo, qtde_votos);
