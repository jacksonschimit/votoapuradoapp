// Provedor de tiles do mapa coroplético — MapTiler, estilo "dataviz"
// (desenhado pelo próprio MapTiler para sobreposição de dado
// colorido, sem competir visualmente com o preenchimento). Troca o
// OpenStreetMap público usado até aqui (TSE_APP_ARCHITECTURE.md §7 —
// tile lento e visual genérico). Reaproveitado por todo componente de
// mapa; nunca duplicar a URL/chave em cada componente.
const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY as string | undefined

export const MAPTILER_TILE_URL = MAPTILER_KEY
  ? `https://api.maptiler.com/maps/dataviz/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`
  : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

export const MAPTILER_ATTRIBUTION = MAPTILER_KEY
  ? '&copy; <a href="https://www.maptiler.com/copyright/" target="_blank">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
