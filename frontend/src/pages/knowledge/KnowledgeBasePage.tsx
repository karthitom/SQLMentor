import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Plus, BookOpen, Clock, Award, ArrowRight, Search } from 'lucide-react'
import { knowledgeApi } from '@/api/client'
import { useState } from 'react'

const CATEGORY_COLORS: Record<string, string> = {
  'sql-injection': 'badge-red',
  'prevention': 'badge-green',
  'owasp': 'badge-blue',
  'secure-coding': 'badge-purple',
  'databases': 'badge-yellow',
}

export default function KnowledgeBasePage() {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['knowledge', 'articles'],
    queryFn: async () => {
      const res = await knowledgeApi.listArticles()
      return res.data.articles as any[]
    },
  })

  const articles = data || []
  const categories = [...new Set(articles.map((a: any) => a.category))]

  const filtered = articles.filter((a: any) => {
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.summary?.toLowerCase().includes(search.toLowerCase())
    const matchCat = !selectedCategory || a.category === selectedCategory
    return matchSearch && matchCat
  })

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Knowledge Base</h1>
        <p className="page-subtitle">Learn SQL injection concepts, secure coding practices, and OWASP guidelines</p>
      </div>

      {/* Search + Filters */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="search"
            className="input"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Search articles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            className={`btn ${!selectedCategory ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setSelectedCategory(null)}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`btn ${selectedCategory === cat ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
              style={{ textTransform: 'capitalize' }}
            >
              {cat.replace(/-/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Articles Grid */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card skeleton" style={{ height: 180 }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
          {filtered.map((article: any, i: number) => (
            <motion.div
              key={article.slug}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link to={`/knowledge/${article.slug}`} style={{ textDecoration: 'none' }}>
                <div className="card" style={{ height: '100%', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span className={`badge ${CATEGORY_COLORS[article.category] || 'badge-gray'}`} style={{ fontSize: '0.6875rem' }}>
                        {article.category.replace(/-/g, ' ')}
                      </span>
                      {article.difficulty_level && (
                        <span className={`badge ${article.difficulty_level === 'beginner' ? 'badge-green' : article.difficulty_level === 'intermediate' ? 'badge-yellow' : 'badge-red'}`} style={{ fontSize: '0.6875rem' }}>
                          {article.difficulty_level}
                        </span>
                      )}
                    </div>
                    <BookOpen size={16} color="var(--text-disabled)" style={{ flexShrink: 0 }} />
                  </div>

                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem', lineHeight: 1.3 }}>{article.title}</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {article.summary}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <Clock size={13} />
                      {article.estimated_read_minutes} min read
                    </div>
                    {article.owasp_reference && (
                      <span style={{ color: 'var(--color-primary-400)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                        {article.owasp_reference.split('–')[0].trim()}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {filtered.length === 0 && !isLoading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <BookOpen size={40} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
          <p>No articles match your search.</p>
        </div>
      )}
    </div>
  )
}
