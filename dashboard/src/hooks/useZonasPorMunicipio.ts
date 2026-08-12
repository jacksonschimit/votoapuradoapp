import { useQuery } from '@tanstack/react-query'
import { getApi } from '@/lib/api'
import type { ZonaEleitoral } from '@/types/domain'

// GET /zona_eleitoral — zonas do município (Tela 3, Seção 4.5),
// ponto de entrada para a Visão por Zona (Seção 4.6).
export function useZonasPorMunicipio(codigoIbge: string) {
  return useQuery({
    queryKey: ['zonas', codigoIbge],
    queryFn: async () => {
      const api = await getApi()
      const { data, error } = await api
        .from('zona_eleitoral')
        .select('*')
        .eq('codigo_municipio', codigoIbge)
        .order('numero_zona', { ascending: true })

      if (error) throw error
      return data as ZonaEleitoral[]
    },
  })
}
