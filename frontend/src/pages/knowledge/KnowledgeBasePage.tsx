import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LearningRoadmap, RoadmapNode } from '@/components/Knowledge/LearningRoadmap'

export default function KnowledgeBasePage() {
  const navigate = useNavigate()

  const roadmapNodes: RoadmapNode[] = [
    { id: 'intro', title: '1. Introduction to Cybersecurity', status: 'completed' },
    { id: 'sql-basics', title: '2. SQL Basics & Refresher', status: 'completed' },
    { id: 'sql-injection-fundamentals', title: '3. SQL Injection Fundamentals', status: 'current' },
    { id: 'error-based', title: '4. Error-Based SQLi', status: 'locked' },
    { id: 'union-based', title: '5. UNION-Based SQLi', status: 'locked' },
    { id: 'blind-boolean', title: '6. Blind SQLi (Boolean)', status: 'locked' },
    { id: 'blind-time', title: '7. Blind SQLi (Time-Based)', status: 'locked' },
    { id: 'secure-coding', title: '8. Secure Coding & Mitigation', status: 'locked' },
    { id: 'final-exam', title: '9. Final Certification Exam', status: 'locked' },
  ]

  return (
    <div>
      {/* Hero Section */}
      <div className="page-header relative overflow-hidden rounded-2xl p-8 mb-12 border border-[var(--surface-3)]" 
           style={{ background: 'linear-gradient(135deg, var(--surface-2) 0%, var(--surface-1) 100%)' }}>
        <motion.div 
          className="absolute -top-32 -right-32 w-64 h-64 rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ background: 'var(--color-primary-500)' }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="relative z-10 text-center max-w-2xl mx-auto">
          <h1 className="text-4xl font-extrabold text-[var(--text-primary)] mb-4">
            SQL Injection <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary-400)] to-[var(--color-accent-400)]">Masterclass</span>
          </h1>
          <p className="text-lg text-[var(--text-secondary)]">
            Follow the roadmap below to progress from beginner to advanced. 
            Unlock interactive labs, quizzes, and earn your certification.
          </p>
        </div>
      </div>

      {/* Roadmap Container */}
      <div onClick={(e) => {
        // Simple click handler for the interactive node (MVP)
        const target = e.target as HTMLElement;
        const card = target.closest('.hover-card');
        if (card && card.textContent?.includes('SQL Injection Fundamentals')) {
          navigate('/knowledge/sql-injection-fundamentals');
        }
      }}>
        <LearningRoadmap nodes={roadmapNodes} />
      </div>
    </div>
  )
}
