import { useQuery } from '@tanstack/react-query'
import { getApi } from '@/lib/api'
import type { Cargo, VotosValidosCargoMunicipio } from '@/types/domain'

// GET /vw_votos_validos_cargo_municipio — total de votos válidos do
// cargo por município (todos os candidatos somados), usado como
// denominador da Participação Territorial (PT, doc 03 §2.2).
export function useVotosValidosCargoMunicipio(eleicaoId: string, uf: string, cargo: Cargo) {
  return useQuery({
    queryKey: ['votos-validos-cargo-municipio', eleicaoId, uf, cargo],
    queryFn: async () => {
      const api = await getApi()
      const { data, error } = await api
        .from('vw_votos_validos_cargo_municipio')
        .select('*')
        .eq('eleicao_id', eleicaoId)
        .eq('sigla_uf', uf)
        .eq('cargo', cargo)

      if (error) throw error
      return data as VotosValidosCargoMunicipio[]
    },
  })
}
