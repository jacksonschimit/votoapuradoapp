import { useQuery } from '@tanstack/react-query'
import { getApi } from '@/lib/api'
import type { Cargo, LinhaRanking, ResultadoCandidatoUf } from '@/types/domain'

// GET /vw_resultado_candidato_uf — ranking de candidatos por cargo,
// já pré-agregado (Seção 2.7 / 4.4). Usa a view de segurança em vez
// da materialized view diretamente — mat views não suportam RLS
// nativo, então o filtro por usuarios_permissoes é replicado
// manualmente nessa view (ver migration fix_rls_materialized_views).
//
// Aqui não há percentual de dominância pré-calculado (só existe nas
// views de zona/local/seção), então o percentual sobre o
// comparecimento é calculado no componente que consome o hook.
export function useRankingCandidatos(eleicaoId: string, uf: string, cargo: Cargo) {
  return useQuery({
    queryKey: ['ranking-candidatos', eleicaoId, uf, cargo],
    queryFn: async (): Promise<LinhaRanking[]> => {
      const api = await getApi()
      const { data, error } = await api
        .from('vw_resultado_candidato_uf')
        .select('*')
        .eq('eleicao_id', eleicaoId)
        .eq('sigla_uf', uf)
        .eq('cargo', cargo)
        .order('total_votos_estado', { ascending: false })

      if (error) throw error

      return (data as ResultadoCandidatoUf[]).map((r) => ({
        sqCandidato: r.sq_candidato,
        nome: r.nm_urna_candidato,
        partido: r.sigla_partido,
        cargo: r.cargo,
        votos: r.total_votos_estado,
        percentual: null,
      }))
    },
  })
}
