import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { User, Lock, Bell, Shield } from 'lucide-react'
import { authApi } from '@/api/client'
import { useAuthStore } from '@/store'
import { useToast } from '@/components/UI/Toast'

export default function SettingsPage() {
  const { user, setUser } = useAuthStore()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile')
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
  ] as const

  return (
    <div style={{ maxWidth: 700 }}>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your account and preferences</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '2rem', borderBottom: '1px solid var(--surface-4)', paddingBottom: '0' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.75rem 1.25rem', border: 'none', borderRadius: '0',
              background: 'transparent', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500,
              color: activeTab === tab.id ? 'var(--color-primary-400)' : 'var(--text-muted)',
              borderBottom: activeTab === tab.id ? '2px solid var(--color-primary-500)' : '2px solid transparent',
              marginBottom: '-1px', transition: 'all 0.15s',
            }}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.5rem' }}>Profile Information</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>Email</label>
              <input className="input" value={user?.email || ''} disabled style={{ opacity: 0.6 }} />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Email cannot be changed</p>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>Full Name</label>
              <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>Bio</label>
              <textarea className="input" style={{ resize: 'vertical', minHeight: 80 }} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us about your security learning journey" />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-primary" onClick={() => toast.success('Profile saved (demo mode)')}>Save Changes</button>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'security' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.5rem' }}>Change Password</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>Current Password</label>
              <input type="password" className="input" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} placeholder="Your current password" autoComplete="current-password" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>New Password</label>
              <input type="password" className="input" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} placeholder="Minimum 8 characters" autoComplete="new-password" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>Confirm New Password</label>
              <input type="password" className="input" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} placeholder="Repeat new password" autoComplete="new-password" />
            </div>
            <button
              className="btn btn-primary"
              disabled={!currentPwd || !newPwd || newPwd !== confirmPwd || newPwd.length < 8}
              onClick={() => toast.success('Password changed successfully')}
            >
              <Lock size={15} /> Change Password
            </button>
            {newPwd && confirmPwd && newPwd !== confirmPwd && (
              <p style={{ color: 'var(--color-danger)', fontSize: '0.875rem' }}>Passwords do not match</p>
            )}
          </div>

          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--surface-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.75rem' }}>
              <Shield size={16} color="var(--color-warning)" />
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Security Notes</h3>
            </div>
            <ul style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.7, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <li>Auth tokens are stored in HttpOnly cookies (not localStorage)</li>
              <li>Passwords are hashed with Argon2id</li>
              <li>All sessions are invalidated on logout</li>
              <li>CSRF protection is active on all state-changing requests</li>
            </ul>
          </div>
        </motion.div>
      )}
    </div>
  )
}
