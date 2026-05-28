import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export type UserRole = 'operacional' | 'financeiro' | 'comercial' | 'ti'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
}

export const roleLabels: Record<UserRole, string> = {
  operacional: 'Operacional',
  financeiro: 'Financeiro',
  comercial: 'Comercial',
  ti: 'TI',
}

export const roleDefaultPath: Record<UserRole, string> = {
  operacional: '/',
  financeiro: '/pagamentos',
  comercial: '/cotacoes',
  ti: '/',
}

export const roleAccess: Record<UserRole, string[]> = {
  operacional: ['/', '/entregas', '/rastreamento', '/frota', '/motoristas', '/motorista', '/mensagens'],
  financeiro: ['/', '/pagamentos'],
  comercial: ['/', '/cotacoes', '/clientes', '/propostas'],
  ti: ['/', '/entregas', '/rastreamento', '/frota', '/motoristas', '/motorista', '/mensagens', '/pagamentos', '/cotacoes', '/clientes', '/propostas'],
}

export function canAccessPath(role: UserRole, pathname: string) {
  const path = pathname === '' ? '/' : pathname
  const allowedPaths = roleAccess[role]

  return allowedPaths.some((allowedPath) => path === allowedPath || path.startsWith(`${allowedPath}/`))
}

interface ProfileRow {
  id: string
  nome: string
  email: string
  role: UserRole
  ativo: boolean
}

async function getCurrentUserProfile(): Promise<AuthUser | null> {
  if (!supabase) {
    return null
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) {
    return null
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, nome, email, role, ativo')
    .eq('id', session.user.id)
    .single<ProfileRow>()

  if (error || !data || !data.ativo) {
    await supabase.auth.signOut()
    return null
  }

  return {
    id: data.id,
    name: data.nome,
    email: data.email,
    role: data.role,
  }
}

export async function signInWithEmailAndPassword(email: string, password: string) {
  if (!supabase) {
    throw new Error('Supabase nao configurado. Preencha NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.')
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw new Error('E-mail ou senha invalidos.')
  }

  const user = await getCurrentUserProfile()

  if (!user) {
    throw new Error('Usuario autenticado, mas sem perfil ativo em public.profiles.')
  }

  return user
}

export async function signOut() {
  if (!supabase) {
    return
  }

  await supabase.auth.signOut()
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isReady, setIsReady] = useState(false)

  const refreshUser = useCallback(async () => {
    const currentUser = await getCurrentUserProfile()

    setUser(currentUser)
    setIsReady(true)
  }, [])

  useEffect(() => {
    void refreshUser()

    const { data } = supabase?.auth.onAuthStateChange(() => {
      void refreshUser()
    }) ?? { data: null }

    return () => {
      data?.subscription.unsubscribe()
    }
  }, [refreshUser])

  return {
    user,
    isReady,
    login: signInWithEmailAndPassword,
    logout: signOut,
    refreshUser,
  }
}
