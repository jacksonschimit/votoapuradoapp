import { useQuery } from '@tanstack/react-query'
import { getApi } from '@/lib/api'
import type { Municipio } from '@/types/domain'

// GET /municipio?codigo_ibge=eq.X — um único município.
export function useMunicipio(codigoIbge: string) {
  return useQuery({
    queryKey: ['municipio', codigoIbge],
    queryFn: async () => {
      const api = await getApi()
      const { data, error } = await api
        .from('municipio')
        .select('*')
        .eq('codigo_ibge', codigoIbge)
        .maybeSingle()

      if (error) throw error
      return data as Municipio | null
    },
  })
}
