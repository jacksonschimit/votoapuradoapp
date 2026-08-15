import { LIMIARES_CLASSIFICACAO_PROVISORIOS, type ClassificacaoTerritorio } from './classificacao'

// Papéis territoriais de Oportunidade (doc 03 §5.1) — diferente de
// Força/Sustentação/Baixa presença (classificacao.ts), que são
// dimensões independentes; aqui é uma categoria ÚNICA por território,
// derivada delas + escala + "espaço matemático" (ganho positivo num
// cenário de referência, ver cenario.ts).
//
// - Consolidação: alta força + contribuição relevante (forca && sustentacao).
// - Desenvolvimento: baixa presença + escala relevante (ainda vale o esforço).
// - Baixa prioridade histórica: baixa presença + escala irrisória.
// - Expansão: nem força nem baixa presença, mas com escala e espaço
//   real de crescimento no cenário de referência.
// - Território sem escala suficiente e sem nenhum sinal claro não
//   recebe papel (null) — regra 16 do projeto: não forçar rótulo sem
//   dado que sustente.
//
// Limiares reaproveitados de classificacao.ts (mesma fonte única,
// mesma calibração provisória — doc 03 §2.4).
export type PapelOportunidade = 'consolidacao' | 'expansao' | 'desenvolvimento' | 'baixa_prioridade'

// Cenário de referência fixo (não o simulador interativo do Épico 5)
// usado só para decidir se um território tem "espaço matemático" de
// crescimento — +5 p.p. de participação sobre o PT atual do território.
export const INCREMENTO_CENARIO_OPORTUNIDADE = 0.05

export function classificarOportunidade(
  classificacaoBase: ClassificacaoTerritorio,
  votosValidosCargoTerritorio: number,
  ganhoCenario: number | null,
  limiares = LIMIARES_CLASSIFICACAO_PROVISORIOS
): PapelOportunidade | null {
  const escalaRelevante = votosValidosCargoTerritorio >= limiares.escalaMinimaRelevante

  if (classificacaoBase.forca && classificacaoBase.sustentacao) return 'consolidacao'

  if (classificacaoBase.baixaPresenca) {
    return escalaRelevante ? 'desenvolvimento' : 'baixa_prioridade'
  }

  if (escalaRelevante && ganhoCenario !== null && ganhoCenario > 0) return 'expansao'

  return null
}
