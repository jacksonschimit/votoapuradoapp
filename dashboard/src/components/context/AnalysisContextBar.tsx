import { useEffect, useMemo } from 'react'
import { useEleicoes } from '@/hooks/useEleicoes'
import { useMinhasPermissoes } from '@/hooks/useMinhasPermissoes'
import { useAppStore } from '@/store/useAppStore'
import { CARGOS_POR_TIPO_ELEICAO, NOMES_CARGO, itensDeCargo, type Turno } from '@/types/domain'
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

// Fallback só porque hoje a única UF com dados carregados é o PR —
// mesmo critério já usado no SeletorEleicaoPage original (Etapa 2).
const UF_FALLBACK = 'PR'

// Barra de contexto persistente (doc 04 §3): Eleição, Turno, Cargo,
// Candidato, "+ Comparar" e Território (UF, por enquanto — o
// drill-down territorial completo continua vivendo nas rotas
// existentes) — hierarquicamente acima de qualquer filtro local de
// tela. A lista de cargos disponível reage ao tipo_eleicao da eleição
// selecionada (Geral x Municipal).
//
// Só é montada (no AppShell) nas rotas que não têm um fluxo de
// eleição próprio via URL, evitando dois seletores divergentes na
// mesma tela.
export function AnalysisContextBar({ habilitado }: AnalysisContextBarProps) {
  const { data: eleicoes } = useEleicoes(habilitado)
  const { data: permissoes } = useMinhasPermissoes(habilitado)
  const {
    eleicaoId,
    uf,
    turno,
    cargo,
    candidatoPrincipalId,
    candidatosComparacaoIds,
    setEleicao,
    setUf,
    setTurno,
    setCargo,
    setCandidatoPrincipal,
    adicionarCandidatoComparacao,
    removerCandidatoComparacao,
  } = useAppStore()

  const ufsDisponiveis = useMemo(() => {
    if (!permissoes) return []
    const siglas = permissoes.map((p) => p.sigla_uf).filter((s): s is string => !!s)
    return Array.from(new Set(siglas))
  }, [permissoes])

  // Preenche o território automaticamente quando só há uma UF no
  // escopo do usuário (ou nenhuma restrição, sigla_uf null = todas) —
  // mesmo comportamento que o SeletorEleicaoPage original tinha.
  useEffect(() => {
    if (uf || !permissoes) return
    if (ufsDisponiveis.length === 1) {
      setUf(ufsDisponiveis[0])
    } else if (ufsDisponiveis.length === 0) {
      setUf(UF_FALLBACK)
    }
  }, [uf, permissoes, ufsDisponiveis, setUf])

  if (!habilitado) return null

  const eleicaoSelecionada = eleicoes?.find((e) => e.id === eleicaoId)
  const cargosDisponiveis = CARGOS_POR_TIPO_ELEICAO[eleicaoSelecionada?.tipo_eleicao ?? 'GERAL']

  return (
    <div className="flex flex-wrap items-center gap-2 border-b bg-muted/30 px-3 py-2 sm:px-4">
      <Select
        value={eleicaoId ? String(eleicaoId) : null}
        onValueChange={(valor) => setEleicao(valor ? Number(valor) : null)}
        items={Object.fromEntries((eleicoes ?? []).map((e) => [String(e.id), String(e.ano)]))}
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
        items={{ '1': '1º Turno', '2': '2º Turno' }}
      >
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Turno" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">1º Turno</SelectItem>
          <SelectItem value="2">2º Turno</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={cargo}
        onValueChange={(valor) => setCargo(valor as typeof cargo)}
        disabled={!eleicaoId}
        items={itensDeCargo(cargosDisponiveis)}
      >
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

      {ufsDisponiveis.length > 1 && (
        <Select
          value={uf}
          onValueChange={(valor) => setUf(valor)}
          items={Object.fromEntries(ufsDisponiveis.map((s) => [s, s]))}
        >
          <SelectTrigger className="w-24">
            <SelectValue placeholder="UF" />
          </SelectTrigger>
          <SelectContent>
            {ufsDisponiveis.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  )
}
