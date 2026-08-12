import { useQuery } from '@tanstack/react-query'
import { getApi } from '@/lib/api'
import type { SecaoEleitoral } from '@/types/domain'

export function useSecaoEleitoral(secaoId: string) {
  return useQuery({
    queryKey: ['secao-eleitoral', secaoId],
    queryFn: async () => {
      const api = await getApi()
      const { data, error } = await api
        .from('secao_eleitoral')
        .select('*')
        .eq('id', secaoId)
        .maybeSingle()

      if (error) throw error
      return data as SecaoEleitoral | null
    },
  })
}
