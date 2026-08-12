import { useQuery } from '@tanstack/react-query'
import { getApi } from '@/lib/api'
import type { EleitoradoLocal } from '@/types/domain'

export function useEleitoradoLocal(eleicaoId: string, localVotacaoId: string) {
  return useQuery({
    queryKey: ['eleitorado-local', eleicaoId, localVotacaoId],
    queryFn: async () => {
      const api = await getApi()
      const { data, error } = await api
        .from('vw_eleitorado_local')
        .select('*')
        .eq('eleicao_id', eleicaoId)
        .eq('local_votacao_id', localVotacaoId)
        .maybeSingle()

      if (error) throw error
      return data as EleitoradoLocal | null
    },
  })
}
