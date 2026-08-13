export interface ResultadoConcentracao {
  totalVotos: number
  votosTopN: number
  percentualTopN: number | null
  topN: { codigo_municipio: number; nome_municipio: string; total_votos: number }[]
}

// Concentração territorial bruta (doc 02 §5, doc 03 §4): quanto dos
// votos do candidato estão concentrados nos N maiores municípios.
// Deliberadamente NÃO calcula HHI nem classificação qualitativa
// (Alta/Média/Baixa) — isso é do Épico 3, que precisa de calibração
// com dado real (doc 03 §4: "thresholds... a calibrar"). Aqui só o
// número bruto, que já é real e verdadeiro hoje.
//
// `resultados` precisa já vir ordenado por total_votos desc (é o que
// useResultadoCandidatoMunicipio já entrega).
export function calcularConcentracaoTopN(
  resultados: { codigo_municipio: number; nome_municipio: string; total_votos: number }[],
  n = 5
): ResultadoConcentracao {
  const totalVotos = resultados.reduce((soma, r) => soma + r.total_votos, 0)
  const topN = resultados.slice(0, n)
  const votosTopN = topN.reduce((soma, r) => soma + r.total_votos, 0)

  return {
    totalVotos,
    votosTopN,
    percentualTopN: totalVotos > 0 ? (votosTopN / totalVotos) * 100 : null,
    topN,
  }
}
