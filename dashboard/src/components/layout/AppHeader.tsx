import { Link, useNavigate, useParams } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useSession } from '@/hooks/useSession'
import { useEleicoes } from '@/hooks/useEleicoes'
import { supabase } from '@/lib/supabase'
import { Button, buttonVariants } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Barra superior: em desktop, a marca já aparece no topo da
// SidebarNavigation, então aqui ela só reaparece em telas menores
// (abaixo do breakpoint lg, onde a sidebar vira MobileBottomNavigation).
// O "seletor secundário" de eleição (Seção 4.3) continua igual —
// visível sempre que a navegação já tiver um eleicaoId/uf no contexto.
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

  const iniciais = session?.user.email?.slice(0, 2).toUpperCase() ?? '?'

  return (
    <header className="flex items-center justify-between gap-2 border-b px-3 py-3 sm:gap-4 sm:px-4">
      <Link to="/dashboard" className="shrink-0 text-sm font-semibold sm:text-base lg:hidden">
        VotoApurado
      </Link>

      <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-3">
        {mostrarSeletorEleicao && eleicoes && eleicoes.length > 0 && (
          <Select
            value={params.eleicaoId}
            onValueChange={trocarEleicao}
            items={Object.fromEntries(eleicoes.map((e) => [String(e.id), e.descricao]))}
          >
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
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="size-7">
                    <AvatarFallback className="text-xs">{iniciais}</AvatarFallback>
                  </Avatar>
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="max-w-48 truncate font-normal text-muted-foreground">
                  {session.user.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={sair}>
                  <LogOut />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link to="/login" className={buttonVariants({ size: 'sm' })}>
            Entrar
          </Link>
        )}
      </div>
    </header>
  )
}
