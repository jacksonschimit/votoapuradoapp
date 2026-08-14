// PT (Participação Territorial), CE (Contribuição Eleitoral) e QL
// (Quociente Locacional / Força Relativa) — doc 03 §2. Calculados
// aqui como razões puras sobre números já agregados pelo banco
// (votos do candidato no território, votos válidos do cargo no
// território, votos do candidato no território-pai, votos válidos do
// cargo no território-pai) — a agregação pesada sobre votacao_secao
// fica nas views vw_resultado_candidato_* e
// vw_votos_validos_cargo_* (migration participacao_territorial).
//
// Retorna razão pura (0–1), não percentual — quem exibe decide se
// multiplica por 100.

// PT = votos do candidato no território / votos válidos do cargo no território.
// CE = votos do candidato no território / total de votos do candidato no território-pai.
// Ambas são a mesma forma matemática (parte/todo) aplicada a pares diferentes —
// por isso uma função só, com nomes de parâmetro neutros.
export function calcularParticipacao(votosParte: number, votosTodo: number): number | null {
  if (votosTodo <= 0) return null
  return votosParte / votosTodo
}

// QL = participação do território nos votos do candidato (CE) /
// participação do território nos votos gerais de referência (mesma
// razão que CE, mas aplicada aos votos válidos totais do cargo em vez
// dos votos de um candidato específico).
// QL > 1: sobrerrepresentação. QL ≈ 1: proporcional. QL < 1: sub-representação.
export function calcularQuocienteLocacional(
  contribuicaoEleitoralCandidato: number | null,
  participacaoGeralTerritorio: number | null
): number | null {
  if (
    contribuicaoEleitoralCandidato === null ||
    participacaoGeralTerritorio === null ||
    participacaoGeralTerritorio <= 0
  ) {
    return null
  }
  return contribuicaoEleitoralCandidato / participacaoGeralTerritorio
}
