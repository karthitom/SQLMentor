import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'student' | 'instructor' | 'admin'
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isAuthenticated, authReady } = useAuthStore()
  const location = useLocation()

  // Wait for Firebase onAuthStateChanged to fire before making any decision.
  // Without this, the component renders with isAuthenticated=false on refresh
  // (before Firebase has had time to restore its persisted session).
  if (!authReady) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--surface-0)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="animate-spin" style={{ width: 40, height: 40, border: '3px solid var(--surface-4)', borderTop: '3px solid var(--color-primary-500)', borderRadius: '50%', margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading SQLMentor...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Role-based access control
  if (requiredRole) {
    if (requiredRole === 'admin' && user.role !== 'admin') {
      return <Navigate to="/dashboard" replace />
    }
    if (requiredRole === 'instructor' && user.role === 'student') {
      return <Navigate to="/dashboard" replace />
    }
  }

  return <>{children}</>
}
