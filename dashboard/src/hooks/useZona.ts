import { useQuery } from '@tanstack/react-query'
import { getApi } from '@/lib/api'
import type { ZonaEleitoral } from '@/types/domain'

export function useZona(zonaId: string) {
  return useQuery({
    queryKey: ['zona', zonaId],
    queryFn: async () => {
      const api = await getApi()
      const { data, error } = await api
        .from('zona_eleitoral')
        .select('*')
        .eq('id', zonaId)
        .maybeSingle()

      if (error) throw error
      return data as ZonaEleitoral | null
    },
  })
}
