import { Link, NavLink } from 'react-router-dom'
import { HelpCircle } from 'lucide-react'
import { ITENS_NAVEGACAO } from '@/lib/navigation'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// Navegação lateral desktop (doc 04 §2, doc 06 §9), incluindo a marca
// no topo. Visível a partir do breakpoint lg — abaixo disso o
// AppShell troca para MobileBottomNavigation.
export function SidebarNavigation() {
  return (
    <aside className="hidden w-56 shrink-0 flex-col justify-between border-r lg:flex">
      <Link to="/dashboard" className="px-4 py-4 text-base font-semibold">
        VotoApurado
      </Link>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {ITENS_NAVEGACAO.map(({ label, to, icone: Icone, badge }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                isActive && 'bg-accent text-accent-foreground hover:bg-accent hover:text-accent-foreground'
              )
            }
          >
            <Icone className="size-4 shrink-0" />
            <span className="flex-1 truncate">{label}</span>
            {badge && (
              <Badge variant="secondary" className="shrink-0">
                {badge}
              </Badge>
            )}
          </NavLink>
        ))}
      </nav>

      <a
        href="mailto:suporte@votoapurado.com.br"
        className="mx-3 mb-3 flex items-center gap-2.5 rounded-lg border-t px-3 pt-3 pb-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <HelpCircle className="size-4 shrink-0" />
        Ajuda e suporte
      </a>
    </aside>
  )
}
