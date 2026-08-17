import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { Eye, EyeOff, MapPinned, SlidersHorizontal, Users2 } from 'lucide-react'
import { useSession } from '@/hooks/useSession'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

const DESTAQUES = [
  { icone: MapPinned, texto: 'Diagnóstico territorial por candidato' },
  { icone: SlidersHorizontal, texto: 'Simulação de cenários de crescimento' },
  { icone: Users2, texto: 'Comparação entre candidatos' },
]

function IconeGoogle({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47c-.28 1.5-1.13 2.78-2.4 3.63v3.02h3.88c2.27-2.09 3.57-5.17 3.57-8.84z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.88-3.02c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.95H1.27v3.11C3.25 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.28A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.56.37-2.28V6.61H1.27A11.98 11.98 0 0 0 0 12c0 1.94.46 3.77 1.27 5.39l4-3.11z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.27 6.61l4 3.11C6.22 6.88 8.87 4.77 12 4.77z"
      />
    </svg>
  )
}

export function LoginPage() {
  const { session, carregando } = useSession()
  const [erro, setErro] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [enviando, setEnviando] = useState(false)

  async function entrarComGoogle() {
    setErro(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/dashboard' },
    })
    if (error) setErro(error.message)
  }

  async function entrarComEmailSenha(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    setEnviando(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    setEnviando(false)
    if (error) setErro(error.message)
  }

  if (!carregando && session) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Painel de marca — some no mobile, ver logo abaixo do card */}
      <div className="relative hidden overflow-hidden bg-primary-800 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle at 15% 20%, oklch(1 0 0 / 0.08) 0, transparent 45%), radial-gradient(circle at 85% 75%, oklch(1 0 0 / 0.10) 0, transparent 40%), radial-gradient(circle at 50% 95%, oklch(1 0 0 / 0.06) 0, transparent 35%)',
          }}
        />
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.15]"
          viewBox="0 0 400 600"
        >
          {Array.from({ length: 60 }).map((_, i) => {
            const x = (i * 53) % 400
            const y = (i * 97) % 600
            return <circle key={i} cx={x} cy={y} r={1.5} fill="white" />
          })}
        </svg>

        <span className="relative font-heading text-xl font-semibold text-primary-foreground">VotoApurado</span>

        <div className="relative space-y-8">
          <p className="max-w-sm text-2xl leading-snug font-medium text-primary-foreground">
            Inteligência eleitoral para decisões de campanha, com dados oficiais do TSE.
          </p>
          <ul className="space-y-3">
            {DESTAQUES.map(({ icone: Icone, texto }) => (
              <li key={texto} className="flex items-center gap-3 text-sm text-primary-100">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/10">
                  <Icone className="size-4" />
                </span>
                {texto}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-primary-200">Dados oficiais do TSE — nunca previsão eleitoral.</p>
      </div>

      {/* Formulário */}
      <div className="flex min-h-svh flex-col items-center justify-center gap-8 bg-background p-6 sm:p-8">
        <span className="font-heading text-lg font-semibold text-foreground lg:hidden">VotoApurado</span>

        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-1.5 text-center sm:text-left">
            <h1 className="text-2xl font-semibold text-foreground">Entrar</h1>
            <p className="text-sm text-muted-foreground">Acesse a plataforma com seu e-mail e senha.</p>
          </div>

          <form className="space-y-4" onSubmit={entrarComEmailSenha}>
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                required
                autoFocus
                autoComplete="email"
                placeholder="voce@exemplo.com.br"
                className="h-11"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="senha">Senha</Label>
              <div className="relative">
                <Input
                  id="senha"
                  type={mostrarSenha ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  className="h-11 pr-10"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha((v) => !v)}
                  className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
                  aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {mostrarSenha ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="h-11 w-full" disabled={enviando}>
              {enviando ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">ou</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button type="button" variant="outline" className="h-11 w-full gap-2" onClick={entrarComGoogle}>
            <IconeGoogle className="size-4" />
            Entrar com Google
          </Button>

          {erro && (
            <Alert variant="destructive">
              <AlertTitle>Não foi possível entrar</AlertTitle>
              <AlertDescription>{erro}</AlertDescription>
            </Alert>
          )}

          <p className="text-center text-xs text-muted-foreground">
            Acesso liberado pelo administrador da sua conta. Problemas para entrar? Fale com quem te convidou.
          </p>
        </div>
      </div>
    </div>
  )
}
