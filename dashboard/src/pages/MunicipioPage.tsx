import { useParams, Link } from 'react-router-dom'
import { useMunicipio } from '@/hooks/useMunicipio'
import { useEleitoradoMunicipio } from '@/hooks/useEleitoradoMunicipio'
import { useZonasPorMunicipio } from '@/hooks/useZonasPorMunicipio'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

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

export function MunicipioPage() {
  const { eleicaoId, uf, codigoIbge } = useParams<{
    eleicaoId: string
    uf: string
    codigoIbge: string
  }>()

  const { data: municipio, isLoading: carregandoMunicipio } = useMunicipio(codigoIbge!)
  const { data: eleitorado, isLoading: carregandoEleitorado } = useEleitoradoMunicipio(
    eleicaoId!,
    codigoIbge!
  )
  const { data: zonas, isLoading: carregandoZonas, isError: erroZonas } = useZonasPorMunicipio(
    codigoIbge!
  )

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-8">
      <div>
        {carregandoMunicipio ? (
          <Skeleton className="h-8 w-64" />
        ) : (
          <h1 className="text-2xl font-semibold">
            {municipio?.nome_municipio ?? 'Município não encontrado'}
          </h1>
        )}
        <p className="text-sm text-muted-foreground">
          Zonas eleitorais do município. (Seção 4.5)
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
          <AlertDescription>Nenhum dado de comparecimento para este município.</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Zonas eleitorais</CardTitle>
        </CardHeader>
        <CardContent>
          {carregandoZonas && <Skeleton className="h-40" />}

          {erroZonas && (
            <Alert variant="destructive">
              <AlertTitle>Erro ao carregar zonas</AlertTitle>
            </Alert>
          )}

          {zonas && zonas.length === 0 && (
            <Alert>
              <AlertTitle>Nenhuma zona encontrada</AlertTitle>
            </Alert>
          )}

          {zonas && zonas.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Zona</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {zonas.map((zona) => (
                  <TableRow key={zona.id}>
                    <TableCell>Zona {zona.numero_zona}</TableCell>
                    <TableCell className="text-right">
                      <Link
                        to={`/dashboard/${eleicaoId}/${uf}/municipio/${codigoIbge}/zona/${zona.id}`}
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
