import type { Metadata } from 'next'
import { Roboto, Roboto_Flex } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _roboto = Roboto({ subsets: ["latin"] });
const _robotoMono = Roboto_Flex({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Sistema North Seven',
  description: 'Sistema de gestao logistica com rastreamento em tempo real',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="font-sans antialiased bg-background">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
