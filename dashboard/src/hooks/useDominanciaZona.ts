import { useQuery } from '@tanstack/react-query'
import { getApi } from '@/lib/api'
import type { Cargo, DominanciaZona, LinhaRanking } from '@/types/domain'

// GET /vw_dominancia_zona (Seção 2.8 / 4.6).
export function useDominanciaZona(zonaId: string, cargo: Cargo) {
  return useQuery({
    queryKey: ['dominancia-zona', zonaId, cargo],
    queryFn: async (): Promise<LinhaRanking[]> => {
      const api = await getApi()
      const { data, error } = await api
        .from('vw_dominancia_zona')
        .select('*')
        .eq('zona_id', zonaId)
        .eq('cargo', cargo)
        .order('qtde_votos', { ascending: false })

      if (error) throw error

      return (data as DominanciaZona[]).map((r) => ({
        sqCandidato: r.sq_candidato,
        nome: r.nm_urna_candidato,
        partido: r.sigla_partido,
        cargo: r.cargo,
        votos: r.qtde_votos,
        percentual: r.percentual_dominancia / 100,
      }))
    },
  })
}
