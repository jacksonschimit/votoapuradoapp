import { useQuery } from '@tanstack/react-query'
import { getApi } from '@/lib/api'
import type { ResultadoCandidatoMunicipio } from '@/types/domain'

// GET /vw_resultado_candidato_municipio — desempenho do candidato
// por município (Tela 6 — Perfil do Candidato, Seção 4.8).
export function useResultadoCandidatoMunicipio(sqCandidato: string) {
  return useQuery({
    queryKey: ['resultado-candidato-municipio', sqCandidato],
    queryFn: async () => {
      const api = await getApi()
      const { data, error } = await api
        .from('vw_resultado_candidato_municipio')
        .select('*')
        .eq('sq_candidato', sqCandidato)
        .order('total_votos', { ascending: false })

      if (error) throw error
      return data as ResultadoCandidatoMunicipio[]
    },
  })
}
