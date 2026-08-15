import { describe, expect, it } from 'vitest'
import { calcularGanhoCenario } from './cenario'

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
