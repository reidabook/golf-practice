import type { Metadata, Viewport } from 'next'
import { Archivo, Atkinson_Hyperlegible } from 'next/font/google'
import './globals.css'
import { BottomNav } from '@/components/nav/bottom-nav'
import { Toaster } from 'sonner'
import { SwRegister } from '@/components/sw-register'
import { DrillRouteWatcher } from '@/components/scoring/drill-route-watcher'

// Archivo's width axis gives wide numerals and condensed labels from one family.
const display = Archivo({ subsets: ['latin'], axes: ['wdth'], variable: '--font-display' })
// Atkinson Hyperlegible: body copy that stays readable at a glance in sunlight.
const body = Atkinson_Hyperlegible({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-body' })

export const metadata: Metadata = {
  title: 'Golf Practice',
  description: 'Track your golf practice drills and progress',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Golf Practice',
  },
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'mobile-web-app-capable': 'yes',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F5F7F3' },
    { media: '(prefers-color-scheme: dark)', color: '#0B1611' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body>
        <main className="main-content max-w-lg mx-auto">
          {children}
        </main>
        <BottomNav />
        <Toaster position="top-center" theme="system" toastOptions={{ className: 'font-sans' }} />
        <SwRegister />
        <DrillRouteWatcher />
      </body>
    </html>
  )
}
