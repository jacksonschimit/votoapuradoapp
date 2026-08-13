import { useEleicoes } from '@/hooks/useEleicoes'
import { useAppStore } from '@/store/useAppStore'
import { CARGOS_POR_TIPO_ELEICAO, NOMES_CARGO, type Turno } from '@/types/domain'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CandidateSelector } from './CandidateSelector'
import { CandidateCompareSelector } from './CandidateCompareSelector'

interface AnalysisContextBarProps {
  habilitado: boolean
}

// Barra de contexto persistente (doc 04 §3): Eleição, Turno, Cargo,
// Candidato e "+ Comparar" — hierarquicamente acima de qualquer
// filtro local de tela. A lista de cargos disponível reage ao
// tipo_eleicao da eleição selecionada (Geral x Municipal).
//
// Território ainda não integra esta barra — ver nota em useAppStore.
// Por isso ela só é montada (no AppShell) nas rotas que não têm um
// fluxo de eleição próprio via URL, evitando dois seletores de
// eleição divergentes na mesma tela.
export function AnalysisContextBar({ habilitado }: AnalysisContextBarProps) {
  const { data: eleicoes } = useEleicoes(habilitado)
  const {
    eleicaoId,
    uf,
    turno,
    cargo,
    candidatoPrincipalId,
    candidatosComparacaoIds,
    setEleicao,
    setTurno,
    setCargo,
    setCandidatoPrincipal,
    adicionarCandidatoComparacao,
    removerCandidatoComparacao,
  } = useAppStore()

  if (!habilitado) return null

  const eleicaoSelecionada = eleicoes?.find((e) => e.id === eleicaoId)
  const cargosDisponiveis = CARGOS_POR_TIPO_ELEICAO[eleicaoSelecionada?.tipo_eleicao ?? 'GERAL']

  return (
    <div className="flex flex-wrap items-center gap-2 border-b bg-muted/30 px-3 py-2 sm:px-4">
      <Select
        value={eleicaoId ? String(eleicaoId) : null}
        onValueChange={(valor) => setEleicao(valor ? Number(valor) : null)}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Eleição" />
        </SelectTrigger>
        <SelectContent>
          {eleicoes?.map((e) => (
            <SelectItem key={e.id} value={String(e.id)}>
              {e.ano}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={turno ? String(turno) : null}
        onValueChange={(valor) => setTurno(valor ? (Number(valor) as Turno) : null)}
        disabled={!eleicaoId}
      >
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Turno" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">1º Turno</SelectItem>
          <SelectItem value="2">2º Turno</SelectItem>
        </SelectContent>
      </Select>

      <Select value={cargo} onValueChange={(valor) => setCargo(valor as typeof cargo)} disabled={!eleicaoId}>
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Cargo" />
        </SelectTrigger>
        <SelectContent>
          {cargosDisponiveis.map((c) => (
            <SelectItem key={c} value={c}>
              {NOMES_CARGO[c]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <CandidateSelector
        eleicaoId={eleicaoId}
        uf={uf}
        cargo={cargo}
        candidatoId={candidatoPrincipalId}
        onChange={setCandidatoPrincipal}
        className="w-52"
      />

      <CandidateCompareSelector
        eleicaoId={eleicaoId}
        uf={uf}
        cargo={cargo}
        candidatoPrincipalId={candidatoPrincipalId}
        candidatosComparacaoIds={candidatosComparacaoIds}
        onAdicionar={adicionarCandidatoComparacao}
        onRemover={removerCandidatoComparacao}
      />
    </div>
  )
}
