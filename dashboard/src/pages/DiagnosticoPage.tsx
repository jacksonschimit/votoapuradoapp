import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useAnaliseTerritorialCandidato } from '@/hooks/useAnaliseTerritorialCandidato'
import { calcularConcentracaoTopN } from '@/lib/metrics/concentracao'
import { calcularGanhoCenario } from '@/lib/metrics/cenario'
import { classificarOportunidade, INCREMENTO_CENARIO_OPORTUNIDADE } from '@/lib/metrics/oportunidade'
import { NOMES_CARGO, type Cargo } from '@/types/domain'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { buttonVariants } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState } from '@/components/states/EmptyState'
import { ErrorState } from '@/components/states/ErrorState'
import { TerritoryBreadcrumb } from '@/components/context/TerritoryBreadcrumb'
import { RequireAnalysisContext } from '@/components/context/RequireAnalysisContext'
import { HeroInsightCard } from '@/components/diagnostico/HeroInsightCard'
import { InsightCard } from '@/components/diagnostico/InsightCard'
import { MapaCandidatoMunicipios } from '@/components/diagnostico/MapaCandidatoMunicipios'
import { corToken } from '@/lib/theme'

const TOP_MUNICIPIOS_GRAFICO = 8

const FORMATO_NUMERO = new Intl.NumberFormat('pt-BR')
const FORMATO_PERCENTUAL = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })
const FORMATO_QL = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// Home de Diagnóstico (Épico 2, docs/11) — substitui o antigo
// SeletorEleicaoPage como conteúdo de /dashboard. O contexto (eleição,
// turno, cargo, candidato, território) vem inteiramente do
// AnalysisContextBar/useAppStore, montado globalmente pelo AppShell.
export function DiagnosticoPage() {
  return (
    <RequireAnalysisContext>
      {({ eleicaoId, uf, cargo, sqCandidato }) => (
        <DiagnosticoConteudo eleicaoId={eleicaoId} uf={uf} cargo={cargo} sqCandidato={sqCandidato} />
      )}
    </RequireAnalysisContext>
  )
}

