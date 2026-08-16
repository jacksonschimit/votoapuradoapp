import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useCandidatosDisponiveis } from '@/hooks/useCandidatosDisponiveis'
import type { Cargo } from '@/types/domain'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface CandidateCompareSelectorProps {
  eleicaoId: number | null
  uf: string | null
  cargo: Cargo | null
  candidatoPrincipalId: number | null
  candidatosComparacaoIds: number[]
  onAdicionar: (sqCandidato: number) => void
  onRemover: (sqCandidato: number) => void
}

// Máximo de candidatos em comparação simultânea (além do principal) —
// doc 11 critério de aceite do Épico 6 "sem poluição visual": acima
// disso, cards/tabela/mapa comparativo ficam ilegíveis.
const MAXIMO_CANDIDATOS_COMPARACAO = 3

// Ação "+ Comparar candidato" (doc 02 §8, doc 04 §8): busca e inclui
// candidatos compatíveis (mesma eleição/cargo) no modo comparativo,
// exibidos como chips removíveis no context bar.
export function CandidateCompareSelector({
  eleicaoId,
  uf,
  cargo,
  candidatoPrincipalId,
  candidatosComparacaoIds,
  onAdicionar,
  onRemover,
}: CandidateCompareSelectorProps) {
  const [busca, setBusca] = useState('')
  const [aberto, setAberto] = useState(false)
  const { data: candidatos } = useCandidatosDisponiveis(eleicaoId, uf, cargo)

  const nomePorId = new Map(candidatos?.map((c) => [c.sqCandidato, c.nome]))

  const disponiveis = candidatos?.filter(
    (c) =>
      c.sqCandidato !== candidatoPrincipalId &&
      !candidatosComparacaoIds.includes(c.sqCandidato) &&
      c.nome.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {candidatosComparacaoIds.map((id) => (
        <Badge key={id} variant="secondary" className="gap-1 pr-1">
          {nomePorId.get(id) ?? `#${id}`}
          <button
            type="button"
            onClick={() => onRemover(id)}
            className="rounded-full p-0.5 hover:bg-muted-foreground/20"
            aria-label="Remover da comparação"
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}

      <Popover open={aberto} onOpenChange={setAberto}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              disabled={!cargo || !candidatoPrincipalId || candidatosComparacaoIds.length >= MAXIMO_CANDIDATOS_COMPARACAO}
              title={
                candidatosComparacaoIds.length >= MAXIMO_CANDIDATOS_COMPARACAO
                  ? `Máximo de ${MAXIMO_CANDIDATOS_COMPARACAO} candidatos em comparação`
                  : undefined
              }
            >
              <Plus />
              Comparar
            </Button>
          }
        />
        <PopoverContent align="start" className="w-64 p-2">
          <Input
            placeholder="Buscar candidato..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="mb-2"
            autoFocus
          />
          <div className="max-h-56 overflow-y-auto">
            {disponiveis?.map((c) => (
              <button
                key={c.sqCandidato}
                type="button"
                onClick={() => {
                  onAdicionar(c.sqCandidato)
                  setBusca('')
                  setAberto(false)
                }}
                className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
              >
                <span>{c.nome}</span>
                <span className="text-muted-foreground">{c.partido}</span>
              </button>
            ))}
            {disponiveis?.length === 0 && (
              <p className="px-2 py-1.5 text-sm text-muted-foreground">Nenhum candidato compatível encontrado</p>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
