import { PostgrestClient } from '@supabase/postgrest-js'
import { supabase } from './supabase'

const API_URL = import.meta.env.VITE_API_URL as string

// Cliente de dados: aponta para o PostgREST rodando sobre o nosso
// próprio Postgres (local em dev, Locaweb/Hostinger em produção),
// nunca para o Supabase. Injeta o JWT da sessão Supabase atual (se
// houver) para que o PostgREST valide o usuário e o RLS filtre os
// dados pelo escopo em usuarios_permissoes.
export async function getApi() {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token

  return new PostgrestClient(API_URL, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
}
