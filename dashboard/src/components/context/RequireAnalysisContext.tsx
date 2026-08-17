import type { ReactNode } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { useSession } from '@/hooks/useSession'
import { useMinhasPermissoes } from '@/hooks/useMinhasPermissoes'
import type { Cargo } from '@/types/domain'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/states/EmptyState'
import { PermissionState } from '@/components/states/PermissionState'

export interface ContextoAnalise {
  eleicaoId: string
  uf: string
  cargo: Cargo
  sqCandidato: string
}

interface RequireAnalysisContextProps {
  children: (contexto: ContextoAnalise) => ReactNode
}

// Guarda de permissão + contexto analítico completo (doc 04 §3): algum
// escopo liberado, e eleição/cargo/candidato escolhidos na
// AnalysisContextBar. A sessão em si já é garantida pelo AppShell
// (redireciona pro /login antes de montar qualquer rota) — este
// componente só cobre o que vem depois disso. Compartilhado por toda
// tela que depende do contexto global do store (Diagnóstico,
// Oportunidades, Cenários, Comparativo).
export function RequireAnalysisContext({ children }: RequireAnalysisContextProps) {
  const { session } = useSession()
  const { data: permissoes, isLoading: carregandoPermissoes } = useMinhasPermissoes(!!session)
  const { eleicaoId, uf, cargo, candidatoPrincipalId } = useAppStore()

  if (carregandoPermissoes) {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <Skeleton className="h-40" />
      </div>
    )
  }

  if (!permissoes || permissoes.length === 0) {
    return (
      <div className="mx-auto max-w-md p-8">
        <PermissionState
          titulo="Acesso pendente de liberação"
          descricao="Seu login foi feito com sucesso, mas ainda não há nenhum escopo de dados liberado para sua conta. Fale com o administrador responsável."
        />
      </div>
    )
  }

  if (!eleicaoId || !uf || !cargo || !candidatoPrincipalId) {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <EmptyState
          titulo="Comece selecionando o contexto da análise"
          descricao="Escolha eleição, cargo e candidato na barra no topo da tela para ver esta análise."
        />
      </div>
    )
  }

  return <>{children({ eleicaoId: String(eleicaoId), uf, cargo, sqCandidato: String(candidatoPrincipalId) })}</>
}
