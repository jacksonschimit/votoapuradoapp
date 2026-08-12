import { useQuery } from '@tanstack/react-query'
import { getApi } from '@/lib/api'
import type { EleitoradoZona } from '@/types/domain'

export function useEleitoradoZona(eleicaoId: string, zonaId: string) {
  return useQuery({
    queryKey: ['eleitorado-zona', eleicaoId, zonaId],
    queryFn: async () => {
      const api = await getApi()
      const { data, error } = await api
        .from('vw_eleitorado_zona')
        .select('*')
        .eq('eleicao_id', eleicaoId)
        .eq('zona_id', zonaId)
        .maybeSingle()

      if (error) throw error
      return data as EleitoradoZona | null
    },
  })
}
