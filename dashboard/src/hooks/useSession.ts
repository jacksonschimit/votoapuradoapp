import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface SessionState {
  session: Session | null
  carregando: boolean
}

// Observa a sessão do Supabase Auth (login Google) reativamente.
// Usado só para autenticação — os dados eleitorais nunca passam
// por aqui, ver src/lib/api.ts.
export function useSession(): SessionState {
  const [session, setSession] = useState<Session | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let ativo = true

    supabase.auth.getSession().then(({ data }) => {
      if (!ativo) return
      setSession(data.session)
      setCarregando(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, novaSessao) => {
      setSession(novaSessao)
      setCarregando(false)
    })

    return () => {
      ativo = false
      listener.subscription.unsubscribe()
    }
  }, [])

  return { session, carregando }
}
