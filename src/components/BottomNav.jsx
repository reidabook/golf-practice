import { Link, useLocation } from 'react-router-dom'

const tabs = [
  { to: '/',         label: 'Home',     icon: '⛳' },
  { to: '/history',  label: 'History',  icon: '📋' },
  { to: '/progress', label: 'Progress', icon: '📈' },
  { to: '/drills',   label: 'Drills',   icon: '🏌️' },
]

export default function BottomNav() {
  const { pathname } = useLocation()

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: '#111111',
      borderTop: '1px solid #2a2a2a',
      display: 'flex',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      zIndex: 50,
    }}>
      {tabs.map(({ to, label, icon }) => {
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
              gap: 2,
              padding: '10px 4px',
              textDecoration: 'none',
              color: active ? '#4ade80' : '#6b7280',
              fontSize: 10,
              fontWeight: active ? 600 : 400,
              transition: 'color 0.15s',
            }}
          >
            <span style={{ fontSize: 22 }}>{icon}</span>
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
