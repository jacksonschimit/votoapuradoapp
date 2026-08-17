import { useQuery } from '@tanstack/react-query'
import { getApi } from '@/lib/api'
import type { Cargo, VotosValidosCargoUf } from '@/types/domain'

// GET /vw_votos_validos_cargo_uf — total de votos válidos do cargo em
// toda a UF (todos os candidatos somados), usado como denominador da
// Contribuição Eleitoral (CE) e como território-pai de referência do
// Quociente Locacional (QL, doc 03 §2.3/2.4).
export function useVotosValidosCargoUf(eleicaoId: string, uf: string, cargo: Cargo, enabled = true) {
  return useQuery({
    queryKey: ['votos-validos-cargo-uf', eleicaoId, uf, cargo],
    queryFn: async () => {
      const api = await getApi()
      const { data, error } = await api
        .from('vw_votos_validos_cargo_uf')
        .select('*')
        .eq('eleicao_id', eleicaoId)
        .eq('sigla_uf', uf)
        .eq('cargo', cargo)
        .maybeSingle()

      if (error) throw error
      return data as VotosValidosCargoUf | null
    },
    enabled,
  })
}
