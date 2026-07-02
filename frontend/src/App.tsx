import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/components/Auth/ProtectedRoute'
import { AppShell } from '@/components/Layout/AppShell'

// Lazy-loaded pages
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'))
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'))
const AnalysisWizardPage = lazy(() => import('@/pages/analysis/AnalysisWizardPage'))
const KnowledgeBasePage = lazy(() => import('@/pages/knowledge/KnowledgeBasePage'))
const ArticleDetailPage = lazy(() => import('@/pages/knowledge/ArticleDetailPage'))
const WorkspacesPage = lazy(() => import('@/pages/workspaces/WorkspacesPage'))
const WorkspaceDetailPage = lazy(() => import('@/pages/workspaces/WorkspaceDetailPage'))
const ReportsPage = lazy(() => import('@/pages/reports/ReportsPage'))
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage'))

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
        <Route path="/workspaces" element={<ProtectedLayout><WorkspacesPage /></ProtectedLayout>} />
        <Route path="/workspaces/:id" element={<ProtectedLayout><WorkspaceDetailPage /></ProtectedLayout>} />
        <Route path="/analysis/new" element={<ProtectedLayout><AnalysisWizardPage /></ProtectedLayout>} />
        <Route path="/analysis" element={<ProtectedLayout><AnalysisWizardPage /></ProtectedLayout>} />
        <Route path="/knowledge" element={<ProtectedLayout><KnowledgeBasePage /></ProtectedLayout>} />
        <Route path="/knowledge/:slug" element={<ProtectedLayout><ArticleDetailPage /></ProtectedLayout>} />
        <Route path="/reports" element={<ProtectedLayout><ReportsPage /></ProtectedLayout>} />
        <Route path="/settings" element={<ProtectedLayout><SettingsPage /></ProtectedLayout>} />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  )
}
