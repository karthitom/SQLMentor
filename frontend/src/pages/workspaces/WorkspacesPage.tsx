import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, FolderOpen, Archive, Pin, Trash2, MoreVertical } from 'lucide-react'
import { workspacesApi } from '@/api/client'
import { useState } from 'react'
import { useToast } from '@/components/UI/Toast'
import { formatDistanceToNow } from 'date-fns'

export default function WorkspacesPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')

  const { data: workspaces = [], isLoading } = useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const res = await workspacesApi.list()
      return res.data as any[]
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description: string }) => workspacesApi.create(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] })
      setShowCreateModal(false)
      setNewName('')
      setNewDesc('')
      toast.success('Workspace created')
      navigate(`/workspaces/${res.data.id}`)
    },
    onError: () => toast.error('Failed to create workspace'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => workspacesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] })
      toast.success('Workspace deleted')
    },
    onError: () => toast.error('Failed to delete workspace'),
  })

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Workspaces</h1>
          <p className="page-subtitle">Organize your lab analyses and learning projects</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)} id="create-workspace-btn">
          <Plus size={16} /> New Workspace
        </button>
      </div>

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {[...Array(4)].map((_, i) => <div key={i} className="card skeleton" style={{ height: 160 }} />)}
        </div>
      ) : workspaces.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <FolderOpen size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
          <p style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>No workspaces yet</p>
          <p style={{ marginBottom: '1.5rem', fontSize: '0.9375rem' }}>Create your first workspace to start organizing lab analyses</p>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} /> Create Workspace
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {workspaces.map((ws: any, i: number) => (
            <motion.div key={ws.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <div className="card" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div
                    style={{ width: 44, height: 44, borderRadius: 12, background: ws.color || 'linear-gradient(135deg, var(--color-primary-700), var(--color-accent-700))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', cursor: 'pointer' }}
                    onClick={() => navigate(`/workspaces/${ws.id}`)}
                  >
                    {ws.icon || '📁'}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {ws.is_pinned && <span className="badge badge-blue" style={{ fontSize: '0.6875rem' }}>📌 Pinned</span>}
                  </div>
                </div>
                <div onClick={() => navigate(`/workspaces/${ws.id}`)}>
                  <h3 style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.375rem' }}>{ws.name}</h3>
                  {ws.description && <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{ws.description}</p>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  <span>Updated {formatDistanceToNow(new Date(ws.updated_at), { addSuffix: true })}</span>
                  <button
                    className="btn btn-danger btn-sm"
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                    onClick={(e) => { e.stopPropagation(); if (confirm('Delete this workspace and all its data?')) deleteMutation.mutate(ws.id) }}
                    aria-label="Delete workspace"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card" style={{ width: '100%', maxWidth: 480, padding: '2rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.5rem' }}>Create Workspace</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>Name *</label>
                <input className="input" placeholder="My Lab Workspace" value={newName} onChange={(e) => setNewName(e.target.value)} id="create-workspace-name" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>Description</label>
                <textarea className="input" style={{ resize: 'vertical', minHeight: 80 }} placeholder="What are you studying in this workspace?" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button className="btn btn-primary" disabled={!newName.trim() || createMutation.isPending} onClick={() => createMutation.mutate({ name: newName.trim(), description: newDesc })} id="create-workspace-submit">
                  {createMutation.isPending ? 'Creating...' : 'Create Workspace'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
