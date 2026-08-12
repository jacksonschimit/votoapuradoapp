import { useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useSession } from '@/hooks/useSession'
import { useEleicoes } from '@/hooks/useEleicoes'
import { useMinhasPermissoes } from '@/hooks/useMinhasPermissoes'
import { useAppStore } from '@/store/useAppStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import type { Eleicao } from '@/types/domain'

// Fallback só porque hoje a única UF com dados carregados é o PR
// (ver Etapa 2). Some junto com o backoffice quando houver
// concessão de escopo "todas as UFs" (sigla_uf null) de verdade.
const UF_FALLBACK = 'PR'

export function SeletorEleicaoPage() {
  const navigate = useNavigate()
  const { session, carregando: carregandoSessao } = useSession()
  const setEleicao = useAppStore((s) => s.setEleicao)
  const setUf = useAppStore((s) => s.setUf)

  const {
    data: permissoes,
    isLoading: carregandoPermissoes,
  } = useMinhasPermissoes(!!session)

  const {
    data: eleicoes,
    isLoading: carregandoEleicoes,
    isError: erroEleicoes,
  } = useEleicoes(!!session && !!permissoes?.length)

  const [eleicaoEscolhida, setEleicaoEscolhida] = useState<Eleicao | null>(null)

  const ufsDisponiveis = useMemo(() => {
    if (!permissoes) return []
    const siglas = permissoes.map((p) => p.sigla_uf).filter((uf): uf is string => !!uf)
    return Array.from(new Set(siglas))
  }, [permissoes])

  function escolherEleicao(eleicao: Eleicao) {
    setEleicao(eleicao.id)

    if (ufsDisponiveis.length === 1) {
      navegarPara(eleicao.id, ufsDisponiveis[0])
      return
    }
    if (ufsDisponiveis.length === 0) {
      // Permissão com sigla_uf = null (acesso a todas as UFs).
      navegarPara(eleicao.id, UF_FALLBACK)
      return
    }
    setEleicaoEscolhida(eleicao)
  }

  function navegarPara(eleicaoId: number, uf: string) {
    setUf(uf)
    navigate(`/dashboard/${eleicaoId}/${uf}`)
  }

  if (carregandoSessao) {
    return <CentroDeTela><Skeleton className="h-40 w-80" /></CentroDeTela>
  }

  if (!session) {
    return (
      <CentroDeTela>
        <Alert className="max-w-md">
          <AlertTitle>Você precisa entrar</AlertTitle>
          <AlertDescription>
            Faça login para ver os ciclos eleitorais disponíveis para sua conta.
          </AlertDescription>
        </Alert>
        <Link to="/login" className={buttonVariants()}>
          Ir para o login
        </Link>
      </CentroDeTela>
    )
  }

  if (carregandoPermissoes) {
    return <CentroDeTela><Skeleton className="h-40 w-80" /></CentroDeTela>
  }

  if (!permissoes || permissoes.length === 0) {
    return (
      <CentroDeTela>
        <Alert className="max-w-md">
          <AlertTitle>Acesso pendente de liberação</AlertTitle>
          <AlertDescription>
            Seu login foi feito com sucesso, mas ainda não há nenhum escopo de dados
            liberado para sua conta. Fale com o administrador responsável. (Seção 5.3)
          </AlertDescription>
        </Alert>
      </CentroDeTela>
    )
  }

  return (
    <div className="mx-auto max-w-4xl p-8">
      <h1 className="mb-1 text-2xl font-semibold">Selecione o ciclo eleitoral</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Escolha uma eleição para começar a análise. (Seção 4.3)
      </p>

      {eleicaoEscolhida && ufsDisponiveis.length > 1 && (
        <Alert className="mb-6">
          <AlertTitle>Escolha a UF</AlertTitle>
          <AlertDescription>
            <div className="mt-2 flex flex-wrap gap-2">
              {ufsDisponiveis.map((uf) => (
                <Button
                  key={uf}
                  size="sm"
                  variant="outline"
                  onClick={() => navegarPara(eleicaoEscolhida.id, uf)}
                >
                  {uf}
                </Button>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {carregandoEleicoes && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      )}

      {erroEleicoes && (
        <Alert variant="destructive">
          <AlertTitle>Erro ao carregar eleições</AlertTitle>
          <AlertDescription>
            Não foi possível consultar a API. Verifique se o PostgREST está rodando.
          </AlertDescription>
        </Alert>
      )}

      {eleicoes && eleicoes.length === 0 && (
        <Alert>
          <AlertTitle>Nenhum ciclo eleitoral disponível</AlertTitle>
          <AlertDescription>
            Ainda não há eleições cadastradas dentro do seu escopo.
          </AlertDescription>
        </Alert>
      )}

      {eleicoes && eleicoes.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {eleicoes.map((eleicao) => (
            <Card
              key={eleicao.id}
              role="button"
              tabIndex={0}
              onClick={() => escolherEleicao(eleicao)}
              onKeyDown={(e) => e.key === 'Enter' && escolherEleicao(eleicao)}
              className="cursor-pointer transition-colors hover:border-primary"
            >
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle>{eleicao.ano}</CardTitle>
                  <Badge variant={eleicao.tipo_eleicao === 'GERAL' ? 'default' : 'secondary'}>
                    {eleicao.tipo_eleicao}
                  </Badge>
                </div>
                <CardDescription>{eleicao.descricao}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {eleicao.turno}º turno
                {eleicao.data_pleito && ` · ${new Date(eleicao.data_pleito).toLocaleDateString('pt-BR')}`}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function CentroDeTela({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8">
      {children}
    </div>
  )
}
