import BottomNav from './BottomNav'

export default function Layout({ children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <main style={{
        flex: 1, minHeight: 0,
        overflowY: 'auto', WebkitOverflowScrolling: 'touch',
        maxWidth: 480, width: '100%', margin: '0 auto',
        padding: 'calc(16px + env(safe-area-inset-top, 0px)) 16px 24px',
      }}>
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
