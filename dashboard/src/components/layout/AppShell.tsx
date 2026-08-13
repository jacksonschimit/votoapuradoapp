import { Outlet, useParams } from 'react-router-dom'
import { useSession } from '@/hooks/useSession'
import { AppHeader } from './AppHeader'
import { SidebarNavigation } from './SidebarNavigation'
import { MobileBottomNavigation } from './MobileBottomNavigation'
import { AnalysisContextBar } from '@/components/context/AnalysisContextBar'

// Casca da aplicação (doc 06 §9: "AppShell") — sidebar desktop +
// barra inferior mobile em torno do conteúdo de cada rota, mantendo
// a mesma AppHeader (seletor de eleição + sessão) no topo em ambos os
// tamanhos de tela. Nenhuma rota existente muda de comportamento,
// só passa a renderizar dentro desta casca em vez do AppLayout antigo.
//
// O AnalysisContextBar (contexto persistente, doc 04 §3) só aparece
// fora das rotas que já têm um fluxo de eleição próprio via URL
// (:eleicaoId/:uf) — essas continuam usando o seletor da AppHeader,
// evitando dois seletores de eleição divergentes na mesma tela até o
// Épico 2 unificar os dois fluxos.
export function AppShell() {
  const { session } = useSession()
  const params = useParams<{ eleicaoId?: string; uf?: string }>()
  const rotaTemFluxoProprioDeEleicao = !!params.eleicaoId && !!params.uf

  return (
    <div className="flex min-h-svh bg-background text-foreground">
      <SidebarNavigation />

      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader />
        {!rotaTemFluxoProprioDeEleicao && <AnalysisContextBar habilitado={!!session} />}
        <main className="flex-1 pb-16 lg:pb-0">
          <Outlet />
        </main>
      </div>

      <MobileBottomNavigation />
    </div>
  )
}
