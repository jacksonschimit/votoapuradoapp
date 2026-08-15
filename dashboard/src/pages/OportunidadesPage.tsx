import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAnaliseTerritorialCandidato } from '@/hooks/useAnaliseTerritorialCandidato'
import { calcularGanhoCenario } from '@/lib/metrics/cenario'
import { classificarOportunidade, INCREMENTO_CENARIO_OPORTUNIDADE, type PapelOportunidade } from '@/lib/metrics/oportunidade'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState } from '@/components/states/EmptyState'
import { ErrorState } from '@/components/states/ErrorState'
import { TerritoryBreadcrumb } from '@/components/context/TerritoryBreadcrumb'
import { RequireAnalysisContext } from '@/components/context/RequireAnalysisContext'
import type { Cargo } from '@/types/domain'

const FORMATO_NUMERO = new Intl.NumberFormat('pt-BR')
const FORMATO_PERCENTUAL = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })
const FORMATO_QL = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const ROTULO_PAPEL: Record<PapelOportunidade, string> = {
  consolidacao: 'Consolidação',
  expansao: 'Expansão',
  desenvolvimento: 'Desenvolvimento',
  baixa_prioridade: 'Baixa prioridade histórica',
}

const COR_PAPEL: Record<PapelOportunidade, string> = {
  consolidacao: 'bg-semantic-consolidation text-semantic-consolidation-foreground',
  expansao: 'bg-semantic-opportunity text-semantic-opportunity-foreground',
  desenvolvimento: 'bg-semantic-development text-semantic-development-foreground',
  baixa_prioridade: 'bg-semantic-low-presence text-semantic-low-presence-foreground',
}

export function OportunidadesPage() {
  return (
    <RequireAnalysisContext>
      {({ eleicaoId, uf, cargo, sqCandidato }) => (
        <OportunidadesConteudo eleicaoId={eleicaoId} uf={uf} cargo={cargo} sqCandidato={sqCandidato} />
      )}
    </RequireAnalysisContext>
  )
}

