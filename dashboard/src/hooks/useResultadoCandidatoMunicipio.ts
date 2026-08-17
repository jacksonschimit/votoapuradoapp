import { useQuery } from '@tanstack/react-query'
import { fetchResultadoCandidatoMunicipio } from '@/lib/api/candidatos'

// GET /vw_resultado_candidato_municipio — desempenho do candidato
// por município (Tela 6 — Perfil do Candidato, Seção 4.8).
export function useResultadoCandidatoMunicipio(sqCandidato: string, enabled = true) {
  return useQuery({
    queryKey: ['resultado-candidato-municipio', sqCandidato],
    queryFn: () => fetchResultadoCandidatoMunicipio(sqCandidato),
    enabled,
  })
}
