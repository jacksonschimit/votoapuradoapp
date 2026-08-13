import type { ComponentType, ReactNode } from 'react'
import { Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  titulo: string
  descricao?: string
  icone?: ComponentType<{ className?: string }>
  acao?: ReactNode
  className?: string
}

// Estado "sem dados" (doc 04 §10) — distinto de ErrorState. Usado
// quando a consulta funcionou mas não há nenhum resultado a mostrar
// (ex.: filtro sem correspondência, seção sem votos apurados).
export function EmptyState({ titulo, descricao, icone: Icone = Inbox, acao, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center', className)}>
      <Icone className="size-8 text-muted-foreground" />
      <p className="text-sm font-medium">{titulo}</p>
      {descricao && <p className="max-w-sm text-sm text-muted-foreground">{descricao}</p>}
      {acao}
    </div>
  )
}
