import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet'
import type { Layer, PathOptions } from 'leaflet'
import type { Feature } from 'geojson'
import { useDominanciaMunicipios, type LiderMunicipio } from '@/hooks/useDominanciaMunicipios'
import type { Cargo } from '@/types/domain'
import { MAPTILER_ATTRIBUTION, MAPTILER_TILE_URL } from '@/lib/mapTiles'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

const COR_SEM_DADOS = '#d4d4d8'
const COR_CURRAL = '#16a34a' // >= 50% — dominância consolidada
const COR_DISPUTADO = '#eab308' // 35–50% — disputado
const COR_FRAGMENTADO = '#dc2626' // < 35% — voto fragmentado

function corPorDominancia(percentual: number | undefined): string {
  if (percentual === undefined) return COR_SEM_DADOS
  if (percentual >= 50) return COR_CURRAL
  if (percentual >= 35) return COR_DISPUTADO
  return COR_FRAGMENTADO
}

interface MapaMunicipiosProps {
  eleicaoId: string
  uf: string
  cargo: Cargo
}

export function MapaMunicipios({ eleicaoId, uf, cargo }: MapaMunicipiosProps) {
  const navigate = useNavigate()

  const { data: geojson, isLoading: carregandoGeo, isError: erroGeo } = useQuery({
    queryKey: ['geojson-municipios', uf],
    queryFn: async () => {
      const resposta = await fetch('/geo/pr_municipios.geojson')
      if (!resposta.ok) throw new Error('Falha ao carregar limites geográficos')
      return resposta.json()
    },
    staleTime: Infinity,
  })

  const { data: lideres, isLoading: carregandoLideres, isError: erroLideres } =
    useDominanciaMunicipios(eleicaoId, uf, cargo)

  if (carregandoGeo || carregandoLideres) return <Skeleton className="h-[500px] w-full" />

  if (erroGeo || erroLideres) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Erro ao carregar o mapa</AlertTitle>
        <AlertDescription>Não foi possível carregar os limites geográficos ou os resultados.</AlertDescription>
      </Alert>
    )
  }

  function estiloFeature(feature?: Feature): PathOptions {
    const codigo = feature ? Number(feature.properties?.codarea) : undefined
    const lider = codigo ? lideres?.get(codigo) : undefined
    return {
      fillColor: corPorDominancia(lider?.percentualDominancia),
      fillOpacity: 0.75,
      color: '#ffffff',
      weight: 1,
    }
  }

  function aoCarregarFeature(feature: Feature, layer: Layer) {
    const codigo = Number(feature.properties?.codarea)
    const lider: LiderMunicipio | undefined = lideres?.get(codigo)

    layer.bindTooltip(
      lider
        ? `<strong>${lider.nomeMunicipio}</strong><br/>${lider.nomeCandidato} (${lider.siglaPartido})<br/>${lider.percentualDominancia.toFixed(1)}% de dominância`
        : `Sem dados`,
    )

    layer.on('click', () => {
      navigate(`/dashboard/${eleicaoId}/${uf}/municipio/${codigo}`)
    })
  }

  return (
    <div className="space-y-2">
      <MapContainer
        center={[-24.5, -51.5]}
        zoom={6}
        scrollWheelZoom={false}
        style={{ height: 500, width: '100%', borderRadius: 8 }}
      >
        <TileLayer attribution={MAPTILER_ATTRIBUTION} url={MAPTILER_TILE_URL} />
        {geojson && (
          <GeoJSON key={cargo} data={geojson} style={estiloFeature} onEachFeature={aoCarregarFeature} />
        )}
      </MapContainer>
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm" style={{ background: COR_CURRAL }} /> Curral consolidado (≥50%)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm" style={{ background: COR_DISPUTADO }} /> Disputado (35–50%)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm" style={{ background: COR_FRAGMENTADO }} /> Voto fragmentado (&lt;35%)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm" style={{ background: COR_SEM_DADOS }} /> Sem dados
        </span>
      </div>
    </div>
  )
}
