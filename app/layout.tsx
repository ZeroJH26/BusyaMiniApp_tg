import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Nunito } from 'next/font/google'
import Script from 'next/script'
import { TelegramProvider } from '@/components/telegram-provider'
import './globals.css'

const _nunito = Nunito({ subsets: ['latin', 'cyrillic'] })

export const metadata: Metadata = {
  title: 'Буся — виртуальный питомец',
  description: 'Тамагочи для Telegram: корми, играй и заботься о своём питомце каждый день.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  themeColor: '#1a1b2e',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru" className="dark bg-background">
      <head>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      </head>
      <body className="font-sans antialiased overscroll-none">
        <TelegramProvider>{children}</TelegramProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
