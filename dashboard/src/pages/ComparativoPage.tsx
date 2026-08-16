import { useAppStore } from '@/store/useAppStore'
import { useComparativoCandidatos } from '@/hooks/useComparativoCandidatos'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState } from '@/components/states/EmptyState'
import { ErrorState } from '@/components/states/ErrorState'
import { TerritoryBreadcrumb } from '@/components/context/TerritoryBreadcrumb'
import { RequireAnalysisContext } from '@/components/context/RequireAnalysisContext'
import { MapaComparativo } from '@/components/comparativo/MapaComparativo'
import type { Cargo } from '@/types/domain'

const FORMATO_NUMERO = new Intl.NumberFormat('pt-BR')
const FORMATO_PERCENTUAL = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })

export function ComparativoPage() {
  return (
    <RequireAnalysisContext>
      {({ eleicaoId, uf, cargo, sqCandidato }) => (
        <ComparativoConteudo eleicaoId={eleicaoId} uf={uf} cargo={cargo} sqCandidatoPrincipal={sqCandidato} />
      )}
    </RequireAnalysisContext>
  )
}

function ComparativoConteudo({
  eleicaoId,
  uf,
  cargo,
  sqCandidatoPrincipal,
}: {
  eleicaoId: string
  uf: string
  cargo: Cargo
  sqCandidatoPrincipal: string
}) {
  const candidatosComparacaoIds = useAppStore((s) => s.candidatosComparacaoIds)
  const candidatoIds = [sqCandidatoPrincipal, ...candidatosComparacaoIds.map(String)]

  const { candidatos, isLoading, isError } = useComparativoCandidatos(eleicaoId, uf, cargo, candidatoIds)

  if (candidatosComparacaoIds.length === 0) {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <TerritoryBreadcrumb migalhas={[{ label: uf, href: '/dashboard' }, { label: 'Comparativo' }]} className="mb-4" />
        <EmptyState
          titulo="Nenhum candidato em comparação"
          descricao='Use o botão "+ Comparar" na barra de contexto, no topo da tela, para adicionar candidatos compatíveis (mesma eleição e cargo).'
        />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 p-8">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    )
  }

  if (isError || candidatos.length === 0) {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <ErrorState descricao="Não foi possível carregar o comparativo entre candidatos." />
      </div>
    )
  }

  // Diferenças territoriais: municípios em que ambos têm dado,
  // ordenados pela maior diferença entre o 1º e o 2º colocado ali —
  // top 15 pra manter a tabela legível (doc 11 §Épico 6: "sem
  // poluição visual"), não a lista completa de municípios.
  const codigosMunicipios = new Set<number>()
  candidatos.forEach((c) => c.porMunicipio.forEach((_v, codigo) => codigosMunicipios.add(codigo)))

  const diferencas = Array.from(codigosMunicipios)
    .map((codigo) => {
      const nomeMunicipio =
        candidatos.map((c) => c.porMunicipio.get(codigo)?.nomeMunicipio).find((n) => n !== undefined) ??
        `Município ${codigo}`
      const votosPorCandidato = candidatos.map((c) => ({
        nome: c.nome,
        votos: c.porMunicipio.get(codigo)?.votos ?? 0,
      }))
      const ordenados = [...votosPorCandidato].sort((a, b) => b.votos - a.votos)
      return {
        codigo,
        nomeMunicipio,
        votosPorCandidato,
        diferenca: (ordenados[0]?.votos ?? 0) - (ordenados[1]?.votos ?? 0),
      }
    })
    .sort((a, b) => b.diferenca - a.diferenca)
    .slice(0, 15)

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-8">
      <div className="space-y-1">
        <TerritoryBreadcrumb migalhas={[{ label: uf, href: '/dashboard' }, { label: 'Comparativo' }]} />
        <h1 className="text-2xl font-semibold">Comparativo entre candidatos</h1>
        <p className="text-sm text-muted-foreground">
          Mesma eleição, cargo e território — {candidatos.length} candidatos comparados.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {candidatos.map((c) => (
          <Card key={c.sqCandidato}>
            <CardHeader>
              <CardTitle className="text-base">{c.nome}</CardTitle>
              <p className="text-xs text-muted-foreground">{c.partido}</p>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Resultado histórico</span>
                <span className="tabular-nums font-medium">{FORMATO_NUMERO.format(c.totalVotos)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Concentração Top 5</span>
                <span className="tabular-nums font-medium">
                  {c.concentracaoTop5 !== null ? `${FORMATO_PERCENTUAL.format(c.concentracaoTop5)}%` : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Territórios de força</span>
                <span className="tabular-nums font-medium">{c.territoriosDeForca}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mapa comparativo</CardTitle>
        </CardHeader>
        <CardContent>
          <MapaComparativo candidatos={candidatos} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Diferenças territoriais</CardTitle>
        </CardHeader>
        <CardContent>
          {diferencas.length === 0 ? (
            <EmptyState titulo="Sem municípios em comum" descricao="Nenhum dos candidatos comparados tem votos apurados." />
          ) : (
            <>
              {/* Desktop */}
              <Table className="hidden sm:table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Município</TableHead>
                    {candidatos.map((c) => (
                      <TableHead key={c.sqCandidato} className="text-right">
                        {c.nome}
                      </TableHead>
                    ))}
                    <TableHead className="text-right">Diferença</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {diferencas.map((d) => (
                    <TableRow key={d.codigo}>
                      <TableCell>{d.nomeMunicipio}</TableCell>
                      {d.votosPorCandidato.map((v) => (
                        <TableCell key={v.nome} className="text-right tabular-nums">
                          {FORMATO_NUMERO.format(v.votos)}
                        </TableCell>
                      ))}
                      <TableCell className="text-right tabular-nums font-medium">
                        {FORMATO_NUMERO.format(d.diferenca)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Mobile */}
              <div className="space-y-3 sm:hidden">
                {diferencas.map((d) => (
                  <div key={d.codigo} className="space-y-1 rounded-lg border p-3">
                    <p className="font-medium">{d.nomeMunicipio}</p>
                    {d.votosPorCandidato.map((v) => (
                      <div key={v.nome} className="flex justify-between text-sm text-muted-foreground">
                        <span>{v.nome}</span>
                        <span className="tabular-nums">{FORMATO_NUMERO.format(v.votos)}</span>
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground">
                      Diferença para o líder: <span className="font-medium text-foreground">{FORMATO_NUMERO.format(d.diferenca)}</span>
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="space-y-1 text-xs text-muted-foreground">
        <Badge variant="outline" className="mb-1">
          Metodologia
        </Badge>
        <p>
          Métricas calculadas de forma independente para cada candidato, no mesmo universo eleitoral (mesma
          eleição, cargo e território), com denominadores consistentes (doc 03 §9). "Diferenças territoriais"
          mostra os 15 municípios com a maior distância entre o 1º e o 2º colocado entre os candidatos
          comparados. Força relativa (QL) usa o mesmo limiar provisório do Diagnóstico.
        </p>
      </div>
    </div>
  )
}
