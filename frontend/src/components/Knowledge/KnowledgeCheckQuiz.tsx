import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, Award } from 'lucide-react'

interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation: string;
}

interface KnowledgeCheckQuizProps {
  question: string;
  options: QuizOption[];
  onComplete?: (passed: boolean) => void;
}

export function KnowledgeCheckQuiz({ question, options, onComplete }: KnowledgeCheckQuizProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  
  const selectedOption = options.find(o => o.id === selectedId)
  const isCorrect = selectedOption?.isCorrect

  const handleSubmit = () => {
    if (!selectedId) return
    setHasSubmitted(true)
    if (onComplete) onComplete(isCorrect || false)
  }

  return (
    <div className="card p-8 bg-gradient-to-br from-[var(--surface-1)] to-[var(--surface-2)] my-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-[var(--color-primary-900)] flex items-center justify-center">
          <Award className="text-[var(--color-primary-400)]" size={20} />
        </div>
        <h3 className="text-xl font-bold text-[var(--text-primary)]">Knowledge Check</h3>
      </div>
      
      <p className="text-lg text-[var(--text-secondary)] mb-6 font-medium">{question}</p>
      
      <div className="space-y-3 mb-6">
        {options.map((option) => {
          const isSelected = selectedId === option.id;
          let bgClass = "bg-[var(--surface-1)] border-[var(--surface-3)] hover:border-[var(--color-primary-500)]";
          let icon = null;
          
          if (hasSubmitted) {
            if (option.isCorrect) {
              bgClass = "bg-green-900/20 border-green-500/50"
              icon = <Check size={18} className="text-green-400" />
            } else if (isSelected && !option.isCorrect) {
              bgClass = "bg-red-900/20 border-red-500/50"
              icon = <X size={18} className="text-red-400" />
            } else {
              bgClass = "bg-[var(--surface-1)] border-[var(--surface-3)] opacity-50"
            }
          } else if (isSelected) {
            bgClass = "bg-[var(--color-primary-900)] border-[var(--color-primary-500)]"
          }
          
          return (
            <motion.div 
              key={option.id}
              onClick={() => !hasSubmitted && setSelectedId(option.id)}
              className={`p-4 rounded-xl border-2 cursor-pointer flex items-center justify-between transition-colors ${bgClass}`}
              whileHover={!hasSubmitted ? { scale: 1.01 } : {}}
              whileTap={!hasSubmitted ? { scale: 0.99 } : {}}
            >
              <span className={`text-[var(--text-primary)] ${isSelected ? 'font-semibold' : ''}`}>{option.text}</span>
              {icon && <span>{icon}</span>}
            </motion.div>
          )
        })}
      </div>
      
      <AnimatePresence>
        {hasSubmitted && selectedOption && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className={`p-4 rounded-lg mb-6 ${isCorrect ? 'bg-green-900/20 text-green-200' : 'bg-red-900/20 text-red-200'}`}
          >
            <strong>{isCorrect ? 'Correct!' : 'Incorrect.'}</strong> {selectedOption.explanation}
          </motion.div>
        )}
      </AnimatePresence>
      
      {!hasSubmitted && (
        <button 
          className="btn btn-primary w-full py-3 text-base"
          disabled={!selectedId}
          onClick={handleSubmit}
        >
          Check Answer
        </button>
      )}
    </div>
  )
}
