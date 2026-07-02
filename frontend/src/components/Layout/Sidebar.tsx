import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, FolderOpen, FlaskConical, BookOpen,
  BarChart3, FileText, Settings, Shield, LogOut,
  ChevronRight, Zap, Users, Activity,
} from 'lucide-react'
import { useAuthStore, useUIStore } from '@/store'
import { authApi } from '@/api/client'
import { useMutation } from '@tanstack/react-query'

const navSections = [
  {
    label: 'Main',
    items: [
      { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/workspaces', icon: FolderOpen, label: 'Workspaces' },
    ],
  },
  {
    label: 'Learning',
    items: [
      { path: '/analysis', icon: FlaskConical, label: 'Analysis Wizard' },
      { path: '/knowledge', icon: BookOpen, label: 'Knowledge Base' },
      { path: '/learning', icon: Activity, label: 'My Progress' },
    ],
  },
  {
    label: 'Output',
    items: [
      { path: '/reports', icon: FileText, label: 'Reports' },
      { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    ],
  },
  {
    label: 'Account',
    items: [
      { path: '/settings', icon: Settings, label: 'Settings' },
    ],
  },
]

export function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { sidebarOpen } = useUIStore()

  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      logout() // Clears all state + redirects to /login
    },
  })

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/')

  return (
    <motion.aside
      className="sidebar"
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Logo */}
      <div className="sidebar-logo">
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'linear-gradient(135deg, var(--color-primary-600), var(--color-accent-600))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Shield size={20} color="white" />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
            SQLMentor
          </div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Security Learning Platform
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navSections.map((section) => (
          <div key={section.label}>
            <div className="nav-section-label">{section.label}</div>
            {section.items.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
              >
                <item.icon size={17} />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        ))}

        {/* Admin link — only for admins */}
        {user?.role === 'admin' && (
          <div>
            <div className="nav-section-label">Administration</div>
            <Link to="/admin" className={`nav-item ${isActive('/admin') ? 'active' : ''}`}>
              <Users size={17} />
              <span>Admin Panel</span>
            </Link>
          </div>
        )}
      </nav>

      {/* User Footer */}
      <div style={{
        padding: '0.75rem',
        borderTop: '1px solid var(--surface-4)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '0.625rem 0.875rem', borderRadius: 'var(--radius-md)',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--color-primary-700), var(--color-accent-600))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.875rem', fontWeight: 600, color: 'white', flexShrink: 0,
          }}>
            {user?.username?.[0]?.toUpperCase() || '?'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {user?.full_name || user?.username}
            </div>
            <div style={{
              fontSize: '0.6875rem', color: 'var(--text-muted)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {user?.role}
            </div>
          </div>
          <button
            className="btn btn-ghost"
            style={{ padding: '0.25rem', borderRadius: 6 }}
            onClick={() => logoutMutation.mutate()}
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </motion.aside>
  )
}
