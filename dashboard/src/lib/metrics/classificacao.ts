// Força, Sustentação e Baixa presença (doc 03 §3) — três dimensões
// independentes de leitura territorial, não uma categoria única
// mutuamente exclusiva ("Força e sustentação não são sinônimos": um
// território pode ser as duas coisas, nenhuma, ou só uma).
//
// - Força: derivada principalmente do Quociente Locacional (QL) —
//   candidato sobrerrepresentado ali frente à referência geral.
// - Sustentação: derivada principalmente da Contribuição Eleitoral
//   (CE) — território pesa muito no total de votos do candidato,
//   independente de ser proporcionalmente forte ali.
// - Baixa presença: QL baixo, mas só sinalizado com "salvaguarda para
//   territórios de volume irrisório" (doc 03 §3) — um município de
//   poucos eleitores não deve ser rotulado "fraco" por ruído
//   estatístico; exige uma escala mínima de votos válidos.
//
// Os limiares abaixo são PROVISÓRIOS — doc 03 §2.4 é explícito que
// thresholds de rótulo "devem ser calibrados com dados reais antes de
// serem tratados como regra definitiva". Isolados aqui (não
// espalhados em componente) justamente para serem fáceis de ajustar
// num só lugar quando a homologação (docs/11) trouxer evidência.
export interface LimiaresClassificacao {
  qlForca: number
  ceSustentacao: number
  qlBaixaPresenca: number
  escalaMinimaRelevante: number
}

export const LIMIARES_CLASSIFICACAO_PROVISORIOS: LimiaresClassificacao = {
  qlForca: 1.2,
  ceSustentacao: 0.05,
  qlBaixaPresenca: 0.5,
  escalaMinimaRelevante: 100,
}

export interface ClassificacaoTerritorio {
  forca: boolean
  sustentacao: boolean
  baixaPresenca: boolean
}

export function classificarTerritorio(
  quocienteLocacional: number | null,
  contribuicaoEleitoral: number | null,
  votosValidosCargoTerritorio: number,
  limiares: LimiaresClassificacao = LIMIARES_CLASSIFICACAO_PROVISORIOS
): ClassificacaoTerritorio {
  const escalaRelevante = votosValidosCargoTerritorio >= limiares.escalaMinimaRelevante

  return {
    forca: quocienteLocacional !== null && quocienteLocacional >= limiares.qlForca,
    sustentacao: contribuicaoEleitoral !== null && contribuicaoEleitoral >= limiares.ceSustentacao,
    baixaPresenca:
      escalaRelevante && quocienteLocacional !== null && quocienteLocacional < limiares.qlBaixaPresenca,
  }
}
