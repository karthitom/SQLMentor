import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/components/Auth/ProtectedRoute'
import { AppShell } from '@/components/Layout/AppShell'

// Lazy-loaded pages
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'))
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'))
const KnowledgeBasePage = lazy(() => import('@/pages/knowledge/KnowledgeBasePage'))
const ArticleDetailPage = lazy(() => import('@/pages/knowledge/ArticleDetailPage'))
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage'))

// New Educational Pages
const LearningPathsPage = lazy(() => import('@/pages/learning/LearningPathsPage'))
const PathDetailPage = lazy(() => import('@/pages/learning/PathDetailPage'))
const LabEnvironmentPage = lazy(() => import('@/pages/labs/LabEnvironmentPage'))
const SQLPlaygroundPage = lazy(() => import('@/pages/playground/SQLPlaygroundPage'))
const LeaderboardPage = lazy(() => import('@/pages/leaderboard/LeaderboardPage'))
const UserProfilePage = lazy(() => import('@/pages/profile/UserProfilePage'))

function PageFallback() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '60vh', flexDirection: 'column', gap: '1rem',
    }}>
      <div className="animate-spin" style={{
        width: 36, height: 36,
        border: '3px solid var(--surface-4)',
        borderTop: '3px solid var(--color-primary-500)',
        borderRadius: '50%',
      }} />
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading...</p>
    </div>
  )
}

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes with AppShell */}
        <Route path="/dashboard" element={<ProtectedLayout><DashboardPage /></ProtectedLayout>} />
        
        {/* Educational Routes */}
        <Route path="/paths" element={<ProtectedLayout><LearningPathsPage /></ProtectedLayout>} />
        <Route path="/paths/:id" element={<ProtectedLayout><PathDetailPage /></ProtectedLayout>} />
        <Route path="/labs/:id" element={<ProtectedLayout><LabEnvironmentPage /></ProtectedLayout>} />
        <Route path="/playground" element={<ProtectedLayout><SQLPlaygroundPage /></ProtectedLayout>} />
        <Route path="/leaderboard" element={<ProtectedLayout><LeaderboardPage /></ProtectedLayout>} />
        <Route path="/profile" element={<ProtectedLayout><UserProfilePage /></ProtectedLayout>} />
        
        {/* Knowledge Base */}
        <Route path="/knowledge" element={<ProtectedLayout><KnowledgeBasePage /></ProtectedLayout>} />
        <Route path="/knowledge/:slug" element={<ProtectedLayout><ArticleDetailPage /></ProtectedLayout>} />
        <Route path="/settings" element={<ProtectedLayout><SettingsPage /></ProtectedLayout>} />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  )
}
