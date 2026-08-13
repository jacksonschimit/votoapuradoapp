import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useEleitoradoUf } from '@/hooks/useEleitoradoUf'
import { useRankingCandidatos } from '@/hooks/useRankingCandidatos'
import { useMunicipios } from '@/hooks/useMunicipios'
import { CARGOS, NOMES_CARGO, itensDeCargo, type Cargo } from '@/types/domain'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RankingCandidatosTabs } from '@/components/ranking/RankingCandidatosTabs'
import { RankingTable } from '@/components/ranking/RankingTable'
import { MapaMunicipios } from '@/components/MapaMunicipios'

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

function RankingEstadoTab({
  eleicaoId,
  uf,
  cargo,
  comparecimento,
}: {
  eleicaoId: string
  uf: string
  cargo: Cargo
  comparecimento?: number
}) {
  const { data, isLoading, isError } = useRankingCandidatos(eleicaoId, uf, cargo)

  const linhas = data?.map((linha) => ({
    ...linha,
    percentual: comparecimento ? linha.votos / comparecimento : null,
  }))

  return (
    <RankingTable
      linhas={linhas}
      isLoading={isLoading}
      isError={isError}
      cargo={cargo}
      linkCandidato={(sq) => `/dashboard/${eleicaoId}/${uf}/candidato/${sq}`}
      colunaPercentual="% do comparecimento"
    />
  )
}

function MapaCard({ eleicaoId, uf }: { eleicaoId: string; uf: string }) {
  const [cargo, setCargo] = useState<Cargo>(CARGOS[0])

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Mapa por município</CardTitle>
            <CardDescription>
              Cor indica o candidato líder e sua dominância. Clique num município para abrir o
              detalhamento. (Seção 4.4)
            </CardDescription>
          </div>
          <Select value={cargo} onValueChange={(v) => v && setCargo(v as Cargo)} items={itensDeCargo(CARGOS)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CARGOS.map((c) => (
                <SelectItem key={c} value={c}>
                  {NOMES_CARGO[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <MapaMunicipios eleicaoId={eleicaoId} uf={uf} cargo={cargo} />
      </CardContent>
    </Card>
  )
}

function ListaMunicipios({ eleicaoId, uf }: { eleicaoId: string; uf: string }) {
  const { data: municipios, isLoading, isError } = useMunicipios(uf)
  const [busca, setBusca] = useState('')

  const filtrados = municipios?.filter((m) =>
    m.nome_municipio.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Municípios</CardTitle>
        <CardDescription>Busca rápida por nome, como alternativa ao mapa.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          placeholder="Buscar município..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />

        {isLoading && <Skeleton className="h-40" />}

        {isError && (
          <Alert variant="destructive">
            <AlertTitle>Erro ao carregar municípios</AlertTitle>
          </Alert>
        )}

        {filtrados && (
          <div className="max-h-64 overflow-y-auto rounded-md border">
            <Table>
              <TableBody>
                {filtrados.map((m) => (
                  <TableRow key={m.codigo_ibge}>
                    <TableCell>
                      <Link
                        to={`/dashboard/${eleicaoId}/${uf}/municipio/${m.codigo_ibge}`}
                        className="hover:underline"
                      >
                        {m.nome_municipio}
                      </Link>
                      {m.capital && (
                        <span className="ml-2 text-xs text-muted-foreground">(capital)</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filtrados.length === 0 && (
                  <TableRow>
                    <TableCell className="text-muted-foreground">Nenhum município encontrado.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function VisaoEstadoPage() {
  const { eleicaoId, uf } = useParams<{ eleicaoId: string; uf: string }>()

  const { data: eleitorado, isLoading: carregandoEleitorado } = useEleitoradoUf(eleicaoId!, uf!)

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">Visão Geral — {uf}</h1>
        <p className="text-sm text-muted-foreground">
          KPIs e ranking de candidatos por cargo. (Seção 4.4)
        </p>
      </div>

      {carregandoEleitorado ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : eleitorado ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
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
          <KpiCard
            titulo="Municípios apurados"
            valor={FORMATO_NUMERO.format(eleitorado.qtde_municipios_apurados)}
          />
        </div>
      ) : (
        <Alert>
          <AlertTitle>Sem dados de eleitorado</AlertTitle>
          <AlertDescription>Nenhum dado de comparecimento importado para esta UF/eleição.</AlertDescription>
        </Alert>
      )}

      <MapaCard eleicaoId={eleicaoId!} uf={uf!} />

      <ListaMunicipios eleicaoId={eleicaoId!} uf={uf!} />

      <Card>
        <CardHeader>
          <CardTitle>Ranking de candidatos</CardTitle>
        </CardHeader>
        <CardContent>
          <RankingCandidatosTabs>
            {(cargo) => (
              <RankingEstadoTab
                eleicaoId={eleicaoId!}
                uf={uf!}
                cargo={cargo}
                comparecimento={eleitorado?.qtde_comparecimento}
              />
            )}
          </RankingCandidatosTabs>
        </CardContent>
      </Card>
    </div>
  )
}
