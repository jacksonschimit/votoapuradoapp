import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface MigalhaTerritorio {
  label: string
  href?: string
}

interface TerritoryBreadcrumbProps {
  migalhas: MigalhaTerritorio[]
  className?: string
}

// Trilha territorial (doc 04 §6): "Paraná > Londrina > Zona 41 > ...".
// Ao trocar de nível, quem monta as migalhas é responsável por manter
// eleição/cargo/candidato do contexto — este componente só exibe.
export function TerritoryBreadcrumb({ migalhas, className }: TerritoryBreadcrumbProps) {
  if (migalhas.length === 0) return null

  return (
    <nav aria-label="Navegação territorial" className={cn('flex flex-wrap items-center gap-1 text-sm', className)}>
      {migalhas.map((migalha, indice) => {
        const ultima = indice === migalhas.length - 1
        return (
          <Fragment key={`${migalha.label}-${indice}`}>
            {indice > 0 && <ChevronRight className="size-3.5 text-muted-foreground" />}
            {migalha.href && !ultima ? (
              <Link to={migalha.href} className="text-muted-foreground hover:text-foreground hover:underline">
                {migalha.label}
              </Link>
            ) : (
              <span className={cn(ultima ? 'font-medium text-foreground' : 'text-muted-foreground')}>
                {migalha.label}
              </span>
            )}
          </Fragment>
        )
      })}
    </nav>
  )
}