function OportunidadesConteudo({
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
  const [filtroClassificacao, setFiltroClassificacao] = useState<PapelOportunidade | 'todas'>('todas')

  const oportunidades = useMemo(
    () =>
      territorios.map((t) => {
        const participacaoSimulada = t.pt !== null ? t.pt + INCREMENTO_CENARIO_OPORTUNIDADE : null
        const ganho =
          participacaoSimulada !== null
            ? calcularGanhoCenario(t.votosValidosTerritorio, participacaoSimulada, t.votos).ganhoCenario
            : null
        const papel = classificarOportunidade(t, t.votosValidosTerritorio, ganho)
        return { ...t, ganho, papel }
      }),
    [territorios]
  )

  const filtradas = oportunidades
    .filter((t) => filtroClassificacao === 'todas' || t.papel === filtroClassificacao)
    .filter((t) => t.nome_municipio.toLowerCase().includes(busca.trim().toLowerCase()))
    .sort((a, b) => (b.ganho ?? 0) - (a.ganho ?? 0))

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
        <ErrorState descricao="Não foi possível carregar as oportunidades deste candidato." />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-8">
      <div className="space-y-1">
        <TerritoryBreadcrumb migalhas={[{ label: uf, href: '/dashboard' }, { label: 'Oportunidades' }]} />
        <h1 className="text-2xl font-semibold">Oportunidades de crescimento</h1>
        <p className="text-sm text-muted-foreground">
          {candidato.nm_urna_candidato} · {candidato.sigla_partido} — todos os {oportunidades.length} territórios,
          classificados por papel estratégico.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Buscar município..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select
          value={filtroClassificacao}
          onValueChange={(value) => setFiltroClassificacao(value as PapelOportunidade | 'todas')}
          items={{
            todas: 'Todas as classificações',
            consolidacao: ROTULO_PAPEL.consolidacao,
            expansao: ROTULO_PAPEL.expansao,
            desenvolvimento: ROTULO_PAPEL.desenvolvimento,
            baixa_prioridade: ROTULO_PAPEL.baixa_prioridade,
          }}
        >
          <SelectTrigger className="sm:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as classificações</SelectItem>
            <SelectItem value="consolidacao">{ROTULO_PAPEL.consolidacao}</SelectItem>
            <SelectItem value="expansao">{ROTULO_PAPEL.expansao}</SelectItem>
            <SelectItem value="desenvolvimento">{ROTULO_PAPEL.desenvolvimento}</SelectItem>
            <SelectItem value="baixa_prioridade">{ROTULO_PAPEL.baixa_prioridade}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtradas.length === 0 ? (
        <EmptyState
          titulo="Nenhum território encontrado"
          descricao="Ajuste a busca ou o filtro de classificação para ver outros territórios."
        />
      ) : (
        <>
          {/* Desktop: tabela (doc 06 §3) */}
          <Card className="hidden sm:block">
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Território</TableHead>
                    <TableHead>Classificação</TableHead>
                    <TableHead className="text-right">Presença histórica (PT)</TableHead>
                    <TableHead className="text-right">Força relativa (QL)</TableHead>
                    <TableHead className="text-right">Votos válidos</TableHead>
                    <TableHead className="text-right">Ganho no cenário</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtradas.map((t) => (
                    <TableRow key={t.codigo_municipio}>
                      <TableCell>{t.nome_municipio}</TableCell>
                      <TableCell>
                        {t.papel ? (
                          <Badge variant="secondary" className={COR_PAPEL[t.papel]}>
                            {ROTULO_PAPEL[t.papel]}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Sem dado suficiente</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {t.pt !== null ? `${FORMATO_PERCENTUAL.format(t.pt * 100)}%` : '—'}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {t.ql !== null ? `${FORMATO_QL.format(t.ql)}x` : '—'}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {FORMATO_NUMERO.format(t.votosValidosTerritorio)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {t.ganho !== null ? `${t.ganho >= 0 ? '+' : ''}${FORMATO_NUMERO.format(Math.round(t.ganho))}` : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          to={`/dashboard/${eleicaoId}/${uf}/municipio/${t.codigo_municipio}`}
                          className="text-sm text-primary hover:underline"
                        >
                          Analisar
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Mobile: cards (doc 05 §9, doc 06 §3) */}
          <div className="space-y-3 sm:hidden">
            {filtradas.map((t) => (
              <Card key={t.codigo_municipio}>
                <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
                  <CardTitle className="text-base">{t.nome_municipio}</CardTitle>
                  {t.papel && (
                    <Badge variant="secondary" className={COR_PAPEL[t.papel]}>
                      {ROTULO_PAPEL[t.papel]}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Presença histórica (PT)</p>
                    <p className="tabular-nums">{t.pt !== null ? `${FORMATO_PERCENTUAL.format(t.pt * 100)}%` : '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Força relativa (QL)</p>
                    <p className="tabular-nums">{t.ql !== null ? `${FORMATO_QL.format(t.ql)}x` : '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Votos válidos</p>
                    <p className="tabular-nums">{FORMATO_NUMERO.format(t.votosValidosTerritorio)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Ganho no cenário</p>
                    <p className="tabular-nums">
                      {t.ganho !== null ? `${t.ganho >= 0 ? '+' : ''}${FORMATO_NUMERO.format(Math.round(t.ganho))}` : '—'}
                    </p>
                  </div>
                  <Link
                    to={`/dashboard/${eleicaoId}/${uf}/municipio/${t.codigo_municipio}`}
                    className={buttonVariants({ variant: 'outline', size: 'sm', className: 'col-span-2 mt-1' })}
                  >
                    Analisar território
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      <div className="space-y-1 text-xs text-muted-foreground">
        <p>
          <strong>Consolidação:</strong> força e sustentação juntas — base já forte e relevante para o total.{' '}
          <strong>Expansão:</strong> sem força nem baixa presença, com escala e espaço de crescimento no cenário
          de referência. <strong>Desenvolvimento:</strong> baixa presença, mas escala relevante — vale investir.{' '}
          <strong>Baixa prioridade histórica:</strong> baixa presença e escala irrisória.
        </p>
        <p>
          "Ganho no cenário" simula um acréscimo fixo de {INCREMENTO_CENARIO_OPORTUNIDADE * 100} pontos
          percentuais na participação territorial atual — é uma simulação matemática sobre dados históricos, não
          uma previsão eleitoral. Territórios sem dado suficiente para nenhum papel ficam sem classificação, em
          vez de receber um rótulo forçado.
        </p>
      </div>
    </div>
  )
}
