import { describe, expect, it } from 'vitest'
import { calcularConcentracaoTopN } from './concentracao'

function municipio(codigo: number, votos: number) {
  return { codigo_municipio: codigo, nome_municipio: `Município ${codigo}`, total_votos: votos }
}

describe('calcularConcentracaoTopN', () => {
  it('soma o total de votos de todos os municípios recebidos', () => {
    const resultado = calcularConcentracaoTopN([municipio(1, 100), municipio(2, 50), municipio(3, 25)])
    expect(resultado.totalVotos).toBe(175)
  })

  it('considera só os N primeiros (já ordenados) para o percentual', () => {
    const resultado = calcularConcentracaoTopN(
      [municipio(1, 100), municipio(2, 50), municipio(3, 25), municipio(4, 25)],
      2
    )
    expect(resultado.topN).toHaveLength(2)
    expect(resultado.votosTopN).toBe(150)
    expect(resultado.percentualTopN).toBeCloseTo((150 / 200) * 100)
  })

  it('não recalcula a ordenação — confia que resultados já vem ordenado por total_votos desc', () => {
    // Entrada fora de ordem: a função não deve tentar reordenar,
    // só fatiar os N primeiros como recebidos.
    const resultado = calcularConcentracaoTopN([municipio(1, 10), municipio(2, 100)], 1)
    expect(resultado.topN).toEqual([municipio(1, 10)])
  })

  it('usa N=5 por padrão', () => {
    const seis = Array.from({ length: 6 }, (_, i) => municipio(i, 10))
    const resultado = calcularConcentracaoTopN(seis)
    expect(resultado.topN).toHaveLength(5)
  })

  it('retorna percentual null quando o total de votos é zero (sem divisão por zero)', () => {
    const resultado = calcularConcentracaoTopN([])
    expect(resultado.totalVotos).toBe(0)
    expect(resultado.votosTopN).toBe(0)
    expect(resultado.percentualTopN).toBeNull()
  })

  it('lida com menos municípios do que N sem estourar', () => {
    const resultado = calcularConcentracaoTopN([municipio(1, 40), municipio(2, 60)], 5)
    expect(resultado.topN).toHaveLength(2)
    expect(resultado.percentualTopN).toBeCloseTo(100)
  })
})
