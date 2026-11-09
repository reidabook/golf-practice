import { cn } from '@/lib/utils'

/** Screen header: small eyebrow label over the screen title, optional action on the right. */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
  className,
}: {
  eyebrow?: React.ReactNode
  title: React.ReactNode
  subtitle?: React.ReactNode
  action?: React.ReactNode
  className?: string
}) {
  return (
    <header className={cn('flex items-start justify-between gap-3 px-4 pb-4 pt-[max(1.5rem,env(safe-area-inset-top))]', className)}>
      <div className="min-w-0">
        {eyebrow && <p className="label mb-1">{eyebrow}</p>}
        <h1 className="screen-title text-balance">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  )
}

/** Section heading in tee-sign lettering, with optional trailing text. */
export function SectionLabel({ children, trailing, className, id }: { children: React.ReactNode; trailing?: React.ReactNode; className?: string; id?: string }) {
  return (
    <div id={id} className={cn('mb-2 flex items-baseline justify-between gap-3 px-1', className)}>
      <h2 className="label">{children}</h2>
      {trailing && <span className="label normal-case tracking-normal">{trailing}</span>}
    </div>
  )
}

/** Flat list container: rows separated by hairlines inside one card. */
export function RowList({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('divide-y divide-border overflow-hidden rounded-lg border bg-card', className)}>{children}</div>
}

/** Segmented control (tabs). */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  className,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
  className?: string
}) {
  return (
    <div role="tablist" className={cn('grid rounded-lg bg-muted p-1', className)} style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'h-10 rounded-md text-sm font-bold transition-colors',
            value === o.value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
