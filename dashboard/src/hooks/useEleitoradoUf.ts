import { useQuery } from '@tanstack/react-query'
import { getApi } from '@/lib/api'
import type { EleitoradoUf } from '@/types/domain'

// GET /vw_eleitorado_uf — KPIs de aptos/comparecimento/abstenção
// agregados por UF, usados na Tela 2 (Seção 4.4).
export function useEleitoradoUf(eleicaoId: string, uf: string) {
  return useQuery({
    queryKey: ['eleitorado-uf', eleicaoId, uf],
    queryFn: async () => {
      const api = await getApi()
      const { data, error } = await api
        .from('vw_eleitorado_uf')
        .select('*')
        .eq('eleicao_id', eleicaoId)
        .eq('sigla_uf', uf)
        .maybeSingle()

      if (error) throw error
      return data as EleitoradoUf | null
    },
  })
}
