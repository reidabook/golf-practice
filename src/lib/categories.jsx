import { Flag, Crosshair, ArrowUpRight, Zap } from 'lucide-react'

export const CATEGORIES = ['putting', 'chipping', 'approach', 'driving']

export const CATEGORY_META = {
  putting:  { label: 'Putting',  Icon: Flag,         color: '#4ade80', bg: '#052e16' },
  chipping: { label: 'Chipping', Icon: Crosshair,    color: '#facc15', bg: '#3b2a00' },
  approach: { label: 'Approach', Icon: ArrowUpRight, color: '#60a5fa', bg: '#0c1a3a' },
  driving:  { label: 'Driving',  Icon: Zap,          color: '#f97316', bg: '#3a1200' },
}

export function CategoryBadge({ category }) {
  const meta = CATEGORY_META[category]
  if (!meta) return null
  const { label, Icon, color, bg } = meta
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 20,
      backgroundColor: bg, color, fontSize: 11, fontWeight: 600,
    }}>
      <Icon size={10} />
      {label}
    </span>
  )
}
