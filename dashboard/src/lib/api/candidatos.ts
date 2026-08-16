import { getApi } from '@/lib/api'
import type { Candidato, ResultadoCandidatoMunicipio } from '@/types/domain'

// Funções de fetch puras (sem hook) para candidato + resultado por
// município — extraídas de useCandidato/useResultadoCandidatoMunicipio
// para serem reaproveitadas tanto pelos hooks de um candidato só
// quanto pelo useComparativoCandidatos (Épico 6), que precisa de um
// número dinâmico de queries via useQueries.
export async function fetchCandidato(sqCandidato: string): Promise<Candidato | null> {
  const api = await getApi()
  const { data, error } = await api.from('candidatos').select('*').eq('sq_candidato', sqCandidato).maybeSingle()
  if (error) throw error
  return data as Candidato | null
}

export async function fetchResultadoCandidatoMunicipio(sqCandidato: string): Promise<ResultadoCandidatoMunicipio[]> {
  const api = await getApi()
  const { data, error } = await api
    .from('vw_resultado_candidato_municipio')
    .select('*')
    .eq('sq_candidato', sqCandidato)
    .order('total_votos', { ascending: false })
  if (error) throw error
  return data as ResultadoCandidatoMunicipio[]
}
