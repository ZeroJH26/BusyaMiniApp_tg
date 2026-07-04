export function getAppUrl(): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '')
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}

export async function telegramApi<T>(
  method: string,
  body?: Record<string, unknown>,
): Promise<T> {
  const token = process.env.BOT_TOKEN
  if (!token) throw new Error('BOT_TOKEN is not configured')

  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = (await res.json()) as T & { ok?: boolean; description?: string }
  if (!data.ok) {
    throw new Error(data.description ?? `Telegram API ${method} failed`)
  }
  return data
}
