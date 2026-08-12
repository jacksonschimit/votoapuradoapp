import { createClient } from '@supabase/supabase-js'

// Preenchidos quando o login Google for configurado (Etapa 3 —
// pendente). Até lá, usamos valores de placeholder só para o
// cliente não quebrar a inicialização do app.
const url = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder'

// Usado SOMENTE para autenticação (login Google). Nenhuma consulta
// de dados eleitorais passa por este cliente — ver src/lib/api.ts.
export const supabase = createClient(url, anonKey)
