import { describe, expect, it } from 'vitest'
import { classificarTerritorio, LIMIARES_CLASSIFICACAO_PROVISORIOS } from './classificacao'

const ESCALA_RELEVANTE = LIMIARES_CLASSIFICACAO_PROVISORIOS.escalaMinimaRelevante + 1
const ESCALA_IRRISORIA = LIMIARES_CLASSIFICACAO_PROVISORIOS.escalaMinimaRelevante - 1

describe('classificarTerritorio', () => {
  it('marca força quando QL >= limiar', () => {
    const resultado = classificarTerritorio(1.5, 0, ESCALA_RELEVANTE)
    expect(resultado.forca).toBe(true)
  })

  it('não marca força quando QL < limiar', () => {
    const resultado = classificarTerritorio(1.0, 0, ESCALA_RELEVANTE)
    expect(resultado.forca).toBe(false)
  })

  it('marca sustentação quando CE >= limiar, independente do QL', () => {
    const resultado = classificarTerritorio(0.3, 0.1, ESCALA_RELEVANTE)
    expect(resultado.sustentacao).toBe(true)
    expect(resultado.forca).toBe(false)
  })

  it('território pode ser força E sustentação ao mesmo tempo (não são sinônimos, mas não são exclusivos)', () => {
    const resultado = classificarTerritorio(1.5, 0.1, ESCALA_RELEVANTE)
    expect(resultado.forca).toBe(true)
    expect(resultado.sustentacao).toBe(true)
  })

  it('marca baixa presença quando QL é baixo E a escala é relevante', () => {
    const resultado = classificarTerritorio(0.2, 0, ESCALA_RELEVANTE)
    expect(resultado.baixaPresenca).toBe(true)
  })

  it('NÃO marca baixa presença quando a escala é irrisória, mesmo com QL baixo (salvaguarda anti-ruído)', () => {
    const resultado = classificarTerritorio(0.2, 0, ESCALA_IRRISORIA)
    expect(resultado.baixaPresenca).toBe(false)
  })

  it('sem dado (QL/CE null) não classifica nada como positivo', () => {
    const resultado = classificarTerritorio(null, null, ESCALA_RELEVANTE)
    expect(resultado).toEqual({ forca: false, sustentacao: false, baixaPresenca: false })
  })

  it('aceita limiares customizados (para calibração futura sem editar a função)', () => {
    const resultado = classificarTerritorio(1.05, 0, ESCALA_RELEVANTE, {
      ...LIMIARES_CLASSIFICACAO_PROVISORIOS,
      qlForca: 1.0,
    })
    expect(resultado.forca).toBe(true)
  })
})
