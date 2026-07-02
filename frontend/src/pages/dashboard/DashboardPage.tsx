import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  FlaskConical, FolderOpen, BookOpen, FileText,
  TrendingUp, Zap, Plus, ArrowRight, Activity,
  Shield, AlertCircle, Target, Award,
} from 'lucide-react'
import { useAuthStore } from '@/store'
import { workspacesApi } from '@/api/client'
import { formatDistanceToNow } from 'date-fns'

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.35 },
  }),
}

export default function DashboardPage() {
  const { user } = useAuthStore()

  const { data: workspaces = [] } = useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const res = await workspacesApi.list()
      return res.data as any[]
    },
  })

  const quickActions = [
    { icon: FlaskConical, label: 'New Analysis', description: 'Analyze a lab application', href: '/analysis/new', color: 'var(--color-primary-500)' },
    { icon: FolderOpen, label: 'New Workspace', description: 'Organize your projects', href: '/workspaces/new', color: 'var(--color-accent-500)' },
    { icon: BookOpen, label: 'Browse Guides', description: 'Learn SQL injection concepts', href: '/knowledge', color: 'var(--color-success)' },
    { icon: FileText, label: 'View Reports', description: 'Review generated reports', href: '/reports', color: 'var(--color-warning)' },
  ]

  const stats = [
    { label: 'Analyses Run', value: user?.total_analyses ?? 0, icon: FlaskConical, color: 'var(--color-primary-500)' },
    { label: 'Reports Generated', value: user?.total_reports ?? 0, icon: FileText, color: 'var(--color-accent-500)' },
    { label: 'Workspaces', value: workspaces.length, icon: FolderOpen, color: 'var(--color-success)' },
    { label: 'Learning Streak', value: `${user?.learning_streak_days ?? 0}d`, icon: Award, color: 'var(--color-warning)' },
  ]

  const learningTopics = [
    { title: 'SQL Injection Basics', href: '/knowledge/sql-injection-basics', difficulty: 'Beginner', progress: 85 },
    { title: 'Parameterized Queries', href: '/knowledge/parameterized-queries', difficulty: 'Beginner', progress: 60 },
    { title: 'OWASP Top 10 — Injection', href: '/knowledge/owasp-top-10-injection', difficulty: 'Intermediate', progress: 30 },
  ]

  const difficultyColor = (d: string) => d === 'Beginner' ? 'badge-green' : d === 'Intermediate' ? 'badge-yellow' : 'badge-red'

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div>
      {/* Educational Disclaimer */}
      <div className="disclaimer-banner">
        <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>
          <strong>⚠️ Educational Use Only</strong> — This platform is for learning SQL injection concepts.
          Only analyze systems you own or have <strong>explicit written authorization</strong> to test.
        </span>
      </div>

      {/* Header */}
      <div className="page-header">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="page-title">
            {greeting()},{' '}
            <span className="gradient-text">{user?.full_name || user?.username}</span> 👋
          </h1>
          <p className="page-subtitle">
            Continue your SQL injection learning journey. {workspaces.length > 0
              ? `You have ${workspaces.length} active workspace${workspaces.length === 1 ? '' : 's'}.`
              : 'Create your first workspace to get started.'}
          </p>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {stats.map((stat, i) => (
          <motion.div key={stat.label} className="stat-card" custom={i} variants={cardVariants} initial="hidden" animate="visible">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: `${stat.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <stat.icon size={18} color={stat.color} />
              </div>
              <TrendingUp size={14} color="var(--color-success)" />
            </div>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem', alignItems: 'start' }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Quick Actions */}
          <motion.section custom={4} variants={cardVariants} initial="hidden" animate="visible">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Quick Actions</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
              {quickActions.map((action, i) => (
                <Link
                  key={action.label}
                  to={action.href}
                  style={{ textDecoration: 'none' }}
                >
                  <motion.div
                    className="card"
                    style={{ padding: '1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}
                    whileHover={{ scale: 1.02, borderColor: action.color }}
                    transition={{ duration: 0.15 }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: `${action.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <action.icon size={18} color={action.color} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{action.label}</div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{action.description}</div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </motion.section>

          {/* Recent Workspaces */}
          <motion.section custom={5} variants={cardVariants} initial="hidden" animate="visible">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Recent Workspaces</h2>
              <Link to="/workspaces" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8125rem', color: 'var(--color-primary-400)', textDecoration: 'none' }}>
                View all <ArrowRight size={13} />
              </Link>
            </div>

            {workspaces.length === 0 ? (
              <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
                <FolderOpen size={32} color="var(--text-disabled)" style={{ margin: '0 auto 1rem' }} />
                <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>No workspaces yet</p>
                <Link to="/workspaces/new" className="btn btn-primary btn-sm" style={{ textDecoration: 'none' }}>
                  <Plus size={14} /> Create workspace
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {workspaces.slice(0, 5).map((ws: any) => (
                  <Link key={ws.id} to={`/workspaces/${ws.id}`} style={{ textDecoration: 'none' }}>
                    <div className="card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: ws.color || 'var(--color-primary-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', flexShrink: 0 }}>
                        {ws.icon || '📁'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ws.name}</div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                          Updated {formatDistanceToNow(new Date(ws.updated_at), { addSuffix: true })}
                        </div>
                      </div>
                      {ws.is_pinned && <span className="badge badge-blue">Pinned</span>}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </motion.section>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Learning Progress */}
          <motion.section custom={6} variants={cardVariants} initial="hidden" animate="visible">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Learning Progress</h2>
              <Link to="/knowledge" style={{ fontSize: '0.8125rem', color: 'var(--color-primary-400)', textDecoration: 'none' }}>Explore</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {learningTopics.map((topic) => (
                <Link key={topic.href} to={topic.href} style={{ textDecoration: 'none' }}>
                  <div className="card" style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.625rem' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>{topic.title}</span>
                      <span className={`badge ${difficultyColor(topic.difficulty)}`} style={{ fontSize: '0.6875rem' }}>{topic.difficulty}</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${topic.progress}%` }} />
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.375rem', textAlign: 'right' }}>
                      {topic.progress}% complete
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.section>

          {/* AI Quick Tips */}
          <motion.section custom={7} variants={cardVariants} initial="hidden" animate="visible">
            <div className="card" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(139,92,246,0.08))', borderColor: 'rgba(59,130,246,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.875rem' }}>
                <Zap size={18} color="var(--color-primary-400)" />
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>AI Learning Tip</span>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1rem' }}>
                The best way to understand SQL injection is through observation, not exploitation.
                Use the Analysis Wizard to compare normal and modified responses in your lab environment.
              </p>
              <Link to="/analysis/new" className="btn btn-primary btn-sm" style={{ textDecoration: 'none' }}>
                Start Learning <ArrowRight size={14} />
              </Link>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  )
}
