import { useNavigate } from 'react-router-dom'
import { CircleMarker, MapContainer, TileLayer, Tooltip } from 'react-leaflet'
import { corCalor, corToken } from '@/lib/theme'
import { MAPTILER_ATTRIBUTION, MAPTILER_TILE_URL } from '@/lib/mapTiles'
import { EmptyState } from '@/components/states/EmptyState'

const FORMATO_NUMERO = new Intl.NumberFormat('pt-BR')
const RAIO_MIN = 7
const RAIO_MAX = 24
const RAIO_SEM_VOTOS = 5

export interface PontoCalorLocal {
  localVotacaoId: number
  latitude: number
  longitude: number
  votos: number
  nomeLocal: string
  endereco: string | null
  codigoLocalTse: number
  numeroZona: number
  zonaId: number
}

interface MapaCalorIntraCidadeProps {
  pontos: PontoCalorLocal[]
  totalLocais: number
  eleicaoId: string
  uf: string
  codigoIbge: string
}

// Marcadores por local de votação DENTRO do município (feedback de
// produto, 2026-08-17): raio proporcional à raiz quadrada dos votos
// (área do círculo ~ proporcional ao valor, mais honesto que raio
// linear) + cor no mesmo gradiente de calor do mapa por município do
// Diagnóstico (corCalor). CircleMarker usa raio em pixels — ao
// contrário de Circle (raio em metros), continua legível com o mapa
// afastado, sem precisar aproximar até nível de rua.
//
// Locais com 0 votos (feedback de produto, 2026-08-17): em vez de
// preencher com cinza sólido, usa um círculo VAZADO (só contorno) —
// a ponta mais clara do gradiente de calor já é bem perto de cinza em
// municípios de poucos votos, então um cinza preenchido arriscava se
// confundir com "poucos votos". Vazado nunca se confunde com uma
// bolha preenchida, em qualquer escala.
export function MapaCalorIntraCidade({ pontos, totalLocais, eleicaoId, uf, codigoIbge }: MapaCalorIntraCidadeProps) {
  const navigate = useNavigate()

  if (pontos.length === 0) {
    return (
      <EmptyState
        titulo="Sem locais geocodificados"
        descricao="Nenhum local de votação deste município tem coordenada disponível ainda — a geocodificação cobre parte dos endereços do TSE."
      />
    )
  }

  const votosMaximo = Math.max(1, ...pontos.map((p) => p.votos))
  const centroLat = pontos.reduce((soma, p) => soma + p.latitude, 0) / pontos.length
  const centroLng = pontos.reduce((soma, p) => soma + p.longitude, 0) / pontos.length

  function raioBolha(votos: number): number {
    const intensidade = Math.sqrt(votos / votosMaximo)
    return RAIO_MIN + intensidade * (RAIO_MAX - RAIO_MIN)
  }

  return (
    <div className="space-y-2">
      <MapContainer
        center={[centroLat, centroLng]}
        zoom={13}
        scrollWheelZoom={false}
        style={{ height: 420, width: '100%', borderRadius: 8 }}
      >
        <TileLayer attribution={MAPTILER_ATTRIBUTION} url={MAPTILER_TILE_URL} />
        {pontos.map((ponto) => {
          const semVotos = ponto.votos === 0
          return (
            <CircleMarker
              key={ponto.localVotacaoId}
              center={[ponto.latitude, ponto.longitude]}
              radius={semVotos ? RAIO_SEM_VOTOS : raioBolha(ponto.votos)}
              pathOptions={
                semVotos
                  ? { fillOpacity: 0, color: corToken('--semantic-neutral'), weight: 1.5, opacity: 0.7 }
                  : { fillColor: corCalor(ponto.votos / votosMaximo), fillOpacity: 0.85, color: '#ffffff', weight: 1.5 }
              }
              eventHandlers={{
                click: () =>
                  navigate(`/dashboard/${eleicaoId}/${uf}/municipio/${codigoIbge}/zona/${ponto.zonaId}/local/${ponto.localVotacaoId}`),
              }}
            >
              <Tooltip direction="top" offset={[0, -4]}>
                <div className="space-y-0.5 text-xs">
                  <p className="font-medium">{ponto.nomeLocal}</p>
                  {ponto.endereco && <p>{ponto.endereco}</p>}
                  <p>
                    Zona {ponto.numeroZona} · Local {ponto.codigoLocalTse}
                  </p>
                  <p className="font-medium">
                    {semVotos ? 'Nenhum voto do candidato' : `${FORMATO_NUMERO.format(ponto.votos)} votos`}
                  </p>
                </div>
              </Tooltip>
            </CircleMarker>
          )
        })}
      </MapContainer>
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-full" style={{ backgroundColor: corCalor(0.7) }} /> Com votos (tamanho e
          cor = volume)
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="size-3 rounded-full"
            style={{ border: `1.5px solid ${corToken('--semantic-neutral')}` }}
          />
          Nenhum voto do candidato
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        {pontos.length} de {totalLocais} locais de votação com localização disponível.
      </p>
    </div>
  )
}
