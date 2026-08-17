import { useEffect } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.heat'
import { MAPTILER_ATTRIBUTION, MAPTILER_TILE_URL } from '@/lib/mapTiles'
import { EmptyState } from '@/components/states/EmptyState'

export interface PontoCalorLocal {
  latitude: number
  longitude: number
  votos: number
  nomeLocal: string
}

interface CamadaCalorProps {
  pontos: PontoCalorLocal[]
}

// Camada de calor imperativa (leaflet.heat não tem wrapper react-leaflet
// oficial) — adiciona/remove do mapa via useMap(), fora do ciclo de
// render do React.
function CamadaCalor({ pontos }: CamadaCalorProps) {
  const map = useMap()

  useEffect(() => {
    if (pontos.length === 0) return undefined

    const pesoMaximo = Math.max(1, ...pontos.map((p) => p.votos))
    const camada = L.heatLayer(
      pontos.map((p) => [p.latitude, p.longitude, p.votos / pesoMaximo]),
      { radius: 30, blur: 22, maxZoom: 17, max: 1 }
    )
    camada.addTo(map)

    const limites = L.latLngBounds(pontos.map((p) => [p.latitude, p.longitude]))
    map.fitBounds(limites, { padding: [24, 24] })

    return () => {
      camada.remove()
    }
  }, [map, pontos])

  return null
}

interface MapaCalorIntraCidadeProps {
  pontos: PontoCalorLocal[]
  totalLocais: number
}

// Mapa de calor DENTRO do município, por local de votação (feedback
// de produto, 2026-08-17) — diferente do mapa por município do
// Diagnóstico, este usa pontos geocodificados (endereço do local),
// não polígonos. Cobertura parcial: só locais com coordenada
// resolvida aparecem (ver importador/geocode_locais_votacao.py).
export function MapaCalorIntraCidade({ pontos, totalLocais }: MapaCalorIntraCidadeProps) {
  if (pontos.length === 0) {
    return (
      <EmptyState
        titulo="Sem locais geocodificados"
        descricao="Nenhum local de votação deste município tem coordenada disponível ainda — a geocodificação cobre parte dos endereços do TSE."
      />
    )
  }

  const centroLat = pontos.reduce((soma, p) => soma + p.latitude, 0) / pontos.length
  const centroLng = pontos.reduce((soma, p) => soma + p.longitude, 0) / pontos.length

  return (
    <div className="space-y-2">
      <MapContainer
        center={[centroLat, centroLng]}
        zoom={13}
        scrollWheelZoom={false}
        style={{ height: 360, width: '100%', borderRadius: 8 }}
      >
        <TileLayer attribution={MAPTILER_ATTRIBUTION} url={MAPTILER_TILE_URL} />
        <CamadaCalor pontos={pontos} />
      </MapContainer>
      <p className="text-xs text-muted-foreground">
        {pontos.length} de {totalLocais} locais de votação com localização disponível.
      </p>
    </div>
  )
}
