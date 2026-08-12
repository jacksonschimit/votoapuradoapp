import { useEffect, useState } from 'react'

// Seção 4.9 — usado para alternar entre componentes desktop/mobile
// (ex.: Tabs de nível viram Select em telas estreitas).
export function useMediaQuery(query: string): boolean {
  const [corresponde, setCorresponde] = useState(() => window.matchMedia(query).matches)

  useEffect(() => {
    const mql = window.matchMedia(query)
    const ouvinte = () => setCorresponde(mql.matches)
    ouvinte()
    mql.addEventListener('change', ouvinte)
    return () => mql.removeEventListener('change', ouvinte)
  }, [query])

  return corresponde
}
