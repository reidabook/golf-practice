import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // The dev badge sits on top of the bottom nav
  devIndicators: false,
  experimental: {
    // Keep visited/prefetched pages in the client router cache so tab switches
    // are instant. Server actions call revalidatePath, which clears this cache.
    staleTimes: { dynamic: 60, static: 300 },
  },
}

export default nextConfig
