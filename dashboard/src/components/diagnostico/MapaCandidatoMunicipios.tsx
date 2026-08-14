import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet'
import type { Layer, PathOptions } from 'leaflet'
import type { Feature } from 'geojson'
import { useDominanciaCandidatoMunicipio } from '@/hooks/useDominanciaCandidatoMunicipio'
import { corToken } from '@/lib/theme'
import { MAPTILER_ATTRIBUTION, MAPTILER_TILE_URL } from '@/lib/mapTiles'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

function corPorPresenca(percentual: number | undefined): string {
  if (percentual === undefined) return corToken('--semantic-neutral')
  if (percentual >= 50) return corToken('--semantic-force')
  if (percentual >= 25) return corToken('--semantic-opportunity')
  return corToken('--semantic-low-presence')
}

interface MapaCandidatoMunicipiosProps {
  eleicaoId: string
  uf: string
  sqCandidato: string
}

// Mapa "Onde seus votos estão" do Diagnóstico (doc 02 §3, doc 06 §1)
// — diferente do MapaMunicipios (Visão Geral), que colore pelo
// candidato líder de cada município independente de quem seja, este
// colore pela presença do candidato do contexto especificamente,
// mesmo nos municípios onde ele não é o líder.
export function MapaCandidatoMunicipios({ eleicaoId, uf, sqCandidato }: MapaCandidatoMunicipiosProps) {
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

  const {
    data: presencas,
    isLoading: carregandoPresencas,
    isError: erroPresencas,
  } = useDominanciaCandidatoMunicipio(sqCandidato)

  if (carregandoGeo || carregandoPresencas) return <Skeleton className="h-[420px] w-full" />

  if (erroGeo || erroPresencas) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Erro ao carregar o mapa</AlertTitle>
        <AlertDescription>Não foi possível carregar os limites geográficos ou os resultados.</AlertDescription>
      </Alert>
    )
  }

  const presencaPorMunicipio = new Map(presencas?.map((p) => [p.codigo_municipio, p]))

  function estiloFeature(feature?: Feature): PathOptions {
    const codigo = feature ? Number(feature.properties?.codarea) : undefined
    const presenca = codigo ? presencaPorMunicipio.get(codigo) : undefined
    return {
      fillColor: corPorPresenca(presenca?.percentual_dominancia),
      fillOpacity: 0.75,
      color: '#ffffff',
      weight: 1,
    }
  }

  function aoCarregarFeature(feature: Feature, layer: Layer) {
    const codigo = Number(feature.properties?.codarea)
    const presenca = presencaPorMunicipio.get(codigo)

    layer.bindTooltip(
      presenca
        ? `<strong>${presenca.nome_municipio}</strong><br/>${presenca.qtde_votos.toLocaleString('pt-BR')} votos<br/>${presenca.percentual_dominancia.toFixed(1)}% do comparecimento`
        : 'Sem votos apurados'
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
        style={{ height: 420, width: '100%', borderRadius: 8 }}
      >
        <TileLayer attribution={MAPTILER_ATTRIBUTION} url={MAPTILER_TILE_URL} />
        {geojson && <GeoJSON data={geojson} style={estiloFeature} onEachFeature={aoCarregarFeature} />}
      </MapContainer>
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-semantic-force" /> Base forte (≥50%)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-semantic-opportunity" /> Presença moderada (25–50%)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-semantic-low-presence" /> Presença baixa (&lt;25%)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-semantic-neutral" /> Sem dados
        </span>
      </div>
    </div>
  )
}
