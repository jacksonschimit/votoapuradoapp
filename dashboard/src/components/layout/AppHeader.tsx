import { Link, useNavigate, useParams } from 'react-router-dom'
import { useSession } from '@/hooks/useSession'
import { useEleicoes } from '@/hooks/useEleicoes'
import { supabase } from '@/lib/supabase'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Cabeçalho persistente com o "seletor secundário" de eleição
// descrito na Seção 4.3 — visível sempre que a navegação já tiver
// um eleicaoId/uf no contexto, permitindo trocar de ciclo sem sair
// da UF atual.
export function AppHeader() {
  const { session } = useSession()
  const navigate = useNavigate()
  const params = useParams<{ eleicaoId?: string; uf?: string }>()
  const { data: eleicoes } = useEleicoes(!!session)

  const mostrarSeletorEleicao = !!params.eleicaoId && !!params.uf

  function trocarEleicao(novoId: string | null) {
    if (!novoId || !params.uf) return
    navigate(`/dashboard/${novoId}/${params.uf}`)
  }

  async function sair() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <header className="flex items-center justify-between gap-2 border-b px-3 py-3 sm:gap-4 sm:px-4">
      <Link to="/dashboard" className="shrink-0 text-sm font-semibold sm:text-base">
        VotoApurado
      </Link>

      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        {mostrarSeletorEleicao && eleicoes && eleicoes.length > 0 && (
          <Select value={params.eleicaoId} onValueChange={trocarEleicao}>
            <SelectTrigger className="w-32 sm:w-56">
              <SelectValue placeholder="Eleição" />
            </SelectTrigger>
            <SelectContent>
              {eleicoes.map((eleicao) => (
                <SelectItem key={eleicao.id} value={String(eleicao.id)}>
                  {eleicao.descricao}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {session ? (
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {session.user.email}
            </span>
            <Button variant="ghost" size="sm" onClick={sair}>
              Sair
            </Button>
          </div>
        ) : (
          <Link to="/login" className={buttonVariants({ size: 'sm' })}>
            Entrar
          </Link>
        )}
      </div>
    </header>
  )
}
