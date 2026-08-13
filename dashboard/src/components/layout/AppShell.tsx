import { Outlet } from 'react-router-dom'
import { AppHeader } from './AppHeader'
import { SidebarNavigation } from './SidebarNavigation'
import { MobileBottomNavigation } from './MobileBottomNavigation'

// Casca da aplicação (doc 06 §9: "AppShell") — sidebar desktop +
// barra inferior mobile em torno do conteúdo de cada rota, mantendo
// a mesma AppHeader (seletor de eleição + sessão) no topo em ambos os
// tamanhos de tela. Nenhuma rota existente muda de comportamento,
// só passa a renderizar dentro desta casca em vez do AppLayout antigo.
export function AppShell() {
  return (
    <div className="flex min-h-svh bg-background text-foreground">
      <SidebarNavigation />

      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader />
        <main className="flex-1 pb-16 lg:pb-0">
          <Outlet />
        </main>
      </div>

      <MobileBottomNavigation />
    </div>
  )
}
