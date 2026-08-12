import { useQuery } from '@tanstack/react-query'
import { getApi } from '@/lib/api'
import type { Municipio } from '@/types/domain'

// GET /municipio — lista de municípios da UF. Serve como ponto de
// entrada para a Tela 3 (Seção 4.5) enquanto o mapa coroplético
// (Seção 4.4) não está implementado.
export function useMunicipios(uf: string) {
  return useQuery({
    queryKey: ['municipios', uf],
    queryFn: async () => {
      const api = await getApi()
      const { data, error } = await api
        .from('municipio')
        .select('*')
        .eq('sigla_uf', uf)
        .order('nome_municipio', { ascending: true })

      if (error) throw error
      return data as Municipio[]
    },
  })
}
