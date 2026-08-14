import { describe, expect, it } from 'vitest'
import { calcularParticipacao, calcularQuocienteLocacional } from './participacao'

describe('calcularParticipacao', () => {
  it('calcula a razão parte/todo', () => {
    expect(calcularParticipacao(50, 200)).toBeCloseTo(0.25)
  })

  it('retorna null quando o todo é zero (sem divisão por zero)', () => {
    expect(calcularParticipacao(10, 0)).toBeNull()
  })

  it('retorna null quando o todo é negativo (dado inconsistente)', () => {
    expect(calcularParticipacao(10, -5)).toBeNull()
  })

  it('retorna 0 quando a parte é zero mas o todo não', () => {
    expect(calcularParticipacao(0, 100)).toBe(0)
  })

  it('pode retornar 1 (candidato é 100% dos votos válidos do território)', () => {
    expect(calcularParticipacao(100, 100)).toBe(1)
  })
})

describe('calcularQuocienteLocacional', () => {
  it('QL > 1 quando o candidato é sobrerrepresentado no território', () => {
    // Candidato tem 20% dos seus votos nesse município (CE), mas o
    // município só representa 10% dos votos válidos gerais do cargo —
    // o candidato está proporcionalmente mais forte ali.
    const ql = calcularQuocienteLocacional(0.2, 0.1)
    expect(ql).toBe(2)
  })

  it('QL ≈ 1 quando a presença é proporcional à referência', () => {
    expect(calcularQuocienteLocacional(0.15, 0.15)).toBe(1)
  })

  it('QL < 1 quando o candidato é sub-representado no território', () => {
    const ql = calcularQuocienteLocacional(0.05, 0.2)
    expect(ql).toBeCloseTo(0.25)
  })

  it('retorna null se a contribuição eleitoral for null', () => {
    expect(calcularQuocienteLocacional(null, 0.1)).toBeNull()
  })

  it('retorna null se a participação geral do território for null ou zero', () => {
    expect(calcularQuocienteLocacional(0.1, null)).toBeNull()
    expect(calcularQuocienteLocacional(0.1, 0)).toBeNull()
  })
})
