import { useQuery } from '@tanstack/react-query'
import { getApi } from '@/lib/api'
import type { Eleicao } from '@/types/domain'

// GET /eleicao — metadado público a qualquer usuário autenticado
// (política "leitura_eleicoes" usa "using (true)"), Seção 4.3.
export function useEleicoes(habilitado: boolean) {
  return useQuery({
    queryKey: ['eleicoes'],
    queryFn: async () => {
      const api = await getApi()
      const { data, error } = await api
        .from('eleicao')
        .select('*')
        .order('ano', { ascending: false })
        .order('turno', { ascending: true })

      if (error) throw error
      return data as Eleicao[]
    },
    enabled: habilitado,
  })
}
