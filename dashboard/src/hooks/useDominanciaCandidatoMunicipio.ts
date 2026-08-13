import { useQuery } from '@tanstack/react-query'
import { getApi } from '@/lib/api'
import type { DominanciaMunicipio } from '@/types/domain'

// GET /vw_dominancia_municipio filtrado por candidato — municípios
// onde ele é o líder, com o percentual de dominância. Usado para a
// contagem provisória de "territórios de força" no Diagnóstico
// (Épico 2) — ver nota em lib/metrics/territorios.ts.
export function useDominanciaCandidatoMunicipio(sqCandidato: string) {
  return useQuery({
    queryKey: ['dominancia-candidato-municipio', sqCandidato],
    queryFn: async () => {
      const api = await getApi()
      const { data, error } = await api
        .from('vw_dominancia_municipio')
        .select('*')
        .eq('sq_candidato', sqCandidato)
        .order('percentual_dominancia', { ascending: false })

      if (error) throw error
      return data as DominanciaMunicipio[]
    },
  })
}
