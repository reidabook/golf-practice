'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Flag, TrendingUp, BookOpen, Timer } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { href: '/', label: 'Today', icon: Flag, match: (p: string) => p === '/' || p.startsWith('/blocks') },
  { href: '/progress', label: 'Progress', icon: TrendingUp, match: (p: string) => p.startsWith('/progress') || p.startsWith('/history') },
  { href: '/library', label: 'Library', icon: BookOpen, match: (p: string) => p.startsWith('/library') },
  { href: '/tempo', label: 'Tempo', icon: Timer, match: (p: string) => p.startsWith('/tempo') },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Main"
      className="bottom-nav-safe fixed inset-x-0 bottom-0 z-50 border-t bg-background/90 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-lg">
        {tabs.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname)
          return (
            <Link
              key={href}
              href={href}
              prefetch
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative flex h-16 flex-1 flex-col items-center justify-center gap-1 transition-colors',
                active ? 'text-fairway' : 'text-muted-foreground'
              )}
            >
              <span
                aria-hidden
                className={cn(
                  'absolute inset-x-6 top-0 h-[3px] rounded-b-full bg-fairway transition-opacity',
                  active ? 'opacity-100' : 'opacity-0'
                )}
              />
              <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.25 : 1.75} />
              <span className="font-display text-[11px] font-bold uppercase tracking-[0.06em]" style={{ fontStretch: '85%' }}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
