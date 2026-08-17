import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Info } from 'lucide-react'
import { useAnaliseTerritorialCandidato } from '@/hooks/useAnaliseTerritorialCandidato'
import { calcularGanhoCenario } from '@/lib/metrics/cenario'
import { classificarOportunidade, INCREMENTO_CENARIO_OPORTUNIDADE } from '@/lib/metrics/oportunidade'
import { LIMIARES_CLASSIFICACAO_PROVISORIOS } from '@/lib/metrics/classificacao'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState } from '@/components/states/EmptyState'
import { ErrorState } from '@/components/states/ErrorState'
import { TerritoryBreadcrumb } from '@/components/context/TerritoryBreadcrumb'
import { RequireAnalysisContext } from '@/components/context/RequireAnalysisContext'
import type { Cargo } from '@/types/domain'

const FORMATO_NUMERO = new Intl.NumberFormat('pt-BR')
const FORMATO_PERCENTUAL = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })
const FORMATO_QL = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

type Camada = 'forca' | 'sustentacao' | 'oportunidade' | 'baixaPresenca'

const CAMADAS: { id: Camada; rotulo: string; cor: string }[] = [
  { id: 'forca', rotulo: 'Força', cor: 'bg-semantic-force text-semantic-force-foreground' },
  { id: 'sustentacao', rotulo: 'Sustentação', cor: 'bg-semantic-support text-semantic-support-foreground' },
  { id: 'oportunidade', rotulo: 'Oportunidade', cor: 'bg-semantic-opportunity text-semantic-opportunity-foreground' },
  { id: 'baixaPresenca', rotulo: 'Baixa presença', cor: 'bg-semantic-low-presence text-semantic-low-presence-foreground' },
]

export function TerritoriosPage() {
  return (
    <RequireAnalysisContext>
      {({ eleicaoId, uf, cargo, sqCandidato }) => (
        <TerritoriosConteudo eleicaoId={eleicaoId} uf={uf} cargo={cargo} sqCandidato={sqCandidato} />
      )}
    </RequireAnalysisContext>
  )
}