function DiagnosticoConteudo({
  eleicaoId,
  uf,
  cargo,
  sqCandidato,
}: {
  eleicaoId: string
  uf: string
  cargo: Cargo
  sqCandidato: string
}) {
  const { candidato, territorios, totalVotosCandidato, isLoading, isError } = useAnaliseTerritorialCandidato(
    eleicaoId,
    uf,
    cargo,
    sqCandidato
  )

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 p-8">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (isError || !candidato) {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <ErrorState descricao="Não foi possível carregar o diagnóstico deste candidato." />
      </div>
    )
  }

  const concentracao = calcularConcentracaoTopN(
    territorios.map((t) => ({ codigo_municipio: t.codigo_municipio, nome_municipio: t.nome_municipio, total_votos: t.votos }))
  )

  const territoriosDeForca = territorios.filter((t) => t.forca).length
  const territoriosDeSustentacao = territorios.filter((t) => t.sustentacao).length
  const territoriosDeBaixaPresenca = territorios.filter((t) => t.baixaPresenca).length

  const topMunicipiosGrafico = territorios
    .slice()
    .sort((a, b) => b.votos - a.votos)
    .slice(0, TOP_MUNICIPIOS_GRAFICO)

  const dadosCamadas = [
    { camada: 'Força', quantidade: territoriosDeForca, cor: corToken('--semantic-force') },
    { camada: 'Sustentação', quantidade: territoriosDeSustentacao, cor: corToken('--semantic-support') },
    { camada: 'Baixa presença', quantidade: territoriosDeBaixaPresenca, cor: corToken('--semantic-low-presence') },
  ]

  const oportunidades = territorios
    .map((t) => {
      const participacaoSimulada = t.pt !== null ? t.pt + INCREMENTO_CENARIO_OPORTUNIDADE : null
      const ganho =
        participacaoSimulada !== null
          ? calcularGanhoCenario(t.votosValidosTerritorio, participacaoSimulada, t.votos).ganhoCenario
          : null
      const papel = classificarOportunidade(t, t.votosValidosTerritorio, ganho)
      return { ...t, ganho, papel }
    })
    .filter((t) => t.papel === 'expansao')
    .sort((a, b) => (b.ganho ?? 0) - (a.ganho ?? 0))

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-8">
      <div className="space-y-1">
        <TerritoryBreadcrumb migalhas={[{ label: uf }]} />
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold">Diagnóstico Eleitoral</h1>
          <Badge variant="secondary">{NOMES_CARGO[cargo]}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {candidato.nm_urna_candidato} · {candidato.sigla_partido}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <HeroInsightCard titulo="Resultado histórico" valor={`${FORMATO_NUMERO.format(totalVotosCandidato)} votos`} />
        <InsightCard
          titulo="Concentração territorial"
          valor={
            concentracao.percentualTopN !== null
              ? `${FORMATO_PERCENTUAL.format(concentracao.percentualTopN)}%`
              : '—'
          }
          descricao={`Dos votos estão nos ${concentracao.topN.length} principais municípios.`}
        />
        <InsightCard
          titulo="Territórios"
          valor={`${territoriosDeForca} de força`}
          descricao={`${territoriosDeSustentacao} de sustentação. Força = candidato sobrerrepresentado ali (QL); sustentação = território pesa muito no total do candidato (CE).`}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Onde seus votos estão</CardTitle>
        </CardHeader>
        <CardContent>
          <MapaCandidatoMunicipios eleicaoId={eleicaoId} uf={uf} sqCandidato={sqCandidato} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top {topMunicipiosGrafico.length} municípios</CardTitle>
          </CardHeader>
          <CardContent>
            {topMunicipiosGrafico.length === 0 ? (
              <EmptyState titulo="Sem votos apurados" descricao="Nenhum voto encontrado para este candidato." />
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(220, topMunicipiosGrafico.length * 32)}>
                <BarChart data={topMunicipiosGrafico} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={(v) => FORMATO_NUMERO.format(v)} />
                  <YAxis type="category" dataKey="nome_municipio" width={110} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => FORMATO_NUMERO.format(Number(v))} />
                  <Bar dataKey="votos" fill={corToken('--primary-600')} radius={4} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Camadas territoriais</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dadosCamadas} margin={{ top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="camada" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip formatter={(v) => `${v} territórios`} />
                <Bar dataKey="quantidade" radius={4}>
                  {dadosCamadas.map((d) => (
                    <Cell key={d.camada} fill={d.cor} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="mt-2 text-xs text-muted-foreground">
              Camadas não são exclusivas — um território pode contar em mais de uma.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Principais bases</CardTitle>
        </CardHeader>
        <CardContent>
          {concentracao.topN.length === 0 ? (
            <EmptyState titulo="Sem votos apurados" descricao="Nenhum voto encontrado para este candidato." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Município</TableHead>
                  <TableHead className="text-right">Votos</TableHead>
                  <TableHead className="text-right">Participação territorial (PT)</TableHead>
                  <TableHead className="text-right">Contribuição eleitoral (CE)</TableHead>
                  <TableHead className="text-right">Força relativa (QL)</TableHead>
                  <TableHead>Classificação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {territorios
                  .slice()
                  .sort((a, b) => b.votos - a.votos)
                  .slice(0, concentracao.topN.length)
                  .map((t) => (
                    <TableRow key={t.codigo_municipio}>
                      <TableCell>
                        <Link
                          to={`/dashboard/${eleicaoId}/${uf}/municipio/${t.codigo_municipio}`}
                          className="hover:underline"
                        >
                          {t.nome_municipio}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{FORMATO_NUMERO.format(t.votos)}</TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {t.pt !== null ? `${FORMATO_PERCENTUAL.format(t.pt * 100)}%` : '—'}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {t.ce !== null ? `${FORMATO_PERCENTUAL.format(t.ce * 100)}%` : '—'}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {t.ql !== null ? `${FORMATO_QL.format(t.ql)}x` : '—'}
                      </TableCell>
                      <TableCell className="flex flex-wrap gap-1">
                        {t.forca && (
                          <Badge variant="secondary" className="bg-semantic-force text-semantic-force-foreground">
                            Força
                          </Badge>
                        )}
                        {t.sustentacao && (
                          <Badge
                            variant="secondary"
                            className="bg-semantic-support text-semantic-support-foreground"
                          >
                            Sustentação
                          </Badge>
                        )}
                        {t.baixaPresenca && (
                          <Badge
                            variant="secondary"
                            className="bg-semantic-low-presence text-semantic-low-presence-foreground"
                          >
                            Baixa presença
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>Oportunidades de crescimento</CardTitle>
            <Link to="/dashboard/oportunidades" className="text-sm text-primary hover:underline">
              Ver todas ({oportunidades.length})
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {oportunidades.length === 0 ? (
            <EmptyState
              titulo="Nenhuma oportunidade de expansão identificada"
              descricao="Com os dados e limiares atuais, nenhum território se qualifica como oportunidade de expansão."
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {oportunidades.slice(0, 4).map((t) => (
                <div key={t.codigo_municipio} className="space-y-1 rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">{t.nome_municipio}</span>
                    <Badge
                      variant="secondary"
                      className="bg-semantic-opportunity text-semantic-opportunity-foreground"
                    >
                      Expansão
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    PT atual: {t.pt !== null ? FORMATO_PERCENTUAL.format(t.pt * 100) : '—'}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Cenário +{INCREMENTO_CENARIO_OPORTUNIDADE * 100}p.p.:{' '}
                    <span className="font-medium text-foreground">
                      +{FORMATO_NUMERO.format(Math.round(t.ganho ?? 0))} votos
                    </span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Simule seu crescimento</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Explore cenários de crescimento e veja a distribuição sugerida entre territórios.
          </p>
          <Link to="/dashboard/cenarios" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            Construir cenário
          </Link>
        </CardContent>
      </Card>

      <div className="space-y-1 text-xs text-muted-foreground">
        <p>Dados oficiais do TSE, apurados por seção eleitoral.</p>
        <p>
          <strong>PT (Participação Territorial):</strong> percentual dos votos válidos do cargo naquele
          município que foram para este candidato. <strong>QL (força relativa):</strong> compara a presença
          do candidato no município com a distribuição geral do cargo na UF — acima de 1x indica
          sobrerrepresentação. Classificações (Força/Sustentação/Baixa presença/Oportunidades) usam limiares
          iniciais, ainda não calibrados com homologação real — sujeitos a ajuste. "Cenário" é uma simulação
          matemática sobre os resultados históricos — não representa previsão eleitoral.
        </p>
        <p>Concentração territorial mostra a participação dos maiores municípios no total de votos do candidato.</p>
      </div>
    </div>
  )
}
