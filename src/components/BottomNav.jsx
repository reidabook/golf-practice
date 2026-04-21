import { Link, useLocation } from 'react-router-dom'
import { Home, History, TrendingUp, Target } from 'lucide-react'

const tabs = [
  { to: '/',         label: 'Home',     Icon: Home },
  { to: '/history',  label: 'History',  Icon: History },
  { to: '/progress', label: 'Progress', Icon: TrendingUp },
  { to: '/drills',   label: 'Drills',   Icon: Target },
]

export default function BottomNav() {
  const { pathname } = useLocation()

  return (
    <nav style={{
      backgroundColor: '#111111',
      borderTop: '1px solid #2a2a2a',
      display: 'flex',
      flexShrink: 0,
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }}>
      {tabs.map(({ to, label, Icon }) => {
        const active = to === '/' ? pathname === '/' : pathname.startsWith(to)
        return (
          <Link
            key={to}
            to={to}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              padding: '10px 4px',
              textDecoration: 'none',
              color: active ? '#4ade80' : '#6b7280',
              fontSize: 10,
              fontWeight: active ? 600 : 400,
              transition: 'color 0.15s',
            }}
          >
            <Icon size={22} strokeWidth={active ? 2.5 : 1.75} />
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
