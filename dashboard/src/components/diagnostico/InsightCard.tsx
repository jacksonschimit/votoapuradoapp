import type { ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface InsightCardProps {
  titulo: string
  valor: ReactNode
  descricao?: string
  acao?: ReactNode
  className?: string
}

// Card de apoio do Diagnóstico (doc 05 §6) — indicador secundário com
// espaço pra uma explicação curta e uma ação de aprofundamento (ex.:
// "Entender concentração"). `valor` aceita ReactNode para permitir
// combinações como número + badge de classificação, quando existir.
export function InsightCard({ titulo, valor, descricao, acao, className }: InsightCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardDescription>{titulo}</CardDescription>
        <CardTitle className="text-2xl">{valor}</CardTitle>
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
