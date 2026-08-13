import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { MoreHorizontal } from 'lucide-react'
import { ITENS_NAVEGACAO_MOBILE_PRINCIPAIS, ITENS_NAVEGACAO_MOBILE_MAIS } from '@/lib/navigation'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

const itemClassName = (ativo: boolean) =>
  cn(
    'flex flex-1 flex-col items-center gap-0.5 py-2 text-[0.7rem] font-medium text-muted-foreground',
    ativo && 'text-primary'
  )

// Navegação inferior mobile (doc 04 §2, doc 05 §9) — 4 destinos fixos
// + "Mais" abrindo um Sheet com o restante dos itens (doc 06 §9:
// Comparativo, Candidatos, Pesquisas, Relatórios, Configurações).
// Visível só abaixo do breakpoint lg — ver SidebarNavigation.
export function MobileBottomNavigation() {
  const [maisAberto, setMaisAberto] = useState(false)
  const location = useLocation()
  const algumItemDoMaisAtivo = ITENS_NAVEGACAO_MOBILE_MAIS.some((item) => item.to === location.pathname)

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t bg-background lg:hidden">
      {ITENS_NAVEGACAO_MOBILE_PRINCIPAIS.map(({ label, labelMobile, to, icone: Icone }) => (
        <NavLink key={to} to={to} end={to === '/dashboard'} className={({ isActive }) => itemClassName(isActive)}>
          <Icone className="size-5" />
          {labelMobile ?? label}
        </NavLink>
      ))}

      <button type="button" onClick={() => setMaisAberto(true)} className={itemClassName(algumItemDoMaisAtivo)}>
        <MoreHorizontal className="size-5" />
        Mais
      </button>

      <Sheet open={maisAberto} onOpenChange={setMaisAberto}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Mais opções</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-1 px-4 pb-4">
            {ITENS_NAVEGACAO_MOBILE_MAIS.map(({ label, to, icone: Icone, badge }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMaisAberto(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground',
                    isActive && 'bg-accent text-accent-foreground'
                  )
                }
              >
                <Icone className="size-4 shrink-0" />
                <span className="flex-1">{label}</span>
                {badge && (
                  <Badge variant="secondary" className="shrink-0">
                    {badge}
                  </Badge>
                )}
              </NavLink>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  )
}
