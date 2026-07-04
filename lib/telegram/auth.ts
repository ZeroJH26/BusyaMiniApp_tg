import { createHmac, timingSafeEqual } from 'crypto'

export interface TelegramUser {
  id: number
  first_name?: string
  last_name?: string
  username?: string
  language_code?: string
  is_premium?: boolean
  photo_url?: string
}

export interface AuthResult {
  playerId: string
  user: TelegramUser | null
}

const AUTH_MAX_AGE_SEC = 86_400 // 24h

/**
 * Validates Telegram Mini App initData (HMAC-SHA256) and returns the player id.
 * Never trust a client-supplied user id without this check.
 */
export function authenticateRequest(request: Request): AuthResult {
  const initData = extractInitData(request)

  if (!initData) {
    if (process.env.NODE_ENV === 'development') {
      return { playerId: 'dev-player', user: null }
    }
    throw new AuthError('Missing Telegram init data', 401)
  }

  const botToken = process.env.BOT_TOKEN
  if (!botToken) {
    throw new AuthError('BOT_TOKEN is not configured', 500)
  }

  const user = validateInitData(initData, botToken)
  return { playerId: String(user.id), user }
}

function extractInitData(request: Request): string | null {
  const auth = request.headers.get('authorization')
  if (auth?.startsWith('tma ')) {
    const value = auth.slice(4).trim()
    if (value) return value
  }

  const header = request.headers.get('x-telegram-init-data')
  if (header?.trim()) return header.trim()

  return null
}

export function validateInitData(initData: string, botToken: string): TelegramUser {
  const params = new URLSearchParams(initData)
  const hash = params.get('hash')
  if (!hash) {
    throw new AuthError('Invalid init data: missing hash', 401)
  }

  const entries: string[] = []
  for (const [key, value] of params.entries()) {
    if (key === 'hash') continue
    entries.push(`${key}=${value}`)
  }
  entries.sort()
  const dataCheckString = entries.join('\n')

  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest()
  const calculated = createHmac('sha256', secretKey).update(dataCheckString).digest('hex')

  const hashBuf = Buffer.from(hash, 'hex')
  const calcBuf = Buffer.from(calculated, 'hex')
  if (hashBuf.length !== calcBuf.length || !timingSafeEqual(hashBuf, calcBuf)) {
    throw new AuthError('Invalid init data signature', 401)
  }

  const authDate = Number(params.get('auth_date'))
  if (!Number.isFinite(authDate)) {
    throw new AuthError('Invalid init data: missing auth_date', 401)
  }
  const age = Math.floor(Date.now() / 1000) - authDate
  if (age > AUTH_MAX_AGE_SEC || age < -60) {
    throw new AuthError('Init data expired', 401)
  }

  const userRaw = params.get('user')
  if (!userRaw) {
    throw new AuthError('Invalid init data: missing user', 401)
  }

  let user: TelegramUser
  try {
    user = JSON.parse(userRaw) as TelegramUser
  } catch {
    throw new AuthError('Invalid init data: malformed user', 401)
  }

  if (!user?.id || typeof user.id !== 'number') {
    throw new AuthError('Invalid init data: missing user id', 401)
  }

  return user
}

export class AuthError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'AuthError'
    this.status = status
  }
}

export function authErrorResponse(error: unknown): Response {
  if (error instanceof AuthError) {
    return Response.json({ error: error.message }, { status: error.status })
  }
  console.error(error)
  return Response.json({ error: 'Internal server error' }, { status: 500 })
}
