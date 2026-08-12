import { Link } from 'react-router-dom'
import type { LinhaRanking, Cargo } from '@/types/domain'
import { NOMES_CARGO } from '@/types/domain'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const FORMATO_NUMERO = new Intl.NumberFormat('pt-BR')
const FORMATO_PERCENTUAL = new Intl.NumberFormat('pt-BR', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

interface RankingTableProps {
  linhas?: LinhaRanking[]
  isLoading: boolean
  isError: boolean
  cargo: Cargo
  linkCandidato?: (sqCandidato: number) => string
  colunaPercentual?: string
}

// Tabela de ranking de candidatos, presentacional — não faz fetch,
// recebe os dados já normalizados em LinhaRanking. Reaproveitada
// nas telas de Estado, Zona, Local de Votação e Seção.
export function RankingTable({
  linhas,
  isLoading,
  isError,
  cargo,
  linkCandidato,
  colunaPercentual = '% de dominância',
}: RankingTableProps) {
  if (isLoading) return <Skeleton className="h-64" />

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Erro ao carregar ranking</AlertTitle>
        <AlertDescription>Não foi possível consultar a API.</AlertDescription>
      </Alert>
    )
  }

  if (!linhas || linhas.length === 0) {
    return (
      <Alert>
        <AlertTitle>Sem dados</AlertTitle>
        <AlertDescription>Nenhum resultado apurado para {NOMES_CARGO[cargo]} neste recorte.</AlertDescription>
      </Alert>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">#</TableHead>
          <TableHead>Candidato</TableHead>
          <TableHead>Partido</TableHead>
          <TableHead className="text-right">Votos</TableHead>
          <TableHead className="text-right">{colunaPercentual}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {linhas.map((linha, i) => (
          <TableRow key={linha.sqCandidato}>
            <TableCell className="text-muted-foreground">{i + 1}</TableCell>
            <TableCell>
              {linkCandidato ? (
                <Link to={linkCandidato(linha.sqCandidato)} className="hover:underline">
                  {linha.nome}
                </Link>
              ) : (
                linha.nome
              )}
            </TableCell>
            <TableCell className="text-muted-foreground">{linha.partido}</TableCell>
            <TableCell className="text-right tabular-nums">{FORMATO_NUMERO.format(linha.votos)}</TableCell>
            <TableCell className="text-right tabular-nums text-muted-foreground">
              {linha.percentual !== null ? FORMATO_PERCENTUAL.format(linha.percentual) : '—'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
