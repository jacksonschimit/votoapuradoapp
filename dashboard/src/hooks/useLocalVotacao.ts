import { useQuery } from '@tanstack/react-query'
import { getApi } from '@/lib/api'
import type { LocalVotacao } from '@/types/domain'

export function useLocalVotacao(localVotacaoId: string) {
  return useQuery({
    queryKey: ['local-votacao', localVotacaoId],
    queryFn: async () => {
      const api = await getApi()
      const { data, error } = await api
        .from('local_votacao')
        .select('*')
        .eq('id', localVotacaoId)
        .maybeSingle()

      if (error) throw error
      return data as LocalVotacao | null
    },
  })
}
