import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'
import { useSession } from '@/hooks/useSession'
import { useMinhasPermissoes } from '@/hooks/useMinhasPermissoes'
import type { Cargo } from '@/types/domain'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { buttonVariants } from '@/components/ui/button'
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

// Guarda de sessão + permissão + contexto analítico completo (doc 04
// §3): sessão logada, algum escopo liberado, e eleição/cargo/candidato
// escolhidos na AnalysisContextBar. Compartilhado por toda tela que
// depende do contexto global do store (Diagnóstico, Oportunidades,
// futuramente Cenários/Comparativo) — evita duplicar esta cascata de
// estados em cada uma.
export function RequireAnalysisContext({ children }: RequireAnalysisContextProps) {
  const { session, carregando: carregandoSessao } = useSession()
  const { data: permissoes, isLoading: carregandoPermissoes } = useMinhasPermissoes(!!session)
  const { eleicaoId, uf, cargo, candidatoPrincipalId } = useAppStore()

  if (carregandoSessao || (session && carregandoPermissoes)) {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <Skeleton className="h-40" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-md space-y-4 p-8 text-center">
        <Alert>
          <AlertTitle>Você precisa entrar</AlertTitle>
          <AlertDescription>Faça login para acessar o diagnóstico eleitoral.</AlertDescription>
        </Alert>
        <Link to="/login" className={buttonVariants()}>
          Ir para o login
        </Link>
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

  return (
    <>
      {children({ eleicaoId: String(eleicaoId), uf, cargo, sqCandidato: String(candidatoPrincipalId) })}
    </>
  )
}
