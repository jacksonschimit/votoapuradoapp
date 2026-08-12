import { useParams, Link } from 'react-router-dom'
import type { Cargo } from '@/types/domain'
import { useLocalVotacao } from '@/hooks/useLocalVotacao'
import { useEleitoradoLocal } from '@/hooks/useEleitoradoLocal'
import { useDominanciaLocal } from '@/hooks/useDominanciaLocal'
import { useSecoesPorLocal } from '@/hooks/useSecoesPorLocal'
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

export function LocalVotacaoPage() {
  const { eleicaoId, uf, codigoIbge, zonaId, localVotacaoId } = useParams<{
    eleicaoId: string
    uf: string
    codigoIbge: string
    zonaId: string
    localVotacaoId: string
  }>()

  const { data: local, isLoading: carregandoLocal } = useLocalVotacao(localVotacaoId!)
  const { data: eleitorado, isLoading: carregandoEleitorado } = useEleitoradoLocal(
    eleicaoId!,
    localVotacaoId!
  )
  const {
    data: secoes,
    isLoading: carregandoSecoes,
    isError: erroSecoes,
  } = useSecoesPorLocal(localVotacaoId!)

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-8">
      <div>
        {carregandoLocal ? (
          <Skeleton className="h-8 w-64" />
        ) : (
          <h1 className="text-2xl font-semibold">
            {local?.nome_local ?? 'Local de votação não encontrado'}
          </h1>
        )}
        {local?.endereco && <p className="text-sm text-muted-foreground">{local.endereco}</p>}
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
          <AlertDescription>Nenhum dado de comparecimento para este local.</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Dominância por cargo</CardTitle>
        </CardHeader>
        <CardContent>
          <RankingCandidatosTabs>
            {(cargo) => <RankingLocalTab localVotacaoId={localVotacaoId!} cargo={cargo} />}
          </RankingCandidatosTabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Seções eleitorais</CardTitle>
        </CardHeader>
        <CardContent>
          {carregandoSecoes && <Skeleton className="h-40" />}

          {erroSecoes && (
            <Alert variant="destructive">
              <AlertTitle>Erro ao carregar seções</AlertTitle>
            </Alert>
          )}

          {secoes && secoes.length === 0 && (
            <Alert>
              <AlertTitle>Nenhuma seção encontrada</AlertTitle>
            </Alert>
          )}

          {secoes && secoes.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Seção</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {secoes.map((secao) => (
                  <TableRow key={secao.id}>
                    <TableCell>Seção {secao.numero_secao}</TableCell>
                    <TableCell className="text-right">
                      <Link
                        to={`/dashboard/${eleicaoId}/${uf}/municipio/${codigoIbge}/zona/${zonaId}/secao/${secao.id}`}
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

function RankingLocalTab({ localVotacaoId, cargo }: { localVotacaoId: string; cargo: Cargo }) {
  const { data, isLoading, isError } = useDominanciaLocal(localVotacaoId, cargo)
  return <RankingTable linhas={data} isLoading={isLoading} isError={isError} cargo={cargo} />
}
