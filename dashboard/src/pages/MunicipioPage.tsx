import { useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useAppStore } from '@/store/useAppStore'
import { useMunicipio } from '@/hooks/useMunicipio'
import { useEleitoradoMunicipio } from '@/hooks/useEleitoradoMunicipio'
import { useZonasPorMunicipio } from '@/hooks/useZonasPorMunicipio'
import { useAnaliseTerritorialCandidato } from '@/hooks/useAnaliseTerritorialCandidato'
import { useDominanciaZonasCandidato } from '@/hooks/useDominanciaZonasCandidato'
import { useDominanciaLocaisCandidato } from '@/hooks/useDominanciaLocaisCandidato'
import { useLocaisPorMunicipio } from '@/hooks/useLocaisPorMunicipio'
import { NOMES_CARGO } from '@/types/domain'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { EmptyState } from '@/components/states/EmptyState'
import { TerritoryBreadcrumb } from '@/components/context/TerritoryBreadcrumb'
import { MapaCalorIntraCidade } from '@/components/municipio/MapaCalorIntraCidade'
import { corToken } from '@/lib/theme'

const FORMATO_NUMERO = new Intl.NumberFormat('pt-BR')
const FORMATO_PERCENTUAL = new Intl.NumberFormat('pt-BR', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})
const FORMATO_PERCENTUAL_SIMPLES = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })
const FORMATO_QL = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function KpiCard({ titulo, valor, descricao }: { titulo: string; valor: string; descricao?: string }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{titulo}</CardDescription>
        <CardTitle className="text-2xl">{valor}</CardTitle>
      </CardHeader>
      {descricao && <CardContent className="text-xs text-muted-foreground">{descricao}</CardContent>}
    </Card>
  )
}

