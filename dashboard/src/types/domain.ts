export interface Eleicao {
  id: number
  ano: number
  tipo_eleicao: 'GERAL' | 'MUNICIPAL'
  turno: number
  descricao: string
  data_pleito: string | null
  ativa_para_import: boolean
  criado_em: string
}

export interface UsuarioPermissao {
  id: number
  user_id: string
  sigla_uf: string | null
  eleicao_id: number | null
  papel: 'cliente' | 'admin'
  concedido_em: string
  concedido_por: string | null
}

export const CARGOS = [
  'GOVERNADOR',
  'SENADOR',
  'DEPUTADO FEDERAL',
  'DEPUTADO ESTADUAL',
] as const

export type Cargo = (typeof CARGOS)[number]

export const NOMES_CARGO: Record<Cargo, string> = {
  GOVERNADOR: 'Governador',
  SENADOR: 'Senador',
  'DEPUTADO FEDERAL': 'Deputado Federal',
  'DEPUTADO ESTADUAL': 'Deputado Estadual',
}

export interface EleitoradoUf {
  eleicao_id: number
  sigla_uf: string
  qtde_aptos: number
  qtde_comparecimento: number
  qtde_abstencoes: number
  qtde_votos_brancos: number
  qtde_votos_nulos: number
  qtde_municipios_apurados: number
}

export interface ResultadoCandidatoUf {
  eleicao_id: number
  sq_candidato: number
  nm_urna_candidato: string
  sigla_partido: string
  cargo: Cargo
  sigla_uf: string
  total_votos_estado: number
}

export interface Municipio {
  codigo_ibge: number
  codigo_tse: number
  nome_municipio: string
  sigla_uf: string
  capital: boolean
}

export interface ZonaEleitoral {
  id: number
  numero_zona: number
  codigo_municipio: number
  sigla_uf: string
}

export interface EleitoradoMunicipio {
  eleicao_id: number
  codigo_municipio: number
  sigla_uf: string
  qtde_aptos: number
  qtde_comparecimento: number
  qtde_abstencoes: number
  qtde_votos_brancos: number
  qtde_votos_nulos: number
}

export interface EleitoradoZona {
  eleicao_id: number
  zona_id: number
  qtde_aptos: number
  qtde_comparecimento: number
  qtde_abstencoes: number
  qtde_votos_brancos: number
  qtde_votos_nulos: number
}

export interface EleitoradoLocal {
  eleicao_id: number
  local_votacao_id: number
  qtde_aptos: number
  qtde_comparecimento: number
  qtde_abstencoes: number
  qtde_votos_brancos: number
  qtde_votos_nulos: number
}

export interface LocalVotacao {
  id: number
  eleicao_id: number
  codigo_local_tse: number
  nome_local: string
  endereco: string | null
  bairro: string | null
  cep: string | null
  zona_id: number
  codigo_municipio: number
  sigla_uf: string
  latitude: number | null
  longitude: number | null
}

export interface SecaoEleitoral {
  id: number
  eleicao_id: number
  numero_secao: number
  local_votacao_id: number
  zona_id: number
  codigo_municipio: number
  sigla_uf: string
}

// Formato normalizado usado por todas as tabelas de ranking de
// candidatos (Estado/Zona/Local/Seção), independente da view de
// origem.
export interface LinhaRanking {
  sqCandidato: number
  nome: string
  partido: string
  cargo: Cargo
  votos: number
  percentual: number | null
}

export interface DominanciaZona {
  eleicao_id: number
  zona_id: number
  numero_zona: number
  sq_candidato: number
  nm_urna_candidato: string
  sigla_partido: string
  cargo: Cargo
  qtde_votos: number
  qtde_comparecimento: number
  percentual_dominancia: number
}

export interface DominanciaLocal {
  eleicao_id: number
  local_votacao_id: number
  nome_local: string
  endereco: string | null
  sq_candidato: number
  nm_urna_candidato: string
  sigla_partido: string
  cargo: Cargo
  qtde_votos: number
  qtde_comparecimento: number
  percentual_dominancia: number
}

export interface DominanciaSecao {
  eleicao_id: number
  secao_id: number
  sq_candidato: number
  nm_urna_candidato: string
  sigla_partido: string
  cargo: Cargo
  qtde_votos: number
  qtde_comparecimento: number
  percentual_dominancia: number
}

export interface DominanciaMunicipio {
  eleicao_id: number
  codigo_municipio: number
  nome_municipio: string
  sigla_uf: string
  sq_candidato: number
  nm_urna_candidato: string
  sigla_partido: string
  cargo: Cargo
  qtde_votos: number
  qtde_comparecimento: number
  percentual_dominancia: number
}

export interface Candidato {
  sq_candidato: number
  eleicao_id: number
  nr_candidato: number
  nm_candidato: string
  nm_urna_candidato: string
  nm_social_candidato: string | null
  cargo: Cargo
  sigla_uf: string
  codigo_municipio: number | null
  sigla_partido: string
  nome_partido: string
  numero_partido: number
  sigla_coligacao: string | null
  nome_coligacao: string | null
  situacao_candidatura: string | null
  situacao_totalizacao: string | null
  genero: string | null
  grau_instrucao: string | null
  ocupacao: string | null
  idade_posse: number | null
  foto_url: string | null
}

export interface ResultadoCandidatoMunicipio {
  eleicao_id: number
  ano: number
  tipo_eleicao: 'GERAL' | 'MUNICIPAL'
  sq_candidato: number
  nm_urna_candidato: string
  sigla_partido: string
  cargo: Cargo
  sigla_uf: string
  codigo_municipio: number
  nome_municipio: string
  total_votos: number
}
