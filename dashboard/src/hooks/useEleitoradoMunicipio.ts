import { useQuery } from '@tanstack/react-query'
import { getApi } from '@/lib/api'
import type { EleitoradoMunicipio } from '@/types/domain'

// GET /vw_eleitorado_municipio — KPIs de aptos/comparecimento do
// município (Tela 3, Seção 4.5).
export function useEleitoradoMunicipio(eleicaoId: string, codigoIbge: string) {
  return useQuery({
    queryKey: ['eleitorado-municipio', eleicaoId, codigoIbge],
    queryFn: async () => {
      const api = await getApi()
      const { data, error } = await api
        .from('vw_eleitorado_municipio')
        .select('*')
        .eq('eleicao_id', eleicaoId)
        .eq('codigo_municipio', codigoIbge)
        .maybeSingle()

      if (error) throw error
      return data as EleitoradoMunicipio | null
    },
  })
}
