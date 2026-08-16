import { useMemo, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useSession } from '@/hooks/useSession'
import { useAnaliseTerritorialCandidato } from '@/hooks/useAnaliseTerritorialCandidato'
import { useVotosValidosCargoMunicipio } from '@/hooks/useVotosValidosCargoMunicipio'
import { useCenariosSalvos, useSalvarCenario, useExcluirCenario } from '@/hooks/useCenariosSalvos'
import { calcularGanhoCenario, sugerirDistribuicao } from '@/lib/metrics/cenario'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState } from '@/components/states/EmptyState'
import { ErrorState } from '@/components/states/ErrorState'
import { TerritoryBreadcrumb } from '@/components/context/TerritoryBreadcrumb'
import { RequireAnalysisContext } from '@/components/context/RequireAnalysisContext'
import { MapaImpactoCenario } from '@/components/cenarios/MapaImpactoCenario'
import type { Cargo } from '@/types/domain'

const FORMATO_DATA = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

const FORMATO_NUMERO = new Intl.NumberFormat('pt-BR')
const FORMATO_PERCENTUAL = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })

const METAS_RAPIDAS = [5000, 10000, 20000]

interface TerritorioCenario {
  codigoMunicipio: number
  nomeMunicipio: string
  votosHistoricos: number
  votosValidosTerritorio: number
  metaSimulada: number
}

export function CenariosPage() {
  return (
    <RequireAnalysisContext>
      {({ eleicaoId, uf, cargo, sqCandidato }) => (
        <CenariosConteudo eleicaoId={eleicaoId} uf={uf} cargo={cargo} sqCandidato={sqCandidato} />
      )}
    </RequireAnalysisContext>
  )
}

