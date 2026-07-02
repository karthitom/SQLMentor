import { useParams, Link } from 'react-router-dom'
import { FolderOpen, Plus, ArrowLeft } from 'lucide-react'
export default function WorkspaceDetailPage() {
  const { id } = useParams<{ id: string }>()
  return (
    <div>
      <Link to="/workspaces" className="btn btn-ghost btn-sm" style={{ marginBottom: '1.5rem', display: 'inline-flex', gap: '0.5rem', alignItems: 'center', textDecoration: 'none' }}>
        <ArrowLeft size={15} /> Back to Workspaces
      </Link>
      <div className="page-header">
        <h1 className="page-title">Workspace</h1>
        <p className="page-subtitle">ID: {id}</p>
      </div>
      <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
        <FolderOpen size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
        <p style={{ marginBottom: '1.5rem' }}>No projects in this workspace yet</p>
        <Link to="/analysis/new" className="btn btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
          <Plus size={16} /> New Project &amp; Analysis
        </Link>
      </div>
    </div>
  )
}
