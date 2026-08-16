import { useQuery } from '@tanstack/react-query'
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet'
import type { Layer, PathOptions } from 'leaflet'
import type { Feature } from 'geojson'
import { corToken } from '@/lib/theme'
import { MAPTILER_ATTRIBUTION, MAPTILER_TILE_URL } from '@/lib/mapTiles'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import type { CandidatoComparativo } from '@/hooks/useComparativoCandidatos'

// Paleta qualitativa fixa (não é uma escala de intensidade) — cada
// candidato comparado recebe uma cor de identidade, na ordem em que
// entrou na comparação (principal primeiro). Reaproveita tokens
// semânticos já existentes só pelo contraste visual; aqui o
// significado é "candidato X", não a classificação territorial que
// esses tokens têm no Diagnóstico/Oportunidades.
const PALETA_TOKENS = ['--semantic-force', '--semantic-opportunity', '--semantic-consolidation', '--semantic-development']

interface MapaComparativoProps {
  candidatos: CandidatoComparativo[]
}

export function MapaComparativo({ candidatos }: MapaComparativoProps) {
  const { data: geojson, isLoading, isError } = useQuery({
    queryKey: ['geojson-municipios', 'PR'],
    queryFn: async () => {
      const resposta = await fetch('/geo/pr_municipios.geojson')
      if (!resposta.ok) throw new Error('Falha ao carregar limites geográficos')
      return resposta.json()
    },
    staleTime: Infinity,
  })

  if (isLoading) return <Skeleton className="h-[360px] w-full" />

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Erro ao carregar o mapa</AlertTitle>
        <AlertDescription>Não foi possível carregar os limites geográficos.</AlertDescription>
      </Alert>
    )
  }

  function candidatoLider(codigoMunicipio: number) {
    let lider: { candidato: CandidatoComparativo; votos: number } | null = null
    for (const candidato of candidatos) {
      const dado = candidato.porMunicipio.get(codigoMunicipio)
      if (dado && (!lider || dado.votos > lider.votos)) {
        lider = { candidato, votos: dado.votos }
      }
    }
    return lider
  }

  function estiloFeature(feature?: Feature): PathOptions {
    const codigo = feature ? Number(feature.properties?.codarea) : undefined
    const lider = codigo ? candidatoLider(codigo) : null

    if (!lider) {
      return { fillColor: corToken('--semantic-neutral'), fillOpacity: 0.25, color: '#ffffff', weight: 1 }
    }

    const indice = candidatos.findIndex((c) => c.sqCandidato === lider.candidato.sqCandidato)
    return {
      fillColor: corToken(PALETA_TOKENS[indice % PALETA_TOKENS.length]),
      fillOpacity: 0.65,
      color: '#ffffff',
      weight: 1,
    }
  }

  function aoCarregarFeature(feature: Feature, layer: Layer) {
    const codigo = Number(feature.properties?.codarea)
    const lider = candidatoLider(codigo)

    layer.bindTooltip(
      lider
        ? `<strong>${lider.candidato.nome}</strong> lidera<br/>${lider.votos.toLocaleString('pt-BR')} votos`
        : 'Sem votos apurados para os candidatos comparados'
    )
  }

  return (
    <div className="space-y-2">
      <MapContainer
        center={[-24.5, -51.5]}
        zoom={6}
        scrollWheelZoom={false}
        style={{ height: 360, width: '100%', borderRadius: 8 }}
      >
        <TileLayer attribution={MAPTILER_ATTRIBUTION} url={MAPTILER_TILE_URL} />
        {geojson && <GeoJSON data={geojson} style={estiloFeature} onEachFeature={aoCarregarFeature} />}
      </MapContainer>
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        {candidatos.map((c, indice) => (
          <span key={c.sqCandidato} className="flex items-center gap-1.5">
            <span
              className="size-3 rounded-sm"
              style={{ backgroundColor: `var(${PALETA_TOKENS[indice % PALETA_TOKENS.length]})` }}
            />
            {c.nome}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-semantic-neutral" /> Sem votos de nenhum comparado
        </span>
      </div>
    </div>
  )
}
