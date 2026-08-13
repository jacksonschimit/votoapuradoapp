import { Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PermissionStateProps {
  titulo?: string
  descricao?: string
  className?: string
}

// Estado "sem permissão" (doc 04 §10) — usuário autenticado, mas sem
// escopo liberado em usuarios_permissoes para o recorte pedido (UF,
// eleição ou o próprio acesso à plataforma, Seção 5.3 do PRD).
export function PermissionState({
  titulo = 'Sem acesso a este conteúdo',
  descricao = 'Fale com o administrador responsável para liberar o escopo necessário.',
  className,
}: PermissionStateProps) {
  return (
    <div className={cn('flex flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center', className)}>
      <Lock className="size-8 text-muted-foreground" />
      <p className="text-sm font-medium">{titulo}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{descricao}</p>
    </div>
  )
}
