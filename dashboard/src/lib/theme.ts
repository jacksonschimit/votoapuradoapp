// Lê o valor real (oklch(...)) de um token de cor definido em
// index.css, para uso em contextos que não aceitam classes Tailwind
// (ex.: estilo inline do Leaflet). Evita repetir hex/oklch cru em
// componentes — sempre ler do token central (doc 05 §4).
export function corToken(nomeVariavel: string): string {
  if (typeof window === 'undefined') return ''
  return getComputedStyle(document.documentElement).getPropertyValue(nomeVariavel).trim()
}
