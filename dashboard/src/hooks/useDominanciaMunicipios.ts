import { useQuery } from '@tanstack/react-query'
import { getApi } from '@/lib/api'
import type { Cargo, DominanciaMunicipio } from '@/types/domain'

export interface LiderMunicipio {
  codigoMunicipio: number
  nomeMunicipio: string
  nomeCandidato: string
  siglaPartido: string
  percentualDominancia: number
  qtdeVotos: number
}

// GET /vw_dominancia_municipio, reduzido no cliente para o
// candidato líder de cada município — usado para colorir o mapa
// coroplético (Tela 2, Seção 4.4).
export function useDominanciaMunicipios(eleicaoId: string, uf: string, cargo: Cargo) {
  return useQuery({
    queryKey: ['dominancia-municipios', eleicaoId, uf, cargo],
    queryFn: async (): Promise<Map<number, LiderMunicipio>> => {
      const api = await getApi()
      const { data, error } = await api
        .from('vw_dominancia_municipio')
        .select('*')
        .eq('eleicao_id', eleicaoId)
        .eq('sigla_uf', uf)
        .eq('cargo', cargo)

      if (error) throw error

      const lideres = new Map<number, LiderMunicipio>()
      for (const linha of data as DominanciaMunicipio[]) {
        const atual = lideres.get(linha.codigo_municipio)
        if (!atual || linha.percentual_dominancia > atual.percentualDominancia) {
          lideres.set(linha.codigo_municipio, {
            codigoMunicipio: linha.codigo_municipio,
            nomeMunicipio: linha.nome_municipio,
            nomeCandidato: linha.nm_urna_candidato,
            siglaPartido: linha.sigla_partido,
            percentualDominancia: linha.percentual_dominancia,
            qtdeVotos: linha.qtde_votos,
          })
        }
      }
      return lideres
    },
  })
}
