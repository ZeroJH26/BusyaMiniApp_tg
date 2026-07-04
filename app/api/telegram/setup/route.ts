import { getAppUrl, telegramApi } from '@/lib/telegram/bot-api'

export const dynamic = 'force-dynamic'

/** One-time setup: webhook, menu button, bot profile. Call after deploy. */
export async function GET(request: Request) {
  const setupKey = process.env.SETUP_KEY
  if (setupKey) {
    const key = new URL(request.url).searchParams.get('key')
    if (key !== setupKey) {
      return Response.json({ error: 'Invalid setup key' }, { status: 401 })
    }
  } else if (process.env.NODE_ENV === 'production') {
    return Response.json({ error: 'Set SETUP_KEY env var for security' }, { status: 401 })
  }

  const appUrl = getAppUrl()
  const webhookUrl = `${appUrl}/api/telegram/webhook`
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET

  try {
    // Stop local polling if it was used before.
    await telegramApi('deleteWebhook', { drop_pending_updates: true })

    await telegramApi('setWebhook', {
      url: webhookUrl,
      allowed_updates: ['message'],
      ...(secret ? { secret_token: secret } : {}),
    })

    await telegramApi('setMyName', { name: 'Буся' })
    await telegramApi('setMyDescription', {
      description: 'Тамагочи-питомец Буся. Корми, играй и укладывай спать прямо в Telegram!',
    })
    await telegramApi('setMyShortDescription', {
      short_description: 'Заботься о Бусе каждый день',
    })
    await telegramApi('setMyCommands', {
      commands: [
        { command: 'start', description: 'Начать и открыть игру' },
        { command: 'play', description: 'Открыть мини-приложение' },
      ],
    })
    await telegramApi('setChatMenuButton', {
      menu_button: {
        type: 'web_app',
        text: 'Играть',
        web_app: { url: appUrl },
      },
    })

    return Response.json({
      ok: true,
      appUrl,
      webhookUrl,
      persistentStore: Boolean(
        process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
      ),
    })
  } catch (error) {
    console.error(error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Setup failed' },
      { status: 500 },
    )
  }
}
