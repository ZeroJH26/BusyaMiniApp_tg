export interface TelegramWebApp {
  initData: string
  initDataUnsafe: { user?: { id: number; first_name?: string } }
  colorScheme: 'light' | 'dark'
  themeParams: Record<string, string>
  ready: () => void
  expand: () => void
  HapticFeedback?: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void
  }
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp }
  }
}

export function getTelegramWebApp(): TelegramWebApp | undefined {
  if (typeof window === 'undefined') return undefined
  return window.Telegram?.WebApp
}

export function getInitDataRaw(): string | undefined {
  const data = getTelegramWebApp()?.initData
  return data && data.length > 0 ? data : undefined
}

export function initTelegramApp() {
  const tg = getTelegramWebApp()
  if (!tg) return

  tg.ready()
  tg.expand()

  const root = document.documentElement
  const dark = tg.colorScheme !== 'light'
  root.classList.toggle('dark', dark)
  root.classList.toggle('light', !dark)

  const p = tg.themeParams
  const map: Array<[string, string | undefined]> = [
    ['--background', p.bg_color ?? p.secondary_bg_color],
    ['--foreground', p.text_color],
    ['--card', p.section_bg_color ?? p.secondary_bg_color ?? p.bg_color],
    ['--card-foreground', p.text_color],
    ['--primary', p.button_color],
    ['--primary-foreground', p.button_text_color],
    ['--secondary', p.secondary_bg_color],
    ['--secondary-foreground', p.text_color],
    ['--muted', p.secondary_bg_color],
    ['--muted-foreground', p.hint_color],
    ['--accent', p.link_color ?? p.button_color],
    ['--accent-foreground', p.button_text_color ?? p.text_color],
    ['--border', p.section_separator_color ?? p.hint_color],
    ['--ring', p.button_color],
  ]

  for (const [cssVar, value] of map) {
    if (value) root.style.setProperty(cssVar, value)
  }
}

export function hapticImpact(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') {
  try {
    getTelegramWebApp()?.HapticFeedback?.impactOccurred(style)
  } catch {
    // ignore
  }
}

export function hapticSuccess() {
  try {
    getTelegramWebApp()?.HapticFeedback?.notificationOccurred('success')
  } catch {
    // ignore
  }
}
