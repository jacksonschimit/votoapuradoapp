import { useCandidatosDisponiveis } from '@/hooks/useCandidatosDisponiveis'
import type { Cargo } from '@/types/domain'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox'

interface CandidateSelectorProps {
  eleicaoId: number | null
  uf: string | null
  cargo: Cargo | null
  candidatoId: number | null
  onChange: (sqCandidato: number | null) => void
  className?: string
}

interface ItemCandidato {
  value: number
  label: string
}

// Seletor do candidato principal do contexto analítico (doc 04 §3).
// Usa Combobox (busca por texto) em vez de Select — cargos como
// Deputado Federal/Estadual chegam a 900+ candidatos, inviável de
// navegar só rolando uma lista (feedback do usuário testando em
// produção). Fica desabilitado até eleição+cargo estarem definidos —
// território (UF) só é obrigatório para cargos não-nacionais, ver
// useCandidatosDisponiveis.
export function CandidateSelector({
  eleicaoId,
  uf,
  cargo,
  candidatoId,
  onChange,
  className,
}: CandidateSelectorProps) {
  const { data: candidatos, isLoading } = useCandidatosDisponiveis(eleicaoId, uf, cargo)

  const itens: ItemCandidato[] = (candidatos ?? []).map((c) => ({
    value: c.sqCandidato,
    label: `${c.nome} (${c.partido})`,
  }))
  const selecionado = itens.find((item) => item.value === candidatoId) ?? null

  return (
    <Combobox
      items={itens}
      value={selecionado}
      onValueChange={(item) => onChange(item ? item.value : null)}
      isItemEqualToValue={(a, b) => a.value === b.value}
      disabled={!cargo || isLoading}
    >
      <ComboboxInput placeholder={isLoading ? 'Carregando...' : 'Buscar candidato...'} className={className} />
      <ComboboxContent>
        <ComboboxEmpty>Nenhum candidato encontrado</ComboboxEmpty>
        <ComboboxList>{(item: ItemCandidato) => <ComboboxItem key={item.value} value={item}>{item.label}</ComboboxItem>}</ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
