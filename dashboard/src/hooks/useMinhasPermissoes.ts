import { useQuery } from '@tanstack/react-query'
import { getApi } from '@/lib/api'
import type { UsuarioPermissao } from '@/types/domain'

// GET /usuarios_permissoes — RLS ("usuario_le_apenas_suas_permissoes")
// já garante que só voltam as linhas do próprio usuário autenticado.
export function useMinhasPermissoes(habilitado: boolean) {
  return useQuery({
    queryKey: ['minhas-permissoes'],
    queryFn: async () => {
      const api = await getApi()
      const { data, error } = await api.from('usuarios_permissoes').select('*')

      if (error) throw error
      return data as UsuarioPermissao[]
    },
    enabled: habilitado,
  })
}
