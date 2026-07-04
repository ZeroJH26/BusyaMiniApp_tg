/**
 * Configures Telegram bot after deploy (webhook, menu, commands).
 * Usage: APP_URL=https://your-app.vercel.app BOT_TOKEN=... node scripts/setup-bot.mjs
 * Or open: https://your-app.vercel.app/api/telegram/setup?key=YOUR_SETUP_KEY
 */

const appUrl = (process.env.APP_URL ?? process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`)?.replace(/\/$/, '')
const token = process.env.BOT_TOKEN
const setupKey = process.env.SETUP_KEY

if (!appUrl || !token) {
  console.error('Set BOT_TOKEN and APP_URL (or VERCEL_URL)')
  process.exit(1)
}

const setupUrl = setupKey
  ? `${appUrl}/api/telegram/setup?key=${encodeURIComponent(setupKey)}`
  : `${appUrl}/api/telegram/setup`

console.log(`Calling ${setupUrl} ...`)

const res = await fetch(setupUrl)
const data = await res.json()

if (!res.ok) {
  console.error('Setup failed:', data)
  process.exit(1)
}

console.log('Bot configured:')
console.log(JSON.stringify(data, null, 2))
