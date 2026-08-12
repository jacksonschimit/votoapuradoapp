import { useQuery } from '@tanstack/react-query'
import { getApi } from '@/lib/api'
import type { DominanciaSecao, LinhaRanking } from '@/types/domain'

// GET /vw_dominancia_secao (Seção 2.8 / 4.6). Sem filtro de cargo:
// a tela de Seção mostra o resultado completo de todos os cargos
// de uma vez (Seção 4.6, modal de detalhe).
export function useDominanciaSecao(secaoId: string) {
  return useQuery({
    queryKey: ['dominancia-secao', secaoId],
    queryFn: async (): Promise<LinhaRanking[]> => {
      const api = await getApi()
      const { data, error } = await api
        .from('vw_dominancia_secao')
        .select('*')
        .eq('secao_id', secaoId)
        .order('cargo', { ascending: true })
        .order('qtde_votos', { ascending: false })

      if (error) throw error

      return (data as DominanciaSecao[]).map((r) => ({
        sqCandidato: r.sq_candidato,
        nome: r.nm_urna_candidato,
        partido: r.sigla_partido,
        cargo: r.cargo,
        votos: r.qtde_votos,
        percentual: r.percentual_dominancia / 100,
      }))
    },
  })
}
