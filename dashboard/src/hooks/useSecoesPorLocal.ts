import { useQuery } from '@tanstack/react-query'
import { getApi } from '@/lib/api'
import type { SecaoEleitoral } from '@/types/domain'

export function useSecoesPorLocal(localVotacaoId: string) {
  return useQuery({
    queryKey: ['secoes-por-local', localVotacaoId],
    queryFn: async () => {
      const api = await getApi()
      const { data, error } = await api
        .from('secao_eleitoral')
        .select('*')
        .eq('local_votacao_id', localVotacaoId)
        .order('numero_secao', { ascending: true })

      if (error) throw error
      return data as SecaoEleitoral[]
    },
  })
}
