import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Editor from '@monaco-editor/react'
import { Play, Database, AlertCircle, CheckCircle2, Loader2, Sparkles } from 'lucide-react'
import initSqlJs, { Database as SqlJsDatabase } from 'sql.js'

export function SQLPlayground() {
  const [query, setQuery] = useState('SELECT * FROM users;\n')
  const [db, setDb] = useState<SqlJsDatabase | null>(null)
  const [results, setResults] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isExecuting, setIsExecuting] = useState(false)
  const [aiFeedback, setAiFeedback] = useState<string | null>(null)

  useEffect(() => {
    async function initDB() {
      try {
        const SQL = await initSqlJs({
          locateFile: file => `/${file}`
        })
        
        const database = new SQL.Database()
        
        // Setup initial vulnerable schema
        database.run(`
          CREATE TABLE users (
            id INTEGER PRIMARY KEY,
            username TEXT,
            password TEXT,
            role TEXT
          );
          INSERT INTO users VALUES (1, 'admin', 'super_secret_admin_hash', 'admin');
          INSERT INTO users VALUES (2, 'john', 'hashed_pass_123', 'user');
          INSERT INTO users VALUES (3, 'jane', 'hashed_pass_456', 'user');

          CREATE TABLE products (
            id INTEGER PRIMARY KEY,
            name TEXT,
            price REAL,
            status TEXT
          );
          INSERT INTO products VALUES (1, 'Laptop', 999.99, 'public');
          INSERT INTO products VALUES (2, 'Mouse', 49.99, 'public');
          INSERT INTO products VALUES (3, 'Secret Prototype', 9999.99, 'draft');
        `)
        
        setDb(database)
      } catch (err: any) {
        setError("Failed to initialize WebAssembly SQLite engine. " + err.message)
      } finally {
        setIsLoading(false)
      }
    }
    
    initDB()
    
    return () => {
      if (db) db.close()
    }
  }, [])

  const handleExecute = async () => {
    if (!db) return
    setIsExecuting(true)
    setError(null)
    setResults([])
    setAiFeedback(null)
    
    // Simulate network delay for realism
    await new Promise(r => setTimeout(r, 600))
    
    try {
      const res = db.exec(query)
      if (res.length > 0) {
        setResults(res)
      } else {
        setResults([])
      }
      
      // Simple frontend mock AI feedback for the MVP
      if (query.toLowerCase().includes('or 1=1')) {
        setAiFeedback("Warning: Your query contains a classic 'OR 1=1' condition, a common hallmark of SQL Injection payloads. In a real environment, this forces the WHERE clause to evaluate to true for all rows.")
      }
      if (query.toLowerCase().includes('drop table')) {
        setAiFeedback("Danger: DROP TABLE detected. This is a destructive operation. While safe in this sandbox, executing this against a production database would cause critical data loss.")
      }

    } catch (err: any) {
      setError(err.message)
      setAiFeedback(`Your query generated an error: ${err.message}. Check your syntax. Pay close attention to quotes and missing semicolons.`)
    } finally {
      setIsExecuting(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-[var(--surface-1)] rounded-xl border border-[var(--surface-3)] overflow-hidden shadow-lg">
      <div className="flex items-center justify-between p-3 border-b border-[var(--surface-3)] bg-[var(--surface-2)]">
        <div className="flex items-center gap-2">
          <Database size={18} className="text-[var(--color-primary-400)]" />
          <span className="font-bold text-sm text-[var(--text-primary)]">Interactive SQL Sandbox</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
            {isLoading ? <><Loader2 size={12} className="animate-spin" /> Engine Loading...</> : <><CheckCircle2 size={12} className="text-green-500" /> SQLite WASM Ready</>}
          </span>
          <button 
            className="btn btn-primary btn-sm px-4 flex items-center gap-2"
            onClick={handleExecute}
            disabled={isLoading || isExecuting || !query.trim()}
          >
            {isExecuting ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
            Run Query
          </button>
        </div>
      </div>
      
      <div className="flex flex-col lg:flex-row flex-1 min-h-0">
        {/* Editor Pane */}
        <div className="w-full lg:w-1/2 border-b lg:border-b-0 lg:border-r border-[var(--surface-3)] h-64 lg:h-auto">
          <Editor
            height="100%"
            defaultLanguage="sql"
            theme="vs-dark"
            value={query}
            onChange={(val) => setQuery(val || '')}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: 'JetBrains Mono, monospace',
              padding: { top: 16 },
              scrollBeyondLastLine: false,
            }}
          />
        </div>
        
        {/* Results Pane */}
        <div className="w-full lg:w-1/2 flex flex-col bg-[#0d1117] h-64 lg:h-auto overflow-hidden relative">
          
          {aiFeedback && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="m-3 p-3 bg-indigo-900/40 border border-indigo-500/50 rounded-lg flex items-start gap-3 relative z-10 shadow-lg backdrop-blur-sm"
            >
              <Sparkles size={16} className="text-indigo-400 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-indigo-300 text-xs uppercase tracking-wider block mb-1">AI Mentor Note</span>
                <p className="text-indigo-100 text-sm leading-relaxed">{aiFeedback}</p>
              </div>
            </motion.div>
          )}

          <div className="flex-1 overflow-auto p-4 custom-scrollbar">
            {error ? (
              <div className="flex items-start gap-3 text-red-400 bg-red-950/30 p-4 rounded-lg border border-red-900/50">
                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                <div className="font-mono text-sm">{error}</div>
              </div>
            ) : results.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm font-mono border-collapse">
                  <thead className="bg-[#161b22] text-[#8b949e]">
                    <tr>
                      {results[0].columns.map((col: string, idx: number) => (
                        <th key={idx} className="px-4 py-2 border-b border-[#30363d] font-semibold">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results[0].values.map((row: any[], rowIdx: number) => (
                      <tr key={rowIdx} className="hover:bg-[#161b22]/50 transition-colors">
                        {row.map((val: any, valIdx: number) => (
                          <td key={valIdx} className="px-4 py-2 border-b border-[#30363d]/50 text-[#c9d1d9] whitespace-nowrap">
                            {val === null ? <span className="italic opacity-50">NULL</span> : String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              !isExecuting && !aiFeedback && (
                <div className="h-full flex flex-col items-center justify-center text-[#8b949e] opacity-50">
                  <Database size={48} className="mb-4" />
                  <p>Execute a query to see results</p>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
