import { useQuery } from '@tanstack/react-query'
import { getApi } from '@/lib/api'
import type { Candidato } from '@/types/domain'

export function useCandidato(sqCandidato: string) {
  return useQuery({
    queryKey: ['candidato', sqCandidato],
    queryFn: async () => {
      const api = await getApi()
      const { data, error } = await api
        .from('candidatos')
        .select('*')
        .eq('sq_candidato', sqCandidato)
        .maybeSingle()

      if (error) throw error
      return data as Candidato | null
    },
  })
}
