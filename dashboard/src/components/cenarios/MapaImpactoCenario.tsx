import { useQuery } from '@tanstack/react-query'
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet'
import type { Layer, PathOptions } from 'leaflet'
import type { Feature } from 'geojson'
import { corToken } from '@/lib/theme'
import { MAPTILER_ATTRIBUTION, MAPTILER_TILE_URL } from '@/lib/mapTiles'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

const FORMATO_NUMERO = new Intl.NumberFormat('pt-BR')

export interface ImpactoMunicipio {
  codigo_municipio: number
  nome_municipio: string
  ganhoCenario: number
}

interface MapaImpactoCenarioProps {
  impactos: ImpactoMunicipio[]
}

// "Ver impacto no mapa" do Simulador de Cenários (doc 06 §4) — colore
// só os territórios incluídos no cenário, pela intensidade do ganho
// simulado. Territórios fora do cenário ficam neutros: o mapa mostra
// o que foi simulado, não uma inferência sobre o resto do estado.
export function MapaImpactoCenario({ impactos }: MapaImpactoCenarioProps) {
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

  const impactoPorMunicipio = new Map(impactos.map((i) => [i.codigo_municipio, i]))
  const ganhoMaximo = Math.max(1, ...impactos.map((i) => i.ganhoCenario))

  function estiloFeature(feature?: Feature): PathOptions {
    const codigo = feature ? Number(feature.properties?.codarea) : undefined
    const impacto = codigo ? impactoPorMunicipio.get(codigo) : undefined

    if (!impacto || impacto.ganhoCenario <= 0) {
      return { fillColor: corToken('--semantic-neutral'), fillOpacity: 0.25, color: '#ffffff', weight: 1 }
    }

    return {
      fillColor: corToken('--semantic-opportunity'),
      fillOpacity: 0.3 + 0.6 * (impacto.ganhoCenario / ganhoMaximo),
      color: '#ffffff',
      weight: 1,
    }
  }

  function aoCarregarFeature(feature: Feature, layer: Layer) {
    const codigo = Number(feature.properties?.codarea)
    const impacto = impactoPorMunicipio.get(codigo)

    layer.bindTooltip(
      impacto
        ? `<strong>${impacto.nome_municipio}</strong><br/>Ganho no cenário: ${impacto.ganhoCenario >= 0 ? '+' : ''}${FORMATO_NUMERO.format(Math.round(impacto.ganhoCenario))} votos`
        : 'Fora do cenário simulado'
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
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-semantic-opportunity" /> Ganho simulado (mais escuro = maior)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-semantic-neutral" /> Sem ganho ou fora do cenário
        </span>
      </div>
    </div>
  )
}
