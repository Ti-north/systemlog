import type { AppProps } from 'next/app'
import { useEffect } from 'react'
import { AuthGuard } from '@/components/auth-guard'
import '@/app/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    document.documentElement.classList.add('dark')
  }, [])

  return (
    <AuthGuard>
      <Component {...pageProps} />
    </AuthGuard>
  )
}
