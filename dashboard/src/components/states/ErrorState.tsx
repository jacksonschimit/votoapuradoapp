import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ErrorStateProps {
  titulo?: string
  descricao?: string
  aoTentarNovamente?: () => void
  className?: string
}

// Estado de erro recuperável (doc 04 §10) — falha de consulta/API,
// com ação de nova tentativa quando fizer sentido. Distinto de
// EmptyState (consulta funcionou, só não há dado) e de um crash não
// tratado (esse continua responsabilidade de um Error Boundary).
export function ErrorState({
  titulo = 'Não foi possível carregar os dados',
  descricao,
  aoTentarNovamente,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center',
        className
      )}
    >
      <AlertTriangle className="size-8 text-destructive" />
      <p className="text-sm font-medium text-destructive">{titulo}</p>
      {descricao && <p className="max-w-sm text-sm text-muted-foreground">{descricao}</p>}
      {aoTentarNovamente && (
        <Button variant="outline" size="sm" onClick={aoTentarNovamente}>
          Tentar novamente
        </Button>
      )}
    </div>
  )
}
