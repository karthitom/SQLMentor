import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  BookOpen, Target, Award,
  TrendingUp, Zap, ArrowRight,
  Shield, Database, Star
} from 'lucide-react'
import { useAuthStore } from '@/store'
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

  const quickActions = [
    { icon: Target, label: 'Continue Learning', description: 'Resume your active learning path', href: '/paths', color: 'var(--color-primary-500)' },
    { icon: Database, label: 'SQL Playground', description: 'Practice queries safely', href: '/playground', color: 'var(--color-accent-500)' },
    { icon: BookOpen, label: 'Knowledge Base', description: 'Learn SQL injection concepts', href: '/knowledge', color: 'var(--color-success)' },
    { icon: Award, label: 'My Achievements', description: 'View unlocked badges', href: '/profile', color: 'var(--color-warning)' },
  ]

  const stats = [
    { label: 'Total XP', value: '1,250', icon: Star, color: 'var(--color-primary-500)' },
    { label: 'Current Level', value: 'Level 2', icon: Shield, color: 'var(--color-accent-500)' },
    { label: 'Completed Labs', value: '4', icon: Target, color: 'var(--color-success)' },
    { label: 'Learning Streak', value: `3d`, icon: Award, color: 'var(--color-warning)' },
  ]

  const recommendedLabs = [
    { id: 'lab-1', title: 'SQL Injection in Login Forms', difficulty: 'Beginner', xp: 100 },
    { id: 'lab-2', title: 'UNION Based Data Extraction', difficulty: 'Intermediate', xp: 250 },
    { id: 'lab-3', title: 'Blind SQL Injection (Boolean)', difficulty: 'Advanced', xp: 500 },
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
      <div className="disclaimer-banner" style={{ background: 'var(--color-primary-900)', color: 'var(--color-primary-100)', padding: '0.75rem 1rem', borderRadius: '8px', display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '2rem' }}>
        <Shield size={16} style={{ flexShrink: 0 }} />
        <span style={{ fontSize: '0.875rem' }}>
          <strong>SQLMentor Labs</strong> is a safe environment. Remember to only apply these concepts to systems you own or have explicit authorization to test.
        </span>
      </div>

      {/* Header */}
      <div className="page-header">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="page-title">
            {greeting()},{' '}
            <span className="gradient-text">{user?.full_name || user?.username || 'Student'}</span> 👋
          </h1>
          <p className="page-subtitle">
            Welcome back to your cybersecurity academy. You're 250 XP away from Level 3.
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
              <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Quick Start</h2>
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

          {/* Recommended Labs */}
          <motion.section custom={5} variants={cardVariants} initial="hidden" animate="visible">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Recommended Labs</h2>
              <Link to="/paths" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8125rem', color: 'var(--color-primary-400)', textDecoration: 'none' }}>
                View all <ArrowRight size={13} />
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {recommendedLabs.map((lab: any) => (
                <Link key={lab.id} to={`/labs/${lab.id}`} style={{ textDecoration: 'none' }}>
                  <div className="card hover-card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--color-primary-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', flexShrink: 0 }}>
                      🧪
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>{lab.title}</div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--color-primary-400)', marginTop: '4px' }}>
                        +{lab.xp} XP
                      </div>
                    </div>
                    <span className={`badge ${difficultyColor(lab.difficulty)}`}>{lab.difficulty}</span>
                  </div>
                </Link>
              ))}
            </div>
          </motion.section>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* AI Quick Tips */}
          <motion.section custom={7} variants={cardVariants} initial="hidden" animate="visible">
            <div className="card" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(139,92,246,0.08))', borderColor: 'rgba(59,130,246,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.875rem' }}>
                <Zap size={18} color="var(--color-primary-400)" />
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>AI Tutor Tip</span>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1rem' }}>
                When writing queries in the playground, I'll be there to help you analyze execution plans and spot parameterized query anti-patterns.
              </p>
              <Link to="/playground" className="btn btn-primary btn-sm" style={{ textDecoration: 'none' }}>
                Go to Playground <ArrowRight size={14} />
              </Link>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  )
}
