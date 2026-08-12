-- ============================================================
-- Correção: o TSE não usa um vocabulário estável para
-- "situação de candidatura" entre ciclos eleitorais (dados reais
-- de 2022 trazem apenas APTO/INAPTO, não DEFERIDO/INDEFERIDO/
-- CASSADO/RENUNCIA/FALECIDO como o enum original previa).
-- Como a plataforma é multieleitoral por design, convertemos essa
-- coluna de enum fixo para texto livre, evitando quebra a cada
-- novo ciclo com vocabulário diferente.
-- ============================================================
alter table public.candidatos
    alter column situacao_candidatura type text
    using situacao_candidatura::text;
