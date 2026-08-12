import { useParams } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useCandidato } from '@/hooks/useCandidato'
import { useResultadoCandidatoMunicipio } from '@/hooks/useResultadoCandidatoMunicipio'
import { NOMES_CARGO } from '@/types/domain'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

const FORMATO_NUMERO = new Intl.NumberFormat('pt-BR')
const TOP_MUNICIPIOS = 15

function CampoInfo({ rotulo, valor }: { rotulo: string; valor: string | null | undefined }) {
  if (!valor) return null
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{rotulo}</dt>
      <dd className="text-sm">{valor}</dd>
    </div>
  )
}

export function CandidatoPage() {
  const { sqCandidato } = useParams<{ sqCandidato: string }>()

  const { data: candidato, isLoading: carregandoCandidato } = useCandidato(sqCandidato!)
  const {
    data: resultadoMunicipios,
    isLoading: carregandoMunicipios,
    isError: erroMunicipios,
  } = useResultadoCandidatoMunicipio(sqCandidato!)

  const totalVotos = resultadoMunicipios?.reduce((soma, r) => soma + r.total_votos, 0) ?? 0
  const topMunicipios = resultadoMunicipios?.slice(0, TOP_MUNICIPIOS)

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-8">
      {carregandoCandidato ? (
        <Skeleton className="h-32" />
      ) : !candidato ? (
        <Alert variant="destructive">
          <AlertTitle>Candidato não encontrado</AlertTitle>
        </Alert>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="text-2xl">{candidato.nm_urna_candidato}</CardTitle>
              <Badge>{NOMES_CARGO[candidato.cargo]}</Badge>
            </div>
            <CardDescription>{candidato.nm_candidato}</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <CampoInfo
                rotulo="Partido"
                valor={`${candidato.sigla_partido} — ${candidato.nome_partido}`}
              />
              <CampoInfo rotulo="Número" valor={String(candidato.nr_candidato)} />
              <CampoInfo rotulo="Coligação" valor={candidato.nome_coligacao} />
              <CampoInfo rotulo="Situação da candidatura" valor={candidato.situacao_candidatura} />
              <CampoInfo rotulo="Situação de totalização" valor={candidato.situacao_totalizacao} />
              <CampoInfo rotulo="Gênero" valor={candidato.genero} />
              <CampoInfo rotulo="Grau de instrução" valor={candidato.grau_instrucao} />
              <CampoInfo rotulo="Ocupação" valor={candidato.ocupacao} />
            </dl>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Desempenho por município</CardTitle>
          <CardDescription>
            {totalVotos > 0 && `Total apurado: ${FORMATO_NUMERO.format(totalVotos)} votos`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {carregandoMunicipios && <Skeleton className="h-96" />}

          {erroMunicipios && (
            <Alert variant="destructive">
              <AlertTitle>Erro ao carregar resultado por município</AlertTitle>
            </Alert>
          )}

          {resultadoMunicipios && resultadoMunicipios.length === 0 && (
            <Alert>
              <AlertTitle>Sem dados</AlertTitle>
              <AlertDescription>Nenhum voto apurado para este candidato.</AlertDescription>
            </Alert>
          )}

          {topMunicipios && topMunicipios.length > 0 && (
            <ResponsiveContainer width="100%" height={Math.max(300, topMunicipios.length * 32)}>
              <BarChart data={topMunicipios} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => FORMATO_NUMERO.format(v)} />
                <YAxis
                  type="category"
                  dataKey="nome_municipio"
                  width={140}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip formatter={(v) => FORMATO_NUMERO.format(Number(v))} />
                <Bar dataKey="total_votos" fill="var(--color-primary, #2563eb)" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
