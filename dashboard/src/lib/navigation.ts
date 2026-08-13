import type { ComponentType } from 'react'
import {
  LayoutDashboard,
  Map,
  Star,
  TrendingUp,
  GitCompare,
  Users,
  LineChart,
  FileText,
  Settings,
} from 'lucide-react'

export interface ItemNavegacao {
  label: string
  // Rótulo mais curto para a barra inferior mobile (doc 04 §2: "Início"
  // em vez de "Visão Geral" para caber no espaço reduzido).
  labelMobile?: string
  to: string
  icone: ComponentType<{ className?: string }>
  badge?: string
}

// Ordem e destinos definidos no doc 04 §2. As rotas ainda sem tela
// real (Territórios, Oportunidades, Cenários, Candidatos, Pesquisas,
// Relatórios, Configurações) apontam para PlaceholderPage — mesmo
// padrão já usado por /dashboard/comparativo — até os épicos
// correspondentes do roadmap (docs/11) implementarem cada uma.
export const ITENS_NAVEGACAO: ItemNavegacao[] = [
  { label: 'Visão Geral', labelMobile: 'Início', to: '/dashboard', icone: LayoutDashboard },
  { label: 'Territórios', to: '/dashboard/territorios', icone: Map },
  { label: 'Oportunidades', to: '/dashboard/oportunidades', icone: Star },
  { label: 'Cenários', to: '/dashboard/cenarios', icone: TrendingUp },
  { label: 'Comparativo', to: '/dashboard/comparativo', icone: GitCompare },
  { label: 'Candidatos', to: '/dashboard/candidatos', icone: Users },
  { label: 'Pesquisas', to: '/dashboard/pesquisas', icone: LineChart, badge: 'Futuro' },
  { label: 'Relatórios', to: '/dashboard/relatorios', icone: FileText },
  { label: 'Configurações', to: '/dashboard/configuracoes', icone: Settings },
]

// Itens fixos da barra inferior mobile (doc 04 §2) — os 3 primeiros
// destinos "de exploração" + Cenários; o resto vive atrás de "Mais".
export const ITENS_NAVEGACAO_MOBILE_PRINCIPAIS = ITENS_NAVEGACAO.slice(0, 4)
export const ITENS_NAVEGACAO_MOBILE_MAIS = ITENS_NAVEGACAO.slice(4)
