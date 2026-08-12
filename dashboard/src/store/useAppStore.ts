import { create } from 'zustand'

interface AppState {
  eleicaoId: number | null
  uf: string | null
  setEleicao: (eleicaoId: number | null) => void
  setUf: (uf: string | null) => void
  reset: () => void
}

export const useAppStore = create<AppState>((set) => ({
  eleicaoId: null,
  uf: null,
  setEleicao: (eleicaoId) => set({ eleicaoId }),
  setUf: (uf) => set({ uf }),
  reset: () => set({ eleicaoId: null, uf: null }),
}))
