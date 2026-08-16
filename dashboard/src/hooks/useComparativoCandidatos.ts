import { useQueries } from '@tanstack/react-query'
import { fetchCandidato, fetchResultadoCandidatoMunicipio } from '@/lib/api/candidatos'
import { useVotosValidosCargoMunicipio } from '@/hooks/useVotosValidosCargoMunicipio'
import { useVotosValidosCargoUf } from '@/hooks/useVotosValidosCargoUf'
import { calcularConcentracaoTopN } from '@/lib/metrics/concentracao'
import { calcularParticipacao, calcularQuocienteLocacional } from '@/lib/metrics/participacao'
import { classificarTerritorio } from '@/lib/metrics/classificacao'
import type { Cargo } from '@/types/domain'

export interface CandidatoComparativo {
  sqCandidato: string
  nome: string
  partido: string
  totalVotos: number
  concentracaoTop5: number | null
  territoriosDeForca: number
  porMunicipio: Map<number, { nomeMunicipio: string; votos: number; pt: number | null; ql: number | null }>
}

// Combina candidato + resultado por município para um número
// DINÂMICO de candidatos (candidato principal + comparação, Épico 6,
// doc 03 §9: "calcular métricas por candidato de forma independente
// no mesmo universo, com denominadores consistentes"). Usa useQueries
// em vez de chamar useCandidato/useResultadoCandidatoMunicipio num
// loop — o número de candidatos muda em tempo de execução, e hooks
// não podem ser chamados condicionalmente/em quantidade variável.
export function useComparativoCandidatos(eleicaoId: string, uf: string, cargo: Cargo, candidatoIds: string[]) {
  const candidatosQueries = useQueries({
    queries: candidatoIds.map((id) => ({
      queryKey: ['candidato', id],
      queryFn: () => fetchCandidato(id),
    })),
  })
  const resultadosQueries = useQueries({
    queries: candidatoIds.map((id) => ({
      queryKey: ['resultado-candidato-municipio', id],
      queryFn: () => fetchResultadoCandidatoMunicipio(id),
    })),
  })
  const { data: votosValidosMunicipio, isLoading: carregandoMunicipio } = useVotosValidosCargoMunicipio(
    eleicaoId,
    uf,
    cargo
  )
  const { data: votosValidosUf, isLoading: carregandoUf } = useVotosValidosCargoUf(eleicaoId, uf, cargo)

  const isLoading =
    carregandoMunicipio ||
    carregandoUf ||
    candidatosQueries.some((q) => q.isLoading) ||
    resultadosQueries.some((q) => q.isLoading)
  const isError = candidatosQueries.some((q) => q.isError) || resultadosQueries.some((q) => q.isError)

  const votosValidosPorMunicipio = new Map((votosValidosMunicipio ?? []).map((v) => [v.codigo_municipio, v.votos_validos]))
  const votosValidosCargoUf = votosValidosUf?.votos_validos ?? 0

  const candidatos: CandidatoComparativo[] = candidatoIds
    .map((id, indice) => {
      const candidato = candidatosQueries[indice]?.data
      const resultados = resultadosQueries[indice]?.data ?? []
      if (!candidato) return null

      const totalVotos = resultados.reduce((soma, r) => soma + r.total_votos, 0)
      const concentracao = calcularConcentracaoTopN(resultados)

      const porMunicipio = new Map<
        number,
        { nomeMunicipio: string; votos: number; pt: number | null; ql: number | null }
      >()
      let territoriosDeForca = 0

      for (const r of resultados) {
        const votosValidosTerritorio = votosValidosPorMunicipio.get(r.codigo_municipio) ?? 0
        const pt = calcularParticipacao(r.total_votos, votosValidosTerritorio)
        const ce = calcularParticipacao(r.total_votos, totalVotos)
        const participacaoGeral = calcularParticipacao(votosValidosTerritorio, votosValidosCargoUf)
        const ql = calcularQuocienteLocacional(ce, participacaoGeral)
        if (classificarTerritorio(ql, ce, votosValidosTerritorio).forca) territoriosDeForca += 1
        porMunicipio.set(r.codigo_municipio, { nomeMunicipio: r.nome_municipio, votos: r.total_votos, pt, ql })
      }

      return {
        sqCandidato: id,
        nome: candidato.nm_urna_candidato,
        partido: candidato.sigla_partido,
        totalVotos,
        concentracaoTop5: concentracao.percentualTopN,
        territoriosDeForca,
        porMunicipio,
      }
    })
    .filter((c): c is CandidatoComparativo => c !== null)

  return { candidatos, isLoading, isError }
}
