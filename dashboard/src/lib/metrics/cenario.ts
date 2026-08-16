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

export interface TerritorioDistribuivel {
  codigoMunicipio: number
  votosValidosTerritorio: number
  votosAtuais: number
}

// "Distribuição sugerida" do Simulador de Cenários (Épico 5, doc 06
// §4): reparte uma meta de crescimento entre territórios
// proporcionalmente ao tamanho do eleitorado válido de cada um
// (território maior recebe parcela maior), sempre respeitando o teto
// de 100% de participação (doc 03 §6). É um critério simples e
// explicável — não uma otimização por força relativa/QL — porque a
// sugestão precisa caber numa frase curta no disclaimer da tela.
export function sugerirDistribuicao(
  territorios: TerritorioDistribuivel[],
  metaTotalVotos: number
): Map<number, number> {
  const pesoTotal = territorios.reduce((soma, t) => soma + t.votosValidosTerritorio, 0)
  const sugestao = new Map<number, number>()

  for (const t of territorios) {
    const parcela = pesoTotal > 0 ? metaTotalVotos * (t.votosValidosTerritorio / pesoTotal) : 0
    const metaSugerida = Math.min(t.votosValidosTerritorio, Math.round(t.votosAtuais + parcela))
    sugestao.set(t.codigoMunicipio, Math.max(0, metaSugerida))
  }

  return sugestao
}
