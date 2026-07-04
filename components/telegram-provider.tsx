'use client'

import { useEffect, type ReactNode } from 'react'
import { initTelegramApp } from '@/lib/telegram/client'

export function TelegramProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    initTelegramApp()

    // Script may load slightly after first paint in some WebViews.
    const t1 = window.setTimeout(initTelegramApp, 50)
    const t2 = window.setTimeout(initTelegramApp, 300)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [])

  return children
}
