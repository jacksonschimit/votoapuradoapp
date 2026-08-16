import { describe, expect, it } from 'vitest'
import { calcularGanhoCenario, sugerirDistribuicao } from './cenario'

describe('calcularGanhoCenario', () => {
  it('calcula votos do cenário como votos válidos × participação simulada', () => {
    const resultado = calcularGanhoCenario(1000, 0.3, 250)
    expect(resultado.votosCenario).toBe(300)
  })

  it('calcula o ganho como a diferença entre cenário e votos atuais', () => {
    const resultado = calcularGanhoCenario(1000, 0.3, 250)
    expect(resultado.ganhoCenario).toBe(50)
  })

  it('ganho pode ser negativo (cenário abaixo do atual)', () => {
    const resultado = calcularGanhoCenario(1000, 0.1, 250)
    expect(resultado.ganhoCenario).toBe(-150)
  })

  it('não deixa a participação simulada passar de 100%', () => {
    const resultado = calcularGanhoCenario(1000, 1.5, 0)
    expect(resultado.votosCenario).toBe(1000)
  })

  it('não deixa a participação simulada ser negativa', () => {
    const resultado = calcularGanhoCenario(1000, -0.5, 0)
    expect(resultado.votosCenario).toBe(0)
  })
})

describe('sugerirDistribuicao', () => {
  it('reparte a meta proporcionalmente ao tamanho do eleitorado válido', () => {
    const sugestao = sugerirDistribuicao(
      [
        { codigoMunicipio: 1, votosValidosTerritorio: 8000, votosAtuais: 1000 },
        { codigoMunicipio: 2, votosValidosTerritorio: 2000, votosAtuais: 500 },
      ],
      1000
    )
    // território 1 tem 80% do eleitorado válido combinado -> recebe 800 da meta
    expect(sugestao.get(1)).toBe(1800)
    // território 2 tem 20% -> recebe 200 da meta
    expect(sugestao.get(2)).toBe(700)
  })

  it('não deixa a meta sugerida passar do total de votos válidos do território (teto de 100%)', () => {
    const sugestao = sugerirDistribuicao(
      [{ codigoMunicipio: 1, votosValidosTerritorio: 1000, votosAtuais: 900 }],
      5000
    )
    expect(sugestao.get(1)).toBe(1000)
  })

  it('não deixa a meta sugerida ficar negativa', () => {
    const sugestao = sugerirDistribuicao(
      [{ codigoMunicipio: 1, votosValidosTerritorio: 1000, votosAtuais: 50 }],
      -500
    )
    expect(sugestao.get(1)).toBe(0)
  })

  it('meta total zero mantém a situação atual de cada território', () => {
    const sugestao = sugerirDistribuicao(
      [{ codigoMunicipio: 1, votosValidosTerritorio: 1000, votosAtuais: 300 }],
      0
    )
    expect(sugestao.get(1)).toBe(300)
  })

  it('lida com lista vazia sem dividir por zero', () => {
    const sugestao = sugerirDistribuicao([], 1000)
    expect(sugestao.size).toBe(0)
  })
})
