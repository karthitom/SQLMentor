import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store'
import { useQuery } from '@tanstack/react-query'
import { authApi } from '@/api/client'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'student' | 'instructor' | 'admin'
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isAuthenticated, setUser, setLoading, isLoading } = useAuthStore()
  const location = useLocation()

  // Validate session on every protected route visit
  const { data, isError, isPending } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const res = await authApi.me()
      return res.data
    },
    retry: false,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  useEffect(() => {
    if (data) {
      setUser(data)
    } else if (isError) {
      setUser(null)
      setLoading(false)
    }
  }, [data, isError, setUser, setLoading])

  if (isPending) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--surface-0)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="animate-spin" style={{ width: 40, height: 40, border: '3px solid var(--surface-4)', borderTop: '3px solid var(--color-primary-500)', borderRadius: '50%', margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading SQLMentor...</p>
        </div>
      </div>
    )
  }

  if (isError || !data) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Role-based access control
  if (requiredRole && data.role !== requiredRole) {
    if (requiredRole === 'admin' && data.role !== 'admin') {
      return <Navigate to="/dashboard" replace />
    }
    if (requiredRole === 'instructor' && data.role === 'student') {
      return <Navigate to="/dashboard" replace />
    }
  }

  return <>{children}</>
}
