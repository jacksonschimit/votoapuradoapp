import { useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface PlaceholderPageProps {
  title: string
  secaoDoc: string
  descricao: string
}

export function PlaceholderPage({ title, secaoDoc, descricao }: PlaceholderPageProps) {
  const params = useParams()
  const temParams = Object.keys(params).length > 0

  return (
    <div className="mx-auto max-w-2xl p-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>{title}</CardTitle>
            <Badge variant="secondary">{secaoDoc}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>{descricao}</p>
          {temParams && (
            <pre className="rounded-md bg-muted p-3 text-xs">
              {JSON.stringify(params, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
