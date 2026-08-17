import { useQuery } from '@tanstack/react-query'
import { getApi } from '@/lib/api'
import type { Cargo, DominanciaLocal } from '@/types/domain'

// GET /vw_dominancia_local filtrado por candidato — todos os locais
// de votação da UF onde ele teve votos. O mapa de calor intra-cidade
// cruza isto com useLocaisPorMunicipio (latitude/longitude) no
// componente, mesma view existente, sem view nova.
export function useDominanciaLocaisCandidato(sqCandidato: string, cargo: Cargo | null) {
  return useQuery({
    queryKey: ['dominancia-locais-candidato', sqCandidato, cargo],
    queryFn: async () => {
      const api = await getApi()
      const { data, error } = await api
        .from('vw_dominancia_local')
        .select('*')
        .eq('sq_candidato', sqCandidato)
        .eq('cargo', cargo!)

      if (error) throw error
      return data as DominanciaLocal[]
    },
    enabled: !!cargo,
  })
}
