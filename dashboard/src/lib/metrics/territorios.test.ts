import { describe, expect, it } from 'vitest'
import { contarTerritoriosDominados } from './territorios'

describe('contarTerritoriosDominados', () => {
  it('conta apenas os territórios com dominância >= limiar', () => {
    const dominancias = [{ percentual_dominancia: 60 }, { percentual_dominancia: 49.9 }, { percentual_dominancia: 50 }]
    expect(contarTerritoriosDominados(dominancias)).toBe(2)
  })

  it('usa limiar 50 por padrão', () => {
    expect(contarTerritoriosDominados([{ percentual_dominancia: 50 }])).toBe(1)
    expect(contarTerritoriosDominados([{ percentual_dominancia: 49.99 }])).toBe(0)
  })

  it('aceita um limiar customizado', () => {
    const dominancias = [{ percentual_dominancia: 30 }, { percentual_dominancia: 10 }]
    expect(contarTerritoriosDominados(dominancias, 25)).toBe(1)
  })

  it('retorna 0 para lista vazia', () => {
    expect(contarTerritoriosDominados([])).toBe(0)
  })
})
