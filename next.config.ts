import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // The dev badge sits on top of the bottom nav
  devIndicators: false,
  // Old tabs folded into the 4-tab layout (features/redesign/spec.md)
  async redirects() {
    return [
      { source: '/drills', destination: '/library', permanent: false },
      { source: '/plan', destination: '/library?tab=guides', permanent: false },
      { source: '/history', destination: '/progress#blocks', permanent: false },
    ]
  },
  experimental: {
    // Keep visited/prefetched pages in the client router cache so tab switches
    // are instant. Server actions call revalidatePath, which clears this cache.
    staleTimes: { dynamic: 60, static: 300 },
  },
}

export default nextConfig
