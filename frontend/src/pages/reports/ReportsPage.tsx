import { FileText, Plus, Download } from 'lucide-react'
export default function ReportsPage() {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Reports</h1>
        <p className="page-subtitle">Generate and export educational analysis reports</p>
      </div>
      <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
        <FileText size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
        <p style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>No reports yet</p>
        <p style={{ marginBottom: '1.5rem' }}>Complete an analysis to generate your first educational report</p>
        <a href="/analysis/new" className="btn btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
          <Plus size={16} /> Start Analysis
        </a>
      </div>
    </div>
  )
}
