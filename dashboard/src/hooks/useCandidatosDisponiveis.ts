import { useQuery } from '@tanstack/react-query'
import { getApi } from '@/lib/api'
import { CARGOS_NACIONAIS, type Cargo } from '@/types/domain'

export interface CandidatoDisponivel {
  sqCandidato: number
  nome: string
  partido: string
}

// GET /candidatos filtrado por eleição + cargo — alimenta o seletor
// de candidato do AnalysisContextBar (doc 04 §3). Cargos de
// candidatura nacional (Presidente) não são filtrados por UF, já que
// candidatos.sigla_uf = 'BR' para eles (ver domain.ts CARGOS_NACIONAIS
// e TSE_APP_ARCHITECTURE.md §7.2).
export function useCandidatosDisponiveis(eleicaoId: number | null, uf: string | null, cargo: Cargo | null) {
  return useQuery({
    queryKey: ['candidatos-disponiveis', eleicaoId, uf, cargo],
    queryFn: async (): Promise<CandidatoDisponivel[]> => {
      const api = await getApi()
      let query = api
        .from('candidatos')
        .select('sq_candidato, nm_urna_candidato, sigla_partido')
        .eq('eleicao_id', eleicaoId!)
        .eq('cargo', cargo!)

      if (cargo && !(CARGOS_NACIONAIS as readonly string[]).includes(cargo)) {
        query = query.eq('sigla_uf', uf!)
      }

      const { data, error } = await query.order('nm_urna_candidato', { ascending: true })
      if (error) throw error

      return (data as { sq_candidato: number; nm_urna_candidato: string; sigla_partido: string }[]).map(
        (c) => ({ sqCandidato: c.sq_candidato, nome: c.nm_urna_candidato, partido: c.sigla_partido })
      )
    },
    enabled: !!eleicaoId && !!cargo && (!!uf || (!!cargo && (CARGOS_NACIONAIS as readonly string[]).includes(cargo))),
  })
}
