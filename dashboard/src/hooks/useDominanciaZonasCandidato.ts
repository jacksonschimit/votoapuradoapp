import { useQuery } from '@tanstack/react-query'
import { getApi } from '@/lib/api'
import type { Cargo, DominanciaZona } from '@/types/domain'

// GET /vw_dominancia_zona filtrado por candidato — todas as zonas da
// UF onde ele teve votos, usado no drill-down de Município (feedback
// de produto, 2026-08-17: substituir a lista "Ver detalhes" pobre por
// zonas com o desempenho do candidato). Filtrar pelas zonas do
// município específico é feito no componente que consome (cruzando
// com useZonasPorMunicipio) — mesma view, sem view nova.
export function useDominanciaZonasCandidato(sqCandidato: string, cargo: Cargo | null) {
  return useQuery({
    queryKey: ['dominancia-zonas-candidato', sqCandidato, cargo],
    queryFn: async () => {
      const api = await getApi()
      const { data, error } = await api
        .from('vw_dominancia_zona')
        .select('*')
        .eq('sq_candidato', sqCandidato)
        .eq('cargo', cargo!)

      if (error) throw error
      return data as DominanciaZona[]
    },
    enabled: !!cargo,
  })
}
