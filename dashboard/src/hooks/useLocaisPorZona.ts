import { useQuery } from '@tanstack/react-query'
import { getApi } from '@/lib/api'
import type { LocalVotacao } from '@/types/domain'

export function useLocaisPorZona(zonaId: string) {
  return useQuery({
    queryKey: ['locais-por-zona', zonaId],
    queryFn: async () => {
      const api = await getApi()
      const { data, error } = await api
        .from('local_votacao')
        .select('*')
        .eq('zona_id', zonaId)
        .order('nome_local', { ascending: true })

      if (error) throw error
      return data as LocalVotacao[]
    },
  })
}
