import React from 'react'
import { motion } from 'framer-motion'

export default function LearningPathsPage() {
  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Learning Paths</h1>
        <p className="page-subtitle">Structured tracks to master SQL Injection concepts safely.</p>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
      >
        <div className="card hover-card p-6">
          <h3 className="text-xl font-bold mb-2">SQL Injection Fundamentals</h3>
          <p className="text-muted mb-4">Learn the basics of SQL injection, why it happens, and how to spot it.</p>
          <div className="flex justify-between items-center text-sm text-muted">
            <span>5 Modules</span>
            <span>2 Hours</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
