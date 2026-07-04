const TOKEN = process.env.BOT_TOKEN
const APP_URL = process.env.APP_URL

if (!TOKEN || !APP_URL) {
  console.error('BOT_TOKEN and APP_URL are required')
  process.exit(1)
}

const API = `https://api.telegram.org/bot${TOKEN}`

async function api(method, body) {
  const res = await fetch(`${API}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.json()
}

async function handleUpdate(update) {
  const msg = update.message
  if (!msg?.text) return

  const text = msg.text.trim()
  if (!text.startsWith('/start') && !text.startsWith('/play')) return

  await api('sendMessage', {
    chat_id: msg.chat.id,
    text:
      'Привет! Я Буся — твой виртуальный питомец.\n\nКорми меня, играй со мной и укладывай спать.\n\n⚠️ Не нажимай старые кнопки выше — только свежую ниже:',
    reply_markup: {
      inline_keyboard: [
        [{ text: '🎮 Открыть Бусю', web_app: { url: APP_URL } }],
      ],
    },
  })
}

let offset = 0
console.log(`Bot polling… Mini App: ${APP_URL}`)

while (true) {
  try {
    const data = await api('getUpdates', {
      offset,
      timeout: 30,
      allowed_updates: ['message'],
    })

    if (!data.ok) {
      console.error('getUpdates failed', data)
      await new Promise((r) => setTimeout(r, 2000))
      continue
    }

    for (const update of data.result) {
      offset = update.update_id + 1
      await handleUpdate(update)
    }
  } catch (err) {
    console.error(err)
    await new Promise((r) => setTimeout(r, 2000))
  }
}