export function MunicipioPage() {
  const { eleicaoId, uf, codigoIbge } = useParams<{
    eleicaoId: string
    uf: string
    codigoIbge: string
  }>()
  const { candidatoPrincipalId, cargo } = useAppStore()
  const sqCandidato = candidatoPrincipalId ? String(candidatoPrincipalId) : null

  const { data: municipio, isLoading: carregandoMunicipio } = useMunicipio(codigoIbge!)
  const { data: eleitorado, isLoading: carregandoEleitorado } = useEleitoradoMunicipio(eleicaoId!, codigoIbge!)
  const { data: zonas, isLoading: carregandoZonas, isError: erroZonas } = useZonasPorMunicipio(codigoIbge!)

  const temCandidato = !!sqCandidato && !!cargo
  const {
    candidato,
    territorios,
    isLoading: carregandoAnalise,
  } = useAnaliseTerritorialCandidato(eleicaoId ?? '', uf ?? '', cargo ?? 'GOVERNADOR', sqCandidato ?? '', temCandidato)
  const { data: dominanciaZonas, isLoading: carregandoDominanciaZonas } = useDominanciaZonasCandidato(
    sqCandidato ?? '',
    temCandidato ? cargo : null
  )
  const { data: locais, isLoading: carregandoLocais } = useLocaisPorMunicipio(eleicaoId ?? '', codigoIbge ?? '')
  const { data: dominanciaLocais, isLoading: carregandoDominanciaLocais } = useDominanciaLocaisCandidato(
    sqCandidato ?? '',
    temCandidato ? cargo : null
  )

  const territorioDoMunicipio = territorios.find((t) => t.codigo_municipio === Number(codigoIbge))
  const codigosZonasDoMunicipio = useMemo(() => new Set((zonas ?? []).map((z) => z.id)), [zonas])
  const votosPorZona = useMemo(
    () => (dominanciaZonas ?? []).filter((d) => codigosZonasDoMunicipio.has(d.zona_id)).sort((a, b) => a.numero_zona - b.numero_zona),
    [dominanciaZonas, codigosZonasDoMunicipio]
  )
  const votosPorZonaGrafico = votosPorZona
    .slice()
    .sort((a, b) => b.qtde_votos - a.qtde_votos)
    .map((z) => ({ ...z, zonaLabel: `Zona ${z.numero_zona}` }))

  const votosPorLocal = useMemo(
    () => new Map((dominanciaLocais ?? []).map((d) => [d.local_votacao_id, d.qtde_votos])),
    [dominanciaLocais]
  )
  const numeroZonaPorId = useMemo(() => new Map((zonas ?? []).map((z) => [z.id, z.numero_zona])), [zonas])
  const pontosCalor = (locais ?? [])
    .filter((l) => l.latitude !== null && l.longitude !== null)
    .map((l) => ({
      localVotacaoId: l.id,
      latitude: l.latitude!,
      longitude: l.longitude!,
      votos: votosPorLocal.get(l.id) ?? 0,
      nomeLocal: l.nome_local,
      endereco: l.endereco,
      codigoLocalTse: l.codigo_local_tse,
      numeroZona: numeroZonaPorId.get(l.zona_id) ?? 0,
      zonaId: l.zona_id,
    }))

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-8">
      <div className="space-y-1">
        <TerritoryBreadcrumb migalhas={[{ label: uf ?? '', href: '/dashboard' }, { label: municipio?.nome_municipio ?? '...' }]} />
        {carregandoMunicipio ? (
          <Skeleton className="h-8 w-64" />
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold">{municipio?.nome_municipio ?? 'Município não encontrado'}</h1>
            {temCandidato && cargo && <Badge variant="secondary">{NOMES_CARGO[cargo]}</Badge>}
          </div>
        )}
        <p className="text-sm text-muted-foreground">
          {temCandidato && candidato
            ? `${candidato.nm_urna_candidato} · ${candidato.sigla_partido}`
            : 'Selecione um candidato na barra de contexto para ver o desempenho dele aqui.'}
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

      {temCandidato && (
        <Card>
          <CardHeader>
            <CardTitle>Desempenho do candidato aqui</CardTitle>
          </CardHeader>
          <CardContent>
            {carregandoAnalise ? (
              <Skeleton className="h-24" />
            ) : !territorioDoMunicipio ? (
              <EmptyState
                titulo="Sem votos apurados"
                descricao="Este candidato não teve votos apurados neste município."
              />
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <p className="text-xs text-muted-foreground">Votos</p>
                  <p className="text-xl font-semibold tabular-nums">{FORMATO_NUMERO.format(territorioDoMunicipio.votos)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Participação (PT)</p>
                  <p className="text-xl font-semibold tabular-nums">
                    {territorioDoMunicipio.pt !== null ? `${FORMATO_PERCENTUAL_SIMPLES.format(territorioDoMunicipio.pt * 100)}%` : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Força relativa (QL)</p>
                  <p className="text-xl font-semibold tabular-nums">
                    {territorioDoMunicipio.ql !== null ? `${FORMATO_QL.format(territorioDoMunicipio.ql)}x` : '—'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {territorioDoMunicipio.forca && (
                    <Badge variant="secondary" className="bg-semantic-force text-semantic-force-foreground">
                      Força
                    </Badge>
                  )}
                  {territorioDoMunicipio.sustentacao && (
                    <Badge variant="secondary" className="bg-semantic-support text-semantic-support-foreground">
                      Sustentação
                    </Badge>
                  )}
                  {territorioDoMunicipio.baixaPresenca && (
                    <Badge variant="secondary" className="bg-semantic-low-presence text-semantic-low-presence-foreground">
                      Baixa presença
                    </Badge>
                  )}
                  {!territorioDoMunicipio.forca && !territorioDoMunicipio.sustentacao && !territorioDoMunicipio.baixaPresenca && (
                    <span className="text-xs text-muted-foreground">Sem camada</span>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {temCandidato && (
        <Card>
          <CardHeader>
            <CardTitle>Mapa de calor por local de votação</CardTitle>
          </CardHeader>
          <CardContent>
            {carregandoLocais || carregandoDominanciaLocais ? (
              <Skeleton className="h-[360px] w-full" />
            ) : (
              <MapaCalorIntraCidade
                pontos={pontosCalor}
                totalLocais={locais?.length ?? 0}
                eleicaoId={eleicaoId ?? ''}
                uf={uf ?? ''}
                codigoIbge={codigoIbge ?? ''}
              />
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Zonas eleitorais</CardTitle>
          {temCandidato && <CardDescription>Votos do candidato por zona.</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-4">
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

          {temCandidato && !carregandoDominanciaZonas && votosPorZonaGrafico.length > 1 && (
            <ResponsiveContainer width="100%" height={Math.max(160, votosPorZonaGrafico.length * 36)}>
              <BarChart data={votosPorZonaGrafico} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => FORMATO_NUMERO.format(v)} />
                <YAxis type="category" dataKey="zonaLabel" width={70} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => FORMATO_NUMERO.format(Number(v))} />
                <Bar dataKey="qtde_votos" fill={corToken('--primary-600')} radius={4} />
              </BarChart>
            </ResponsiveContainer>
          )}

          {zonas && zonas.length > 0 && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {zonas.map((zona) => {
                const dadosCandidato = votosPorZona.find((d) => d.zona_id === zona.id)
                return (
                  <Link
                    key={zona.id}
                    to={`/dashboard/${eleicaoId}/${uf}/municipio/${codigoIbge}/zona/${zona.id}`}
                    className="block space-y-2 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">Zona {zona.numero_zona}</span>
                      <span className="text-sm text-primary">Ver detalhes →</span>
                    </div>
                    {temCandidato &&
                      (dadosCandidato ? (
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>{FORMATO_NUMERO.format(dadosCandidato.qtde_votos)} votos do candidato</span>
                          <span>{FORMATO_PERCENTUAL_SIMPLES.format(dadosCandidato.percentual_dominancia)}% do comparecimento</span>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Sem votos do candidato nesta zona.</p>
                      ))}
                  </Link>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
