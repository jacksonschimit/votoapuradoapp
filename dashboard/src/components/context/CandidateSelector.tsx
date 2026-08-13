import { useCandidatosDisponiveis } from '@/hooks/useCandidatosDisponiveis'
import type { Cargo } from '@/types/domain'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface CandidateSelectorProps {
  eleicaoId: number | null
  uf: string | null
  cargo: Cargo | null
  candidatoId: number | null
  onChange: (sqCandidato: number | null) => void
  className?: string
}

// Seletor do candidato principal do contexto analítico (doc 04 §3).
// Fica desabilitado até eleição+cargo estarem definidos — território
// (UF) só é obrigatório para cargos não-nacionais, ver
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

  return (
    <Select
      value={candidatoId ? String(candidatoId) : null}
      onValueChange={(valor) => onChange(valor ? Number(valor) : null)}
      disabled={!cargo || isLoading}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={isLoading ? 'Carregando...' : 'Candidato'} />
      </SelectTrigger>
      <SelectContent>
        {candidatos?.map((c) => (
          <SelectItem key={c.sqCandidato} value={String(c.sqCandidato)}>
            {c.nome} <span className="text-muted-foreground">({c.partido})</span>
          </SelectItem>
        ))}
        {candidatos?.length === 0 && (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">Nenhum candidato encontrado</div>
        )}
      </SelectContent>
    </Select>
  )
}
