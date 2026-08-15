// Simulação matemática de cenário (doc 03 §6): votos_cenario =
// votos_válidos_históricos × participação_simulada. Aqui usada num
// cenário FIXO pequeno só para alimentar a classificação de
// Oportunidades (doc 03 §5) — o simulador interativo com metas
// customizáveis (+5k/+10k/+20k/personalizada) é do Épico 5 e vai
// reaproveitar esta mesma função.
//
// Regra de linguagem (doc 03 §6): "ganho no cenário", nunca
// "previsão"/"projeção" — texto obrigatório de disclaimer fica na UI
// que consome isto, não aqui.
export interface ResultadoCenario {
  votosCenario: number
  ganhoCenario: number
}

export function calcularGanhoCenario(
  votosValidosTerritorio: number,
  participacaoSimulada: number,
  votosAtuaisCandidato: number
): ResultadoCenario {
  const participacaoClampeada = Math.min(1, Math.max(0, participacaoSimulada))
  const votosCenario = votosValidosTerritorio * participacaoClampeada
  return {
    votosCenario,
    ganhoCenario: votosCenario - votosAtuaisCandidato,
  }
}
