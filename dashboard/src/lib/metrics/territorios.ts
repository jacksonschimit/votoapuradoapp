// Contagem bruta de territórios "dominados" pelo candidato (dominância
// >= limiar), reaproveitando vw_dominancia_municipio (Seção 2.8).
//
// Provisório: a classificação real de "Força" (doc 03 §3) depende de
// Participação Territorial (PT) e Força Relativa (QL), que são do
// Épico 3 — essa métrica de dominância responde uma pergunta um pouco
// diferente ("em quantos municípios esse candidato lidera com folga"),
// mas já é dado real hoje, então serve de placeholder honesto até lá.
export function contarTerritoriosDominados(
  dominancias: { percentual_dominancia: number }[],
  limiar = 50
): number {
  return dominancias.filter((d) => d.percentual_dominancia >= limiar).length
}
