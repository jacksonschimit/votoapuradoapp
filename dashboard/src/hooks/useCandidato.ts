import { useQuery } from '@tanstack/react-query'
import { fetchCandidato } from '@/lib/api/candidatos'

export function useCandidato(sqCandidato: string, enabled = true) {
  return useQuery({
    queryKey: ['candidato', sqCandidato],
    queryFn: () => fetchCandidato(sqCandidato),
    enabled,
  })
}
