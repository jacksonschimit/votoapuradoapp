import { Outlet } from 'react-router-dom'
import { AppHeader } from './AppHeader'

export function AppLayout() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <AppHeader />
      <main>
        <Outlet />
      </main>
    </div>
  )
}
