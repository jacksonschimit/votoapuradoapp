import { describe, expect, it } from 'vitest'
import { classificarOportunidade } from './oportunidade'
import { LIMIARES_CLASSIFICACAO_PROVISORIOS, type ClassificacaoTerritorio } from './classificacao'

const ESCALA_RELEVANTE = LIMIARES_CLASSIFICACAO_PROVISORIOS.escalaMinimaRelevante + 1
const ESCALA_IRRISORIA = LIMIARES_CLASSIFICACAO_PROVISORIOS.escalaMinimaRelevante - 1

function classificacao(parcial: Partial<ClassificacaoTerritorio>): ClassificacaoTerritorio {
  return { forca: false, sustentacao: false, baixaPresenca: false, ...parcial }
}

describe('classificarOportunidade', () => {
  it('Consolidação quando força e sustentação juntas', () => {
    const papel = classificarOportunidade(classificacao({ forca: true, sustentacao: true }), ESCALA_RELEVANTE, 0)
    expect(papel).toBe('consolidacao')
  })

  it('Desenvolvimento quando baixa presença mas escala relevante', () => {
    const papel = classificarOportunidade(classificacao({ baixaPresenca: true }), ESCALA_RELEVANTE, 0)
    expect(papel).toBe('desenvolvimento')
  })

  it('Baixa prioridade histórica quando baixa presença E escala irrisória', () => {
    const papel = classificarOportunidade(classificacao({ baixaPresenca: true }), ESCALA_IRRISORIA, 0)
    expect(papel).toBe('baixa_prioridade')
  })

  it('Expansão quando nem força nem baixa presença, mas há escala e ganho positivo no cenário', () => {
    const papel = classificarOportunidade(classificacao({}), ESCALA_RELEVANTE, 500)
    expect(papel).toBe('expansao')
  })

  it('não classifica (null) quando não há escala nem sinal claro de nenhum papel', () => {
    const papel = classificarOportunidade(classificacao({}), ESCALA_IRRISORIA, 500)
    expect(papel).toBeNull()
  })

  it('não classifica Expansão se o ganho no cenário for zero ou negativo (sem espaço real)', () => {
    const papel = classificarOportunidade(classificacao({}), ESCALA_RELEVANTE, 0)
    expect(papel).toBeNull()
  })

  it('Consolidação tem prioridade sobre os demais sinais', () => {
    const papel = classificarOportunidade(
      classificacao({ forca: true, sustentacao: true, baixaPresenca: true }),
      ESCALA_RELEVANTE,
      500
    )
    expect(papel).toBe('consolidacao')
  })
})
