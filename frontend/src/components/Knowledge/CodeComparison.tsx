import React from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'

interface CodeComparisonProps {
  vulnerableCode: string;
  secureCode: string;
  explanation: string;
}

export function CodeComparison({ vulnerableCode, secureCode, explanation }: CodeComparisonProps) {
  return (
    <div className="my-8">
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Vulnerable Side */}
        <motion.div 
          className="flex-1 border border-red-900/50 rounded-xl overflow-hidden bg-[var(--surface-1)]"
          whileHover={{ y: -2 }}
        >
          <div className="bg-red-900/20 p-3 border-b border-red-900/50 flex items-center gap-2">
            <AlertTriangle size={18} className="text-red-400" />
            <span className="font-bold text-red-400 text-sm">Vulnerable Implementation</span>
          </div>
          <div className="p-4 overflow-x-auto text-sm font-mono text-red-200">
            <pre><code>{vulnerableCode}</code></pre>
          </div>
        </motion.div>

        {/* Secure Side */}
        <motion.div 
          className="flex-1 border border-green-900/50 rounded-xl overflow-hidden bg-[var(--surface-1)]"
          whileHover={{ y: -2 }}
        >
          <div className="bg-green-900/20 p-3 border-b border-green-900/50 flex items-center gap-2">
            <CheckCircle2 size={18} className="text-green-400" />
            <span className="font-bold text-green-400 text-sm">Secure Implementation</span>
          </div>
          <div className="p-4 overflow-x-auto text-sm font-mono text-green-200">
            <pre><code>{secureCode}</code></pre>
          </div>
        </motion.div>
        
      </div>
      
      {/* Explanation Footer */}
      <div className="mt-4 p-4 rounded-lg bg-[var(--surface-2)] border border-[var(--surface-3)] text-sm text-[var(--text-secondary)]">
        <strong>Why is this secure?</strong> {explanation}
      </div>
    </div>
  )
}
