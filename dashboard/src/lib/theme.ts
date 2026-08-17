// Lê o valor real (oklch(...)) de um token de cor definido em
// index.css, para uso em contextos que não aceitam classes Tailwind
// (ex.: estilo inline do Leaflet). Evita repetir hex/oklch cru em
// componentes — sempre ler do token central (doc 05 §4).
export function corToken(nomeVariavel: string): string {
  if (typeof window === 'undefined') return ''
  return getComputedStyle(document.documentElement).getPropertyValue(nomeVariavel).trim()
}

// Interpola uma cor de "calor" (âmbar pálido → vermelho escuro) para
// uma intensidade normalizada 0–1 — usado nos mapas de calor por
// votação (feedback de produto, 2026-08-17: mapa por município no
// Diagnóstico, e futuramente o mapa intra-cidade por local de
// votação). Não é um token fixo em index.css porque o gradiente é
// contínuo, não um estado discreto como os tokens semânticos.
export function corCalor(intensidade: number): string {
  const t = Math.min(1, Math.max(0, intensidade))
  const luminosidade = 0.92 - t * 0.55
  const croma = 0.03 + t * 0.19
  const matiz = 45 - t * 15
  return `oklch(${luminosidade.toFixed(3)} ${croma.toFixed(3)} ${matiz.toFixed(1)})`
}
