import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Database, Table as TableIcon, Key, FileDigit, Play } from 'lucide-react'

export function InteractiveDatabaseDiagram() {
  const [activeTable, setActiveTable] = useState<string | null>(null)
  
  const tables = [
    { 
      id: 'users', 
      name: 'users', 
      columns: ['id (PK)', 'username', 'password', 'role'],
      data: [
        { id: 1, username: 'admin', password: '***', role: 'admin' },
        { id: 2, username: 'john', password: '***', role: 'user' },
        { id: 3, username: 'jane', password: '***', role: 'user' },
      ]
    },
    { 
      id: 'products', 
      name: 'products', 
      columns: ['id (PK)', 'name', 'price', 'status'],
      data: [
        { id: 1, name: 'Laptop', price: '$999', status: 'public' },
        { id: 2, name: 'Secret Prototype', price: '$9999', status: 'draft' },
      ]
    },
  ]

  return (
    <div className="card p-6 bg-[var(--surface-1)] border border-[var(--surface-3)] relative overflow-hidden rounded-xl my-8">
      <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-primary-500)] opacity-5 blur-3xl pointer-events-none rounded-full" />
      
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[var(--surface-2)] flex items-center justify-center border border-[var(--surface-3)] shadow-md">
            <Database className="text-[var(--color-primary-400)]" size={20} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[var(--text-primary)] leading-tight">Database Visualizer</h3>
            <p className="text-[0.8rem] text-[var(--text-muted)]">Click a table to inspect its schema and data.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start min-h-[300px] relative z-10">
        {/* Table List */}
        <div className="flex flex-col gap-4 w-full lg:w-1/3">
          {tables.map((table) => (
            <motion.div 
              key={table.id}
              onClick={() => setActiveTable(activeTable === table.id ? null : table.id)}
              className={`cursor-pointer rounded-xl border-2 p-4 bg-[var(--surface-2)] transition-all shadow-sm
                ${activeTable === table.id ? 'border-[var(--color-primary-500)] shadow-[0_4px_12px_rgba(0,0,0,0.1)] shadow-[var(--color-primary-900)]' : 'border-[var(--surface-4)] hover:border-[var(--color-primary-400)]/50'}`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-3">
                <TableIcon size={18} className={activeTable === table.id ? "text-[var(--color-primary-400)]" : "text-[var(--text-secondary)]"}/>
                <span className="font-bold font-mono text-[var(--text-primary)] text-sm">{table.name}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Data Inspector */}
        <div className="w-full lg:w-2/3">
          <AnimatePresence mode="wait">
            {activeTable ? (
              <motion.div
                key={activeTable}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-[var(--surface-2)] rounded-xl border border-[var(--surface-3)] overflow-hidden shadow-lg"
              >
                <div className="bg-[#0d1117] px-4 py-2 border-b border-[var(--surface-3)] flex items-center gap-2">
                  <Play size={14} className="text-green-400" />
                  <span className="font-mono text-xs text-[var(--text-muted)]">SELECT * FROM {activeTable}</span>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm font-mono">
                    <thead className="bg-[var(--surface-3)]/50 text-[var(--text-secondary)]">
                      <tr>
                        {tables.find(t => t.id === activeTable)?.columns.map((col, idx) => (
                          <th key={idx} className="px-4 py-3 border-b border-[var(--surface-3)] font-semibold whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              {col.includes('PK') && <Key size={12} className="text-yellow-500"/>}
                              {col}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tables.find(t => t.id === activeTable)?.data.map((row, rowIdx) => (
                        <motion.tr 
                          key={rowIdx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: rowIdx * 0.1 }}
                          className="border-b border-[var(--surface-3)]/50 hover:bg-[var(--surface-3)]/30 transition-colors"
                        >
                          {Object.values(row).map((val, valIdx) => (
                            <td key={valIdx} className="px-4 py-3 text-[var(--text-primary)]">
                              {val === '***' ? <span className="text-[var(--text-disabled)] tracking-widest">{val}</span> : val}
                            </td>
                          ))}
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            ) : (
              <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-[var(--text-muted)] border-2 border-dashed border-[var(--surface-3)] rounded-xl bg-[var(--surface-2)]/50">
                <FileDigit size={32} className="mb-3 opacity-50" />
                <p className="font-medium">Select a table to view data</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
