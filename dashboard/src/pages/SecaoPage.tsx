import { useParams } from 'react-router-dom'
import { NOMES_CARGO, CARGOS } from '@/types/domain'
import { useSecaoEleitoral } from '@/hooks/useSecaoEleitoral'
import { useDominanciaSecao } from '@/hooks/useDominanciaSecao'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { RankingTable } from '@/components/ranking/RankingTable'

export function SecaoPage() {
  const { secaoId } = useParams<{ secaoId: string }>()

  const { data: secao, isLoading: carregandoSecao } = useSecaoEleitoral(secaoId!)
  const { data: linhas, isLoading, isError } = useDominanciaSecao(secaoId!)

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-8">
      <div>
        {carregandoSecao ? (
          <Skeleton className="h-8 w-56" />
        ) : (
          <h1 className="text-2xl font-semibold">
            {secao ? `Seção ${secao.numero_secao}` : 'Seção não encontrada'}
          </h1>
        )}
        <p className="text-sm text-muted-foreground">
          Resultado completo por candidato, em todos os cargos apurados. (Seção 4.6)
        </p>
      </div>

      {isLoading && <Skeleton className="h-64" />}

      {isError && (
        <Alert variant="destructive">
          <AlertTitle>Erro ao carregar resultado da seção</AlertTitle>
        </Alert>
      )}

      {linhas && linhas.length === 0 && (
        <Alert>
          <AlertTitle>Sem dados</AlertTitle>
          <AlertDescription>Nenhum voto apurado para esta seção.</AlertDescription>
        </Alert>
      )}

      {linhas &&
        CARGOS.map((cargo) => {
          const linhasCargo = linhas.filter((l) => l.cargo === cargo)
          if (linhasCargo.length === 0) return null

          return (
            <Card key={cargo}>
              <CardHeader>
                <CardTitle>{NOMES_CARGO[cargo]}</CardTitle>
              </CardHeader>
              <CardContent>
                <RankingTable linhas={linhasCargo} isLoading={false} isError={false} cargo={cargo} />
              </CardContent>
            </Card>
          )
        })}
    </div>
  )
}
