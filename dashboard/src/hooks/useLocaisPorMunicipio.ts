import { useQuery } from '@tanstack/react-query'
import { getApi } from '@/lib/api'
import type { LocalVotacao } from '@/types/domain'

// GET /local_votacao filtrado por município — só os locais já
// geocodificados (latitude preenchida), usado pelo mapa de calor
// intra-cidade (feedback de produto, 2026-08-17). Cobertura parcial:
// nem todo endereço do TSE resolve num serviço de geocodificação
// gratuito — ver importador/geocode_locais_votacao.py.
export function useLocaisPorMunicipio(eleicaoId: string, codigoIbge: string) {
  return useQuery({
    queryKey: ['locais-por-municipio', eleicaoId, codigoIbge],
    queryFn: async () => {
      const api = await getApi()
      const { data, error } = await api
        .from('local_votacao')
        .select('*')
        .eq('eleicao_id', eleicaoId)
        .eq('codigo_municipio', codigoIbge)
        .not('latitude', 'is', null)

      if (error) throw error
      return data as LocalVotacao[]
    },
  })
}
