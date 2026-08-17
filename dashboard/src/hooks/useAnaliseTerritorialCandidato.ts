import { useCandidato } from '@/hooks/useCandidato'
import { useResultadoCandidatoMunicipio } from '@/hooks/useResultadoCandidatoMunicipio'
import { useVotosValidosCargoMunicipio } from '@/hooks/useVotosValidosCargoMunicipio'
import { useVotosValidosCargoUf } from '@/hooks/useVotosValidosCargoUf'
import { calcularParticipacao, calcularQuocienteLocacional } from '@/lib/metrics/participacao'
import { classificarTerritorio, type ClassificacaoTerritorio } from '@/lib/metrics/classificacao'
import type { Cargo } from '@/types/domain'

export interface TerritorioAnalise extends ClassificacaoTerritorio {
  codigo_municipio: number
  nome_municipio: string
  votos: number
  votosValidosTerritorio: number
  pt: number | null
  ce: number | null
  ql: number | null
}

// Combina resultado por candidato + votos válidos de referência (PT/
// CE/QL, Épico 3) por município — usado pela DiagnosticoPage e pela
// OportunidadesPage, para não duplicar a mesma junção. A agregação
// pesada já veio pronta do banco (vw_resultado_candidato_municipio,
// vw_votos_validos_cargo_*); aqui só combina números já pequenos.
//
// `enabled` (padrão true) existe pro MunicipioPage: o candidato ali
// vem do contexto global (useAppStore), que pode não estar definido
// se o usuário chegou pela navegação antiga (Visão Geral → município,
// sem nunca ter escolhido um candidato) — nesse caso as queries não
// devem disparar.
export function useAnaliseTerritorialCandidato(
  eleicaoId: string,
  uf: string,
  cargo: Cargo,
  sqCandidato: string,
  enabled = true
) {
  const candidatoQuery = useCandidato(sqCandidato, enabled)
  const resultadosQuery = useResultadoCandidatoMunicipio(sqCandidato, enabled)
  const votosValidosMunicipioQuery = useVotosValidosCargoMunicipio(eleicaoId, uf, cargo, enabled)
  const votosValidosUfQuery = useVotosValidosCargoUf(eleicaoId, uf, cargo, enabled)

  const isLoading =
    candidatoQuery.isLoading ||
    resultadosQuery.isLoading ||
    votosValidosMunicipioQuery.isLoading ||
    votosValidosUfQuery.isLoading
  const isError = resultadosQuery.isError

  const totalVotosCandidato = (resultadosQuery.data ?? []).reduce((soma, r) => soma + r.total_votos, 0)
  const votosValidosCargoUf = votosValidosUfQuery.data?.votos_validos ?? 0
  const votosValidosPorMunicipio = new Map(
    (votosValidosMunicipioQuery.data ?? []).map((v) => [v.codigo_municipio, v.votos_validos])
  )

  const territorios: TerritorioAnalise[] = (resultadosQuery.data ?? []).map((r) => {
    const votosValidosTerritorio = votosValidosPorMunicipio.get(r.codigo_municipio) ?? 0
    const pt = calcularParticipacao(r.total_votos, votosValidosTerritorio)
    const ce = calcularParticipacao(r.total_votos, totalVotosCandidato)
    const participacaoGeral = calcularParticipacao(votosValidosTerritorio, votosValidosCargoUf)
    const ql = calcularQuocienteLocacional(ce, participacaoGeral)

    return {
      codigo_municipio: r.codigo_municipio,
      nome_municipio: r.nome_municipio,
      votos: r.total_votos,
      votosValidosTerritorio,
      pt,
      ce,
      ql,
      ...classificarTerritorio(ql, ce, votosValidosTerritorio),
    }
  })

  return {
    candidato: candidatoQuery.data,
    territorios,
    totalVotosCandidato,
    isLoading,
    isError,
  }
}
