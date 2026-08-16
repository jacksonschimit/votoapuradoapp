import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getApi } from '@/lib/api'
import type { Cargo, CenarioSalvo, TerritorioCenarioSalvo } from '@/types/domain'

// Cenários salvos (Épico 5, doc 06 §4 "salvar cenário") — cada linha
// pertence a um usuário (RLS por user_id = auth.uid(), ver migration
// cenarios_salvos.sql), listados por candidato porque é sempre nesse
// contexto que o simulador é usado.
export function useCenariosSalvos(sqCandidato: string) {
  return useQuery({
    queryKey: ['cenarios-salvos', sqCandidato],
    queryFn: async () => {
      const api = await getApi()
      const { data, error } = await api
        .from('cenarios_salvos')
        .select('*')
        .eq('sq_candidato', sqCandidato)
        .order('criado_em', { ascending: false })
      if (error) throw error
      return data as CenarioSalvo[]
    },
  })
}

interface NovoCenarioSalvo {
  userId: string
  eleicaoId: string
  uf: string
  cargo: Cargo
  sqCandidato: string
  nome: string
  metaTotal: number
  territorios: TerritorioCenarioSalvo[]
}

export function useSalvarCenario() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (novo: NovoCenarioSalvo) => {
      const api = await getApi()
      const { error } = await api.from('cenarios_salvos').insert({
        user_id: novo.userId,
        eleicao_id: Number(novo.eleicaoId),
        sigla_uf: novo.uf,
        cargo: novo.cargo,
        sq_candidato: Number(novo.sqCandidato),
        nome: novo.nome,
        meta_total: novo.metaTotal,
        territorios: novo.territorios,
      })
      if (error) throw error
    },
    onSuccess: (_dado, variaveis) => {
      queryClient.invalidateQueries({ queryKey: ['cenarios-salvos', variaveis.sqCandidato] })
    },
  })
}

export function useExcluirCenario() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id }: { id: number; sqCandidato: string }) => {
      const api = await getApi()
      const { error } = await api.from('cenarios_salvos').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_dado, variaveis) => {
      queryClient.invalidateQueries({ queryKey: ['cenarios-salvos', variaveis.sqCandidato] })
    },
  })
}
