import { useQuery } from '@tanstack/react-query'
import { getApi } from '@/lib/api'
import type { Cargo, DominanciaLocal, LinhaRanking } from '@/types/domain'

// GET /vw_dominancia_local (Seção 2.8 / 4.6).
export function useDominanciaLocal(localVotacaoId: string, cargo: Cargo) {
  return useQuery({
    queryKey: ['dominancia-local', localVotacaoId, cargo],
    queryFn: async (): Promise<LinhaRanking[]> => {
      const api = await getApi()
      const { data, error } = await api
        .from('vw_dominancia_local')
        .select('*')
        .eq('local_votacao_id', localVotacaoId)
        .eq('cargo', cargo)
        .order('qtde_votos', { ascending: false })

      if (error) throw error

      return (data as DominanciaLocal[]).map((r) => ({
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
