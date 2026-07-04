import { getAppUrl } from '@/lib/telegram/bot-api'

export const dynamic = 'force-dynamic'

interface TelegramUpdate {
  message?: {
    chat: { id: number }
    text?: string
  }
}

export async function POST(request: Request) {
  const token = process.env.BOT_TOKEN
  if (!token) {
    return Response.json({ error: 'BOT_TOKEN is not configured' }, { status: 500 })
  }

  const secret = process.env.TELEGRAM_WEBHOOK_SECRET
  if (secret) {
    const header = request.headers.get('x-telegram-bot-api-secret-token')
    if (header !== secret) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  let update: TelegramUpdate
  try {
    update = (await request.json()) as TelegramUpdate
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const msg = update.message
  if (!msg?.text) {
    return Response.json({ ok: true })
  }

  const text = msg.text.trim()
  if (!text.startsWith('/start') && !text.startsWith('/play')) {
    return Response.json({ ok: true })
  }

  const appUrl = getAppUrl()
  const api = `https://api.telegram.org/bot${token}`

  await fetch(`${api}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: msg.chat.id,
      text:
        'Привет! Я Буся — твой виртуальный питомец.\n\nКорми меня, играй со мной и укладывай спать. Нажми кнопку ниже:',
      reply_markup: {
        inline_keyboard: [[{ text: '🎮 Открыть Бусю', web_app: { url: appUrl } }]],
      },
    }),
  })

  return Response.json({ ok: true })
}