function CenariosConteudo({
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
  const { candidato, territorios, isLoading: carregandoCandidato, isError } = useAnaliseTerritorialCandidato(
    eleicaoId,
    uf,
    cargo,
    sqCandidato
  )
  const { data: votosValidosMunicipio, isLoading: carregandoMunicipios } = useVotosValidosCargoMunicipio(
    eleicaoId,
    uf,
    cargo
  )
  const { session } = useSession()
  const { data: cenariosSalvos } = useCenariosSalvos(sqCandidato)
  const salvarCenario = useSalvarCenario()
  const excluirCenario = useExcluirCenario()

  const [metaTotal, setMetaTotal] = useState(0)
  const [territoriosCenario, setTerritoriosCenario] = useState<TerritorioCenario[]>([])
  const [buscaAdicionar, setBuscaAdicionar] = useState('')
  const [popoverAberto, setPopoverAberto] = useState(false)
  const [dialogSalvarAberto, setDialogSalvarAberto] = useState(false)
  const [nomeCenario, setNomeCenario] = useState('')

  const votosHistoricosPorMunicipio = useMemo(
    () => new Map(territorios.map((t) => [t.codigo_municipio, t.votos])),
    [territorios]
  )

  const municipiosDisponiveis = (votosValidosMunicipio ?? []).filter(
    (m) =>
      !territoriosCenario.some((t) => t.codigoMunicipio === m.codigo_municipio) &&
      m.nome_municipio.toLowerCase().includes(buscaAdicionar.toLowerCase())
  )

  function adicionarTerritorio(codigoMunicipio: number) {
    const municipio = votosValidosMunicipio?.find((m) => m.codigo_municipio === codigoMunicipio)
    if (!municipio) return
    const votosHistoricos = votosHistoricosPorMunicipio.get(codigoMunicipio) ?? 0
    setTerritoriosCenario((atual) => [
      ...atual,
      {
        codigoMunicipio,
        nomeMunicipio: municipio.nome_municipio,
        votosHistoricos,
        votosValidosTerritorio: municipio.votos_validos,
        metaSimulada: votosHistoricos,
      },
    ])
    setBuscaAdicionar('')
    setPopoverAberto(false)
  }

  function removerTerritorio(codigoMunicipio: number) {
    setTerritoriosCenario((atual) => atual.filter((t) => t.codigoMunicipio !== codigoMunicipio))
  }

  function atualizarMeta(codigoMunicipio: number, novaMeta: number) {
    setTerritoriosCenario((atual) =>
      atual.map((t) =>
        t.codigoMunicipio === codigoMunicipio
          ? { ...t, metaSimulada: Math.max(0, Math.min(t.votosValidosTerritorio, novaMeta)) }
          : t
      )
    )
  }

  function limpar() {
    setTerritoriosCenario([])
    setMetaTotal(0)
  }

  function confirmarSalvar() {
    if (!session || !nomeCenario.trim() || territoriosCenario.length === 0) return
    salvarCenario.mutate(
      {
        userId: session.user.id,
        eleicaoId,
        uf,
        cargo,
        sqCandidato,
        nome: nomeCenario.trim(),
        metaTotal,
        territorios: territoriosCenario.map((t) => ({
          codigo_municipio: t.codigoMunicipio,
          nome_municipio: t.nomeMunicipio,
          votos_historicos: t.votosHistoricos,
          votos_validos_territorio: t.votosValidosTerritorio,
          meta_simulada: t.metaSimulada,
        })),
      },
      {
        onSuccess: () => {
          setDialogSalvarAberto(false)
          setNomeCenario('')
        },
      }
    )
  }

  function carregarCenario(cenario: NonNullable<typeof cenariosSalvos>[number]) {
    setMetaTotal(cenario.meta_total)
    setTerritoriosCenario(
      cenario.territorios.map((t) => ({
        codigoMunicipio: t.codigo_municipio,
        nomeMunicipio: t.nome_municipio,
        votosHistoricos: t.votos_historicos,
        votosValidosTerritorio: t.votos_validos_territorio,
        metaSimulada: t.meta_simulada,
      }))
    )
  }

  function aplicarDistribuicaoSugerida() {
    const sugestao = sugerirDistribuicao(
      territoriosCenario.map((t) => ({
        codigoMunicipio: t.codigoMunicipio,
        votosValidosTerritorio: t.votosValidosTerritorio,
        votosAtuais: t.votosHistoricos,
      })),
      metaTotal
    )
    setTerritoriosCenario((atual) =>
      atual.map((t) => ({ ...t, metaSimulada: sugestao.get(t.codigoMunicipio) ?? t.metaSimulada }))
    )
  }

  const linhas = territoriosCenario.map((t) => {
    const participacaoSimulada = t.votosValidosTerritorio > 0 ? t.metaSimulada / t.votosValidosTerritorio : 0
    const { ganhoCenario } = calcularGanhoCenario(t.votosValidosTerritorio, participacaoSimulada, t.votosHistoricos)
    return { ...t, ganhoCenario }
  })

  const votosDistribuidos = linhas.reduce((soma, l) => soma + l.ganhoCenario, 0)
  const votosRestantes = metaTotal - votosDistribuidos
  const percentualDistribuido = metaTotal > 0 ? (votosDistribuidos / metaTotal) * 100 : 0

  if (carregandoCandidato || carregandoMunicipios) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 p-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40" />
      </div>
    )
  }

  if (isError || !candidato) {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <ErrorState descricao="Não foi possível carregar os dados para o simulador de cenários." />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-8">
      <div className="space-y-1">
        <TerritoryBreadcrumb migalhas={[{ label: uf, href: '/dashboard' }, { label: 'Cenários' }]} />
        <h1 className="text-2xl font-semibold">Simulador de cenários</h1>
        <p className="text-sm text-muted-foreground">
          {candidato.nm_urna_candidato} · {candidato.sigla_partido} — monte uma meta de crescimento e distribua
          entre territórios.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Meta de crescimento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {METAS_RAPIDAS.map((valor) => (
              <Button
                key={valor}
                type="button"
                variant={metaTotal === valor ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMetaTotal(valor)}
              >
                +{FORMATO_NUMERO.format(valor)} votos
              </Button>
            ))}
            <Input
              type="number"
              min={0}
              placeholder="Meta personalizada"
              value={metaTotal || ''}
              onChange={(e) => setMetaTotal(Math.max(0, Number(e.target.value) || 0))}
              className="w-44"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Meta total</p>
              <p className="text-lg font-semibold tabular-nums">{FORMATO_NUMERO.format(metaTotal)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Votos distribuídos</p>
              <p className="text-lg font-semibold tabular-nums">{FORMATO_NUMERO.format(Math.round(votosDistribuidos))}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Votos restantes</p>
              <p className={`text-lg font-semibold tabular-nums ${votosRestantes < 0 ? 'text-destructive' : ''}`}>
                {FORMATO_NUMERO.format(Math.round(votosRestantes))}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">% distribuído</p>
              <p className="text-lg font-semibold tabular-nums">{FORMATO_PERCENTUAL.format(percentualDistribuido)}%</p>
            </div>
          </div>
          <Progress value={Math.min(100, Math.max(0, percentualDistribuido))} />

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={aplicarDistribuicaoSugerida}
              disabled={territoriosCenario.length === 0 || metaTotal <= 0}
            >
              Distribuição sugerida
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={limpar} disabled={territoriosCenario.length === 0}>
              Limpar
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDialogSalvarAberto(true)}
              disabled={territoriosCenario.length === 0}
            >
              Salvar cenário
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogSalvarAberto} onOpenChange={setDialogSalvarAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Salvar cenário</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Nome do cenário (ex: Meta agressiva 2º turno)"
            value={nomeCenario}
            onChange={(e) => setNomeCenario(e.target.value)}
            autoFocus
          />
          <DialogFooter>
            <Button
              type="button"
              onClick={confirmarSalvar}
              disabled={!nomeCenario.trim() || salvarCenario.isPending}
            >
              {salvarCenario.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {cenariosSalvos && cenariosSalvos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Cenários salvos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {cenariosSalvos.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">{c.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    Meta: {FORMATO_NUMERO.format(c.meta_total)} votos · {c.territorios.length} territórios ·{' '}
                    {FORMATO_DATA.format(new Date(c.criado_em))}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => carregarCenario(c)}>
                    Carregar
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => excluirCenario.mutate({ id: c.id, sqCandidato })}
                  >
                    Excluir
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle>Territórios do cenário</CardTitle>
          <Popover open={popoverAberto} onOpenChange={setPopoverAberto}>
            <PopoverTrigger
              render={
                <Button variant="outline" size="sm">
                  <Plus />
                  Adicionar território
                </Button>
              }
            />
            <PopoverContent align="end" className="w-64 p-2">
              <Input
                placeholder="Buscar município..."
                value={buscaAdicionar}
                onChange={(e) => setBuscaAdicionar(e.target.value)}
                className="mb-2"
                autoFocus
              />
              <div className="max-h-56 overflow-y-auto">
                {municipiosDisponiveis.slice(0, 50).map((m) => (
                  <button
                    key={m.codigo_municipio}
                    type="button"
                    onClick={() => adicionarTerritorio(m.codigo_municipio)}
                    className="flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                  >
                    {m.nome_municipio}
                  </button>
                ))}
                {municipiosDisponiveis.length === 0 && (
                  <p className="px-2 py-1.5 text-sm text-muted-foreground">Nenhum município encontrado</p>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </CardHeader>
        <CardContent>
          {linhas.length === 0 ? (
            <EmptyState
              titulo="Nenhum território no cenário ainda"
              descricao="Adicione municípios para começar a simular uma meta de crescimento."
            />
          ) : (
            <>
              {/* Desktop */}
              <Table className="hidden sm:table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Território</TableHead>
                    <TableHead className="text-right">Histórico</TableHead>
                    <TableHead className="text-right">Meta simulada</TableHead>
                    <TableHead className="text-right">Variação</TableHead>
                    <TableHead className="text-right">Remover</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {linhas.map((l) => (
                    <TableRow key={l.codigoMunicipio}>
                      <TableCell>{l.nomeMunicipio}</TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {FORMATO_NUMERO.format(l.votosHistoricos)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min={0}
                          max={l.votosValidosTerritorio}
                          value={l.metaSimulada}
                          onChange={(e) => atualizarMeta(l.codigoMunicipio, Number(e.target.value) || 0)}
                          className="ml-auto w-28 text-right"
                        />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        <span className={l.ganhoCenario < 0 ? 'text-destructive' : 'text-semantic-consolidation'}>
                          {l.ganhoCenario >= 0 ? '+' : ''}
                          {FORMATO_NUMERO.format(Math.round(l.ganhoCenario))}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => removerTerritorio(l.codigoMunicipio)}>
                          <X className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Mobile */}
              <div className="space-y-3 sm:hidden">
                {linhas.map((l) => (
                  <div key={l.codigoMunicipio} className="space-y-2 rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{l.nomeMunicipio}</span>
                      <Button variant="ghost" size="icon" onClick={() => removerTerritorio(l.codigoMunicipio)}>
                        <X className="size-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Histórico: {FORMATO_NUMERO.format(l.votosHistoricos)}</span>
                      <span className={l.ganhoCenario < 0 ? 'text-destructive' : 'text-semantic-consolidation'}>
                        {l.ganhoCenario >= 0 ? '+' : ''}
                        {FORMATO_NUMERO.format(Math.round(l.ganhoCenario))}
                      </span>
                    </div>
                    <Input
                      type="number"
                      min={0}
                      max={l.votosValidosTerritorio}
                      value={l.metaSimulada}
                      onChange={(e) => atualizarMeta(l.codigoMunicipio, Number(e.target.value) || 0)}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {linhas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Impacto territorial</CardTitle>
          </CardHeader>
          <CardContent>
            <MapaImpactoCenario
              impactos={linhas.map((l) => ({
                codigo_municipio: l.codigoMunicipio,
                nome_municipio: l.nomeMunicipio,
                ganhoCenario: l.ganhoCenario,
              }))}
            />
          </CardContent>
        </Card>
      )}

      <div className="space-y-1 text-xs text-muted-foreground">
        <Badge variant="outline" className="mb-1">
          Simulação, não previsão
        </Badge>
        <p>
          Este simulador calcula uma <strong>variação simulada</strong> a partir de metas que você define — é uma
          conta matemática sobre os resultados históricos, não uma previsão ou projeção eleitoral, nem representa
          "votos disponíveis" garantidos. A "distribuição sugerida" reparte a meta proporcionalmente ao tamanho do
          eleitorado válido de cada território, sempre respeitando o teto de 100% de participação — você pode
          ajustar cada território manualmente a qualquer momento.
        </p>
      </div>
    </div>
  )
}
