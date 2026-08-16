import { useQuery } from '@tanstack/react-query'
import { fetchCandidato } from '@/lib/api/candidatos'

export function useCandidato(sqCandidato: string) {
  return useQuery({
    queryKey: ['candidato', sqCandidato],
    queryFn: () => fetchCandidato(sqCandidato),
  })
}
