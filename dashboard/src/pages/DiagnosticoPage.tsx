import { Link } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'
import { useSession } from '@/hooks/useSession'
import { useMinhasPermissoes } from '@/hooks/useMinhasPermissoes'
import { useCandidato } from '@/hooks/useCandidato'
import { useResultadoCandidatoMunicipio } from '@/hooks/useResultadoCandidatoMunicipio'
import { useVotosValidosCargoMunicipio } from '@/hooks/useVotosValidosCargoMunicipio'
import { useVotosValidosCargoUf } from '@/hooks/useVotosValidosCargoUf'
import { calcularConcentracaoTopN } from '@/lib/metrics/concentracao'
import { calcularParticipacao, calcularQuocienteLocacional } from '@/lib/metrics/participacao'
import { classificarTerritorio } from '@/lib/metrics/classificacao'
import { NOMES_CARGO, type Cargo } from '@/types/domain'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { buttonVariants } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState } from '@/components/states/EmptyState'
import { ErrorState } from '@/components/states/ErrorState'
import { PermissionState } from '@/components/states/PermissionState'
import { TerritoryBreadcrumb } from '@/components/context/TerritoryBreadcrumb'
import { HeroInsightCard } from '@/components/diagnostico/HeroInsightCard'
import { InsightCard } from '@/components/diagnostico/InsightCard'
import { MapaCandidatoMunicipios } from '@/components/diagnostico/MapaCandidatoMunicipios'

const FORMATO_NUMERO = new Intl.NumberFormat('pt-BR')
const FORMATO_PERCENTUAL = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })
const FORMATO_QL = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

interface LinhaTerritorio {
  codigo_municipio: number
  nome_municipio: string
  votos: number
  pt: number | null
  ce: number | null
  ql: number | null
  forca: boolean
  sustentacao: boolean
  baixaPresenca: boolean
}

// Home de Diagnóstico (Épico 2, docs/11) — substitui o antigo
// SeletorEleicaoPage como conteúdo de /dashboard. O contexto (eleição,
// turno, cargo, candidato, território) vem inteiramente do
// AnalysisContextBar/useAppStore, montado globalmente pelo AppShell.
export function DiagnosticoPage() {
  const { session, carregando: carregandoSessao } = useSession()
  const { data: permissoes, isLoading: carregandoPermissoes } = useMinhasPermissoes(!!session)
  const { eleicaoId, uf, cargo, candidatoPrincipalId } = useAppStore()

  if (carregandoSessao || (session && carregandoPermissoes)) {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <Skeleton className="h-40" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-md space-y-4 p-8 text-center">
        <Alert>
          <AlertTitle>Você precisa entrar</AlertTitle>
          <AlertDescription>Faça login para acessar o diagnóstico eleitoral.</AlertDescription>
        </Alert>
        <Link to="/login" className={buttonVariants()}>
          Ir para o login
        </Link>
      </div>
    )
  }

  if (!permissoes || permissoes.length === 0) {
    return (
      <div className="mx-auto max-w-md p-8">
        <PermissionState
          titulo="Acesso pendente de liberação"
          descricao="Seu login foi feito com sucesso, mas ainda não há nenhum escopo de dados liberado para sua conta. Fale com o administrador responsável."
        />
      </div>
    )
  }

  if (!eleicaoId || !uf || !cargo || !candidatoPrincipalId) {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <EmptyState
          titulo="Comece selecionando o contexto da análise"
          descricao="Escolha eleição, cargo e candidato na barra no topo da tela para ver o diagnóstico."
        />
      </div>
    )
  }

  return (
    <DiagnosticoConteudo
      eleicaoId={String(eleicaoId)}
      uf={uf}
      cargo={cargo}
      sqCandidato={String(candidatoPrincipalId)}
    />
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
  const { data: candidato, isLoading: carregandoCandidato } = useCandidato(sqCandidato)
  const {
    data: resultados,
    isLoading: carregandoResultados,
    isError: erroResultados,
  } = useResultadoCandidatoMunicipio(sqCandidato)
  const { data: votosValidosMunicipio, isLoading: carregandoVotosMunicipio } = useVotosValidosCargoMunicipio(
    eleicaoId,
    uf,
    cargo
  )
  const { data: votosValidosUf, isLoading: carregandoVotosUf } = useVotosValidosCargoUf(eleicaoId, uf, cargo)

  const carregando =
    carregandoCandidato || carregandoResultados || carregandoVotosMunicipio || carregandoVotosUf

  if (carregando) {
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

  if (erroResultados || !candidato) {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <ErrorState descricao="Não foi possível carregar o diagnóstico deste candidato." />
      </div>
    )
  }

  const concentracao = calcularConcentracaoTopN(resultados ?? [])

  // PT/CE/QL e classificação por município — a agregação pesada
  // (soma de votação por candidato/território) já veio pronta do
  // banco (vw_resultado_candidato_municipio, vw_votos_validos_cargo_*);
  // aqui só combinamos números já pequenos com funções puras testadas
  // (lib/metrics/participacao.ts, classificacao.ts).
  const votosValidosPorMunicipio = new Map((votosValidosMunicipio ?? []).map((v) => [v.codigo_municipio, v.votos_validos]))
  const votosValidosCargoUf = votosValidosUf?.votos_validos ?? 0

  const territorios: LinhaTerritorio[] = (resultados ?? []).map((r) => {
    const votosValidosTerritorio = votosValidosPorMunicipio.get(r.codigo_municipio) ?? 0
    const pt = calcularParticipacao(r.total_votos, votosValidosTerritorio)
    const ce = calcularParticipacao(r.total_votos, concentracao.totalVotos)
    const participacaoGeral = calcularParticipacao(votosValidosTerritorio, votosValidosCargoUf)
    const ql = calcularQuocienteLocacional(ce, participacaoGeral)
    const classificacao = classificarTerritorio(ql, ce, votosValidosTerritorio)

    return {
      codigo_municipio: r.codigo_municipio,
      nome_municipio: r.nome_municipio,
      votos: r.total_votos,
      pt,
      ce,
      ql,
      ...classificacao,
    }
  })

  const territoriosDeForca = territorios.filter((t) => t.forca).length
  const territoriosDeSustentacao = territorios.filter((t) => t.sustentacao).length

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
        <HeroInsightCard titulo="Resultado histórico" valor={`${FORMATO_NUMERO.format(concentracao.totalVotos)} votos`} />
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
          sobrerrepresentação. Classificações (Força/Sustentação/Baixa presença) usam limiares iniciais,
          ainda não calibrados com homologação real — sujeitos a ajuste.
        </p>
        <p>Concentração territorial mostra a participação dos maiores municípios no total de votos do candidato — não é uma previsão eleitoral.</p>
      </div>
    </div>
  )
}
