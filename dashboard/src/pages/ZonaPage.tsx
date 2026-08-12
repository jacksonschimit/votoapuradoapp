import { useParams, Link } from 'react-router-dom'
import type { Cargo } from '@/types/domain'
import { useZona } from '@/hooks/useZona'
import { useEleitoradoZona } from '@/hooks/useEleitoradoZona'
import { useDominanciaZona } from '@/hooks/useDominanciaZona'
import { useLocaisPorZona } from '@/hooks/useLocaisPorZona'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { RankingCandidatosTabs } from '@/components/ranking/RankingCandidatosTabs'
import { RankingTable } from '@/components/ranking/RankingTable'

const FORMATO_NUMERO = new Intl.NumberFormat('pt-BR')
const FORMATO_PERCENTUAL = new Intl.NumberFormat('pt-BR', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

function KpiCard({ titulo, valor, descricao }: { titulo: string; valor: string; descricao?: string }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{titulo}</CardDescription>
        <CardTitle className="text-2xl">{valor}</CardTitle>
      </CardHeader>
      {descricao && (
        <CardContent className="text-xs text-muted-foreground">{descricao}</CardContent>
      )}
    </Card>
  )
}

export function ZonaPage() {
  const { eleicaoId, uf, codigoIbge, zonaId } = useParams<{
    eleicaoId: string
    uf: string
    codigoIbge: string
    zonaId: string
  }>()

  const { data: zona, isLoading: carregandoZona } = useZona(zonaId!)
  const { data: eleitorado, isLoading: carregandoEleitorado } = useEleitoradoZona(eleicaoId!, zonaId!)
  const { data: locais, isLoading: carregandoLocais, isError: erroLocais } = useLocaisPorZona(zonaId!)

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-8">
      <div>
        {carregandoZona ? (
          <Skeleton className="h-8 w-48" />
        ) : (
          <h1 className="text-2xl font-semibold">
            {zona ? `Zona ${zona.numero_zona}` : 'Zona não encontrada'}
          </h1>
        )}
        <p className="text-sm text-muted-foreground">
          Currais eleitorais e locais de votação da zona. (Seção 4.6)
        </p>
      </div>

      {carregandoEleitorado ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : eleitorado ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <KpiCard titulo="Eleitores aptos" valor={FORMATO_NUMERO.format(eleitorado.qtde_aptos)} />
          <KpiCard
            titulo="Comparecimento"
            valor={FORMATO_PERCENTUAL.format(eleitorado.qtde_comparecimento / eleitorado.qtde_aptos)}
            descricao={`${FORMATO_NUMERO.format(eleitorado.qtde_comparecimento)} eleitores`}
          />
          <KpiCard
            titulo="Abstenção"
            valor={FORMATO_PERCENTUAL.format(eleitorado.qtde_abstencoes / eleitorado.qtde_aptos)}
            descricao={`${FORMATO_NUMERO.format(eleitorado.qtde_abstencoes)} eleitores`}
          />
        </div>
      ) : (
        <Alert>
          <AlertTitle>Sem dados de eleitorado</AlertTitle>
          <AlertDescription>Nenhum dado de comparecimento para esta zona.</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Dominância por cargo</CardTitle>
        </CardHeader>
        <CardContent>
          <RankingCandidatosTabs>
            {(cargo) => <RankingZonaTab zonaId={zonaId!} cargo={cargo} />}
          </RankingCandidatosTabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Locais de votação</CardTitle>
        </CardHeader>
        <CardContent>
          {carregandoLocais && <Skeleton className="h-40" />}

          {erroLocais && (
            <Alert variant="destructive">
              <AlertTitle>Erro ao carregar locais de votação</AlertTitle>
            </Alert>
          )}

          {locais && locais.length === 0 && (
            <Alert>
              <AlertTitle>Nenhum local de votação encontrado</AlertTitle>
            </Alert>
          )}

          {locais && locais.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Endereço</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {locais.map((local) => (
                  <TableRow key={local.id}>
                    <TableCell>{local.nome_local}</TableCell>
                    <TableCell className="text-muted-foreground">{local.endereco ?? '—'}</TableCell>
                    <TableCell className="text-right">
                      <Link
                        to={`/dashboard/${eleicaoId}/${uf}/municipio/${codigoIbge}/zona/${zonaId}/local/${local.id}`}
                        className="text-sm hover:underline"
                      >
                        Ver detalhes →
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function RankingZonaTab({ zonaId, cargo }: { zonaId: string; cargo: Cargo }) {
  const { data, isLoading, isError } = useDominanciaZona(zonaId, cargo)
  return <RankingTable linhas={data} isLoading={isLoading} isError={isError} cargo={cargo} />
}
