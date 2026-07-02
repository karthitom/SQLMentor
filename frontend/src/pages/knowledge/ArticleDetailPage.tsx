import { useQuery } from '@tanstack/react-query'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Clock, BookOpen, ExternalLink, CheckCircle } from 'lucide-react'
import { knowledgeApi } from '@/api/client'
// Article content is rendered as pre-formatted text for safety (no XSS via dangerouslySetInnerHTML)

export default function ArticleDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()

  const { data: article, isLoading, isError } = useQuery({
    queryKey: ['knowledge', 'article', slug],
    queryFn: async () => {
      const res = await knowledgeApi.getArticle(slug!)
      return res.data
    },
    enabled: !!slug,
  })

  if (isLoading) {
    return (
      <div style={{ maxWidth: 720 }}>
        <div className="skeleton" style={{ height: 32, width: '60%', marginBottom: '1rem' }} />
        <div className="skeleton" style={{ height: 20, width: '80%', marginBottom: '2rem' }} />
        {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 16, marginBottom: '0.625rem' }} />)}
      </div>
    )
  }

  if (isError || !article) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <p style={{ color: 'var(--text-muted)' }}>Article not found.</p>
        <Link to="/knowledge" className="btn btn-primary btn-sm" style={{ textDecoration: 'none', marginTop: '1rem', display: 'inline-flex' }}>
          Back to Knowledge Base
        </Link>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 760 }}>
      {/* Back button */}
      <button
        className="btn btn-ghost btn-sm"
        onClick={() => navigate('/knowledge')}
        style={{ marginBottom: '1.5rem', gap: '0.5rem', display: 'flex', alignItems: 'center' }}
      >
        <ArrowLeft size={15} /> Back to Knowledge Base
      </button>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          {article.difficulty_level && (
            <span className={`badge ${article.difficulty_level === 'beginner' ? 'badge-green' : article.difficulty_level === 'intermediate' ? 'badge-yellow' : 'badge-red'}`}>
              {article.difficulty_level}
            </span>
          )}
          {article.owasp_reference && <span className="badge badge-blue">{article.owasp_reference.split('–')[0].trim()}</span>}
          {article.cwe_reference && <span className="badge badge-purple">{article.cwe_reference.split(',')[0].trim()}</span>}
        </div>

        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2, marginBottom: '0.75rem' }}>
          {article.title}
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <Clock size={14} />
            {article.estimated_read_minutes} min read
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <BookOpen size={14} />
            {article.category?.replace(/-/g, ' ')}
          </div>
        </div>
      </motion.div>

      {/* Article Content — rendered as pre-formatted markdown */}
      <motion.div
        className="card article-content"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{ padding: '2rem' }}
      >
        {/* Safe text rendering — no dangerouslySetInnerHTML */}
        <pre style={{
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          fontFamily: 'var(--font-sans)', lineHeight: 1.7,
          color: 'var(--text-secondary)', fontSize: '0.9375rem',
        }}>
          {article.content_markdown}
        </pre>
      </motion.div>

      {/* Tags */}
      {article.tags?.length > 0 && (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
          {article.tags.map((tag: string) => (
            <span key={tag} className="badge badge-gray">{tag}</span>
          ))}
        </div>
      )}
    </div>
  )
}
