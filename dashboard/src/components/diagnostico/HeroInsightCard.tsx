import type { ReactNode } from 'react'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface HeroInsightCardProps {
  titulo: string
  valor: string
  descricao?: string
  tendencia?: { valor: string; positiva: boolean }
  acao?: ReactNode
  className?: string
}

// Card de destaque do Diagnóstico (doc 05 §6, doc 06 §1: "Resultado
// histórico") — o número mais importante da tela, em posição de
// hero. Só um por bloco: "one visualization, one question" (doc 04 §1).
export function HeroInsightCard({ titulo, valor, descricao, tendencia, acao, className }: HeroInsightCardProps) {
  const IconeTendencia = tendencia?.positiva ? TrendingUp : TrendingDown

  return (
    <Card className={className}>
      <CardHeader>
        <CardDescription>{titulo}</CardDescription>
        <CardTitle className="text-3xl">{valor}</CardTitle>
        {tendencia && (
          <div
            className={cn(
              'flex items-center gap-1 text-sm font-medium',
              tendencia.positiva ? 'text-semantic-consolidation' : 'text-destructive'
            )}
          >
            <IconeTendencia className="size-4" />
            {tendencia.valor}
          </div>
        )}
      </CardHeader>
      {(descricao || acao) && (
        <CardContent className="space-y-3">
          {descricao && <p className="text-sm text-muted-foreground">{descricao}</p>}
          {acao}
        </CardContent>
      )}
    </Card>
  )
}
