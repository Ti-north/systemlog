'use client'

import { useEffect } from 'react'
import { canAccessPath, roleDefaultPath, useAuth } from '@/lib/auth'

const publicRoutes = ['/login']

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isReady } = useAuth()

  useEffect(() => {
    if (!isReady) {
      return
    }

    const pathname = window.location.pathname
    const isPublicRoute = publicRoutes.includes(pathname)

    if (!user && !isPublicRoute) {
      window.location.href = '/login'
      return
    }

    if (user && isPublicRoute) {
      window.location.href = roleDefaultPath[user.role]
      return
    }

    if (user && !isPublicRoute && !canAccessPath(user.role, pathname)) {
      window.location.href = roleDefaultPath[user.role]
    }
  }, [isReady, user])

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Carregando...
      </div>
    )
  }

  return <>{children}</>
}
