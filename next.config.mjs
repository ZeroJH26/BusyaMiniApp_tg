/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Allow Telegram Mini App tunnels in dev (Cloudflare quick tunnels).
  allowedDevOrigins: ['*.trycloudflare.com'],
}

export default nextConfig