function TerritoriosConteudo({
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
  const { candidato, territorios, isLoading, isError } = useAnaliseTerritorialCandidato(
    eleicaoId,
    uf,
    cargo,
    sqCandidato
  )
  const [busca, setBusca] = useState('')
  const [camadasAtivas, setCamadasAtivas] = useState<Camada[]>([])

  const linhas = useMemo(
    () =>
      territorios.map((t) => {
        const participacaoSimulada = t.pt !== null ? t.pt + INCREMENTO_CENARIO_OPORTUNIDADE : null
        const ganho =
          participacaoSimulada !== null
            ? calcularGanhoCenario(t.votosValidosTerritorio, participacaoSimulada, t.votos).ganhoCenario
            : null
        const papel = classificarOportunidade(t, t.votosValidosTerritorio, ganho)
        const camadas: Camada[] = [
          ...(t.forca ? (['forca'] as const) : []),
          ...(t.sustentacao ? (['sustentacao'] as const) : []),
          ...(papel === 'expansao' ? (['oportunidade'] as const) : []),
          ...(t.baixaPresenca ? (['baixaPresenca'] as const) : []),
        ]
        return { ...t, papel, camadas }
      }),
    [territorios]
  )

  function alternarCamada(camada: Camada) {
    setCamadasAtivas((atual) => (atual.includes(camada) ? atual.filter((c) => c !== camada) : [...atual, camada]))
  }

  const filtradas = linhas
    .filter((t) => t.nome_municipio.toLowerCase().includes(busca.trim().toLowerCase()))
    .filter((t) => camadasAtivas.length === 0 || t.camadas.some((c) => camadasAtivas.includes(c)))
    .sort((a, b) => b.votos - a.votos)

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 p-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (isError || !candidato) {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <ErrorState descricao="Não foi possível carregar os territórios deste candidato." />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-8">
      <div className="space-y-1">
        <TerritoryBreadcrumb migalhas={[{ label: uf, href: '/dashboard' }, { label: 'Territórios' }]} />
        <h1 className="text-2xl font-semibold">Territórios</h1>
        <p className="text-sm text-muted-foreground">
          {candidato.nm_urna_candidato} · {candidato.sigla_partido} — {linhas.length} territórios com votos
          apurados, por camada analítica.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Buscar município..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="sm:max-w-xs"
        />
        <div className="flex flex-wrap gap-2">
          {CAMADAS.map((camada) => (
            <button key={camada.id} type="button" onClick={() => alternarCamada(camada.id)}>
              <Badge
                variant={camadasAtivas.includes(camada.id) ? 'default' : 'outline'}
                className={camadasAtivas.includes(camada.id) ? camada.cor : ''}
              >
                {camada.rotulo}
              </Badge>
            </button>
          ))}
        </div>
      </div>

      {filtradas.length === 0 ? (
        <EmptyState
          titulo="Nenhum território encontrado"
          descricao="Ajuste a busca ou as camadas selecionadas para ver outros territórios."
        />
      ) : (
        <>
          {/* Desktop */}
          <Card className="hidden sm:block">
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Território</TableHead>
                    <TableHead className="text-right">Votos</TableHead>
                    <TableHead className="text-right">Participação (PT)</TableHead>
                    <TableHead className="text-right">Contribuição (CE)</TableHead>
                    <TableHead className="text-right">Força relativa (QL)</TableHead>
                    <TableHead>Camadas</TableHead>
                    <TableHead className="text-right">Por quê?</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtradas.map((t) => (
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
                        {t.camadas.length === 0 ? (
                          <span className="text-xs text-muted-foreground">Sem camada</span>
                        ) : (
                          t.camadas.map((c) => {
                            const camada = CAMADAS.find((cm) => cm.id === c)!
                            return (
                              <Badge key={c} variant="secondary" className={camada.cor}>
                                {camada.rotulo}
                              </Badge>
                            )
                          })
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <ExplicacaoClassificacao territorio={t} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Mobile */}
          <div className="space-y-3 sm:hidden">
            {filtradas.map((t) => (
              <Card key={t.codigo_municipio}>
                <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
                  <Link
                    to={`/dashboard/${eleicaoId}/${uf}/municipio/${t.codigo_municipio}`}
                    className="text-base font-medium hover:underline"
                  >
                    {t.nome_municipio}
                  </Link>
                  <ExplicacaoClassificacao territorio={t} />
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Votos</p>
                      <p className="tabular-nums">{FORMATO_NUMERO.format(t.votos)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Força relativa (QL)</p>
                      <p className="tabular-nums">{t.ql !== null ? `${FORMATO_QL.format(t.ql)}x` : '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Participação (PT)</p>
                      <p className="tabular-nums">{t.pt !== null ? `${FORMATO_PERCENTUAL.format(t.pt * 100)}%` : '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Contribuição (CE)</p>
                      <p className="tabular-nums">{t.ce !== null ? `${FORMATO_PERCENTUAL.format(t.ce * 100)}%` : '—'}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {t.camadas.length === 0 ? (
                      <span className="text-xs text-muted-foreground">Sem camada</span>
                    ) : (
                      t.camadas.map((c) => {
                        const camada = CAMADAS.find((cm) => cm.id === c)!
                        return (
                          <Badge key={c} variant="secondary" className={camada.cor}>
                            {camada.rotulo}
                          </Badge>
                        )
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      <div className="space-y-1 text-xs text-muted-foreground">
        <p>
          <strong>Força:</strong> candidato sobrerrepresentado ali frente à referência geral (QL).{' '}
          <strong>Sustentação:</strong> território pesa muito no total de votos do candidato (CE).{' '}
          <strong>Oportunidade:</strong> território classificado como Expansão (doc 03 §5.1) — ver detalhes na
          tela de Oportunidades. <strong>Baixa presença:</strong> QL baixo, com escala de votos relevante — as
          camadas não são exclusivas, um território pode ter mais de uma. Limiares ainda provisórios, sujeitos a
          calibração com dados reais.
        </p>
      </div>
    </div>
  )
}

function ExplicacaoClassificacao({
  territorio,
}: {
  territorio: { ql: number | null; ce: number | null; votosValidosTerritorio: number }
}) {
  const limiares = LIMIARES_CLASSIFICACAO_PROVISORIOS
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="Por que essa classificação?">
            <Info className="size-4" />
          </Button>
        }
      />
      <PopoverContent align="end" className="w-72 space-y-2 text-sm">
        <p className="font-medium">Por que essa classificação?</p>
        <ul className="space-y-1 text-muted-foreground">
          <li>
            Força relativa (QL): {territorio.ql !== null ? `${FORMATO_QL.format(territorio.ql)}x` : '—'} — limiar de
            Força: ≥ {FORMATO_QL.format(limiares.qlForca)}x
          </li>
          <li>
            Contribuição (CE): {territorio.ce !== null ? `${FORMATO_PERCENTUAL.format(territorio.ce * 100)}%` : '—'}{' '}
            — limiar de Sustentação: ≥ {FORMATO_PERCENTUAL.format(limiares.ceSustentacao * 100)}%
          </li>
          <li>
            Votos válidos do território: {FORMATO_NUMERO.format(territorio.votosValidosTerritorio)} — mínimo pra
            considerar escala relevante: {FORMATO_NUMERO.format(limiares.escalaMinimaRelevante)}
          </li>
        </ul>
      </PopoverContent>
    </Popover>
  )
}
