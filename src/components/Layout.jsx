import BottomNav from './BottomNav'

export default function Layout({ children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100svh' }}>
      <main style={{ flex: 1, maxWidth: 480, width: '100%', margin: '0 auto', padding: 'calc(16px + env(safe-area-inset-top, 0px)) 16px 80px' }}>
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
