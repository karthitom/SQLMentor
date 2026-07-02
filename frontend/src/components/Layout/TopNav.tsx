import { Link, useLocation } from 'react-router-dom'
import { Search, Bell, Command, Menu } from 'lucide-react'
import { useUIStore, useAuthStore } from '@/store'

const BREADCRUMB_MAP: Record<string, string> = {
  dashboard: 'Dashboard',
  workspaces: 'Workspaces',
  analysis: 'Analysis',
  knowledge: 'Knowledge Base',
  learning: 'My Progress',
  reports: 'Reports',
  analytics: 'Analytics',
  settings: 'Settings',
  admin: 'Admin',
}

export function TopNav() {
  const location = useLocation()
  const { toggleSidebar, setCommandPaletteOpen } = useUIStore()
  const { user } = useAuthStore()

  const segments = location.pathname.split('/').filter(Boolean)
  const breadcrumbs = segments.map((seg, i) => ({
    label: BREADCRUMB_MAP[seg] || seg,
    path: '/' + segments.slice(0, i + 1).join('/'),
  }))

  return (
    <header className="topnav">
      {/* Mobile menu toggle */}
      <button
        className="btn btn-ghost"
        style={{ padding: '0.375rem', display: 'none' }}
        onClick={toggleSidebar}
        aria-label="Toggle navigation"
      >
        <Menu size={20} />
      </button>

      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', flex: 1 }}>
        <Link to="/dashboard" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
          Home
        </Link>
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.path} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <span style={{ color: 'var(--text-disabled)' }}>/</span>
            {i === breadcrumbs.length - 1 ? (
              <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{crumb.label}</span>
            ) : (
              <Link to={crumb.path} style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      {/* Right side actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {/* Command palette trigger */}
        <button
          className="btn btn-ghost"
          style={{ padding: '0.375rem 0.625rem', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}
          onClick={() => setCommandPaletteOpen(true)}
          aria-label="Open command palette"
        >
          <Search size={15} />
          <span style={{ display: 'none' }}>Search</span>
          <kbd style={{
            fontSize: '0.6875rem',
            background: 'var(--surface-3)',
            border: '1px solid var(--surface-4)',
            borderRadius: 4,
            padding: '0.125rem 0.375rem',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
          }}>
            ⌘K
          </kbd>
        </button>

        {/* Notifications */}
        <button className="btn btn-ghost" style={{ padding: '0.375rem', position: 'relative' }} aria-label="Notifications">
          <Bell size={18} />
          <span style={{
            position: 'absolute', top: 4, right: 4,
            width: 7, height: 7, borderRadius: '50%',
            background: 'var(--color-primary-500)',
          }} />
        </button>

        {/* User badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.25rem 0.625rem 0.25rem 0.375rem',
          background: 'var(--surface-2)',
          border: '1px solid var(--surface-4)',
          borderRadius: 'var(--radius-md)',
          cursor: 'pointer',
        }}>
          <div style={{
            width: 24, height: 24, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--color-primary-700), var(--color-accent-600))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.6875rem', fontWeight: 700, color: 'white',
          }}>
            {user?.username?.[0]?.toUpperCase() || '?'}
          </div>
          <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-primary)' }}>
            {user?.username}
          </span>
        </div>
      </div>
    </header>
  )
}
