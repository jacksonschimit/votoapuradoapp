import { create } from 'zustand'
import type { Cargo, Turno } from '@/types/domain'

// Contexto analítico persistente (doc 01 §6 / doc 02 §2): Eleição +
// Turno + Cargo + Candidato(s) + Território devem se manter
// consistentes durante a navegação. Território ainda não entra aqui
// — hoje ele vive nos params de rota das telas existentes (Município/
// Zona/Local/Seção); passa a integrar o store quando o Épico 2
// substituir esse fluxo pela nova home orientada a candidato.
interface AppState {
  eleicaoId: number | null
  uf: string | null
  turno: Turno | null
  cargo: Cargo | null
  candidatoPrincipalId: number | null
  candidatosComparacaoIds: number[]

  setEleicao: (eleicaoId: number | null) => void
  setUf: (uf: string | null) => void
  setTurno: (turno: Turno | null) => void
  setCargo: (cargo: Cargo | null) => void
  setCandidatoPrincipal: (sqCandidato: number | null) => void
  adicionarCandidatoComparacao: (sqCandidato: number) => void
  removerCandidatoComparacao: (sqCandidato: number) => void
  reset: () => void
}

const ESTADO_INICIAL = {
  eleicaoId: null,
  uf: null,
  turno: null,
  cargo: null,
  candidatoPrincipalId: null,
  candidatosComparacaoIds: [],
} satisfies Partial<AppState>

export const useAppStore = create<AppState>((set) => ({
  ...ESTADO_INICIAL,

  setEleicao: (eleicaoId) => set({ eleicaoId }),
  setUf: (uf) => set({ uf }),
  setTurno: (turno) => set({ turno }),
  // Trocar de cargo invalida a seleção de candidato(s) — um candidato
  // de Governador não faz sentido no contexto de Senador (doc 03 §9:
  // "não misturar candidatos de cargos/eleições incompatíveis").
  setCargo: (cargo) => set({ cargo, candidatoPrincipalId: null, candidatosComparacaoIds: [] }),
  setCandidatoPrincipal: (sqCandidato) => set({ candidatoPrincipalId: sqCandidato }),
  adicionarCandidatoComparacao: (sqCandidato) =>
    set((state) =>
      state.candidatosComparacaoIds.includes(sqCandidato)
        ? state
        : { candidatosComparacaoIds: [...state.candidatosComparacaoIds, sqCandidato] }
    ),
  removerCandidatoComparacao: (sqCandidato) =>
    set((state) => ({
      candidatosComparacaoIds: state.candidatosComparacaoIds.filter((id) => id !== sqCandidato),
    })),
  reset: () => set(ESTADO_INICIAL),
}))
