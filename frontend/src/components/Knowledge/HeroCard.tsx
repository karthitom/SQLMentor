import React from 'react'
import { motion } from 'framer-motion'
import { Play, Bookmark, Share2, Heart, Clock, Star, Target } from 'lucide-react'

interface HeroCardProps {
  title: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  moduleNumber: number;
  estimatedTime: string;
  xpReward: number;
  completionPercentage: number;
  learningObjectives: string[];
}

export function HeroCard({
  title, category, difficulty, moduleNumber, estimatedTime, xpReward, completionPercentage, learningObjectives
}: HeroCardProps) {
  
  const difficultyColor = 
    difficulty === 'Beginner' ? 'badge-green' : 
    difficulty === 'Intermediate' ? 'badge-yellow' : 'badge-red'

  return (
    <div className="relative overflow-hidden rounded-xl border border-[var(--surface-4)] p-8 mb-8"
         style={{ background: 'linear-gradient(135deg, var(--surface-2) 0%, var(--surface-1) 100%)' }}>
      
      {/* Animated Background Gradients */}
      <motion.div 
        className="absolute -top-32 -right-32 w-64 h-64 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: 'var(--color-primary-500)' }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.3, 0.2] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="absolute -bottom-32 -left-32 w-64 h-64 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: 'var(--color-accent-500)' }}
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.2, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 flex flex-col md:flex-row gap-8 justify-between">
        
        {/* Left Side: Meta & Titles */}
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="badge badge-blue">Module {moduleNumber}</span>
            <span className={`badge ${difficultyColor}`}>{difficulty}</span>
            <span className="badge badge-gray">{category}</span>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight mb-4 leading-tight">
            {title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-6 text-[var(--text-muted)] text-sm mb-6 font-medium">
            <div className="flex items-center gap-2"><Clock size={16} className="text-[var(--color-primary-400)]"/> {estimatedTime}</div>
            <div className="flex items-center gap-2"><Star size={16} className="text-[var(--color-warning)]"/> {xpReward} XP</div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} className={i < 4 ? "text-yellow-500 fill-yellow-500" : "text-gray-500"} />
                ))}
              </span>
              (1.2k ratings)
            </div>
          </div>
          
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3 uppercase tracking-wider flex items-center gap-2">
              <Target size={16}/> Learning Objectives
            </h3>
            <ul className="space-y-2">
              {learningObjectives.map((obj, i) => (
                <li key={i} className="flex items-start gap-2 text-[var(--text-muted)] text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary-500)] mt-1.5 flex-shrink-0" />
                  {obj}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <button className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}>
              <Play size={18} fill="currentColor" /> Continue Learning
            </button>
            <button className="btn btn-secondary !p-3 rounded-lg hover:bg-[var(--surface-3)]" title="Bookmark">
              <Bookmark size={20} />
            </button>
            <button className="btn btn-secondary !p-3 rounded-lg hover:bg-[var(--surface-3)]" title="Favorite">
              <Heart size={20} />
            </button>
            <button className="btn btn-secondary !p-3 rounded-lg hover:bg-[var(--surface-3)]" title="Share">
              <Share2 size={20} />
            </button>
          </div>
        </div>
        
        {/* Right Side: Progress Ring */}
        <div className="flex-shrink-0 flex flex-col items-center justify-center bg-[var(--surface-2)] p-6 rounded-2xl border border-[var(--surface-3)]">
          <div className="relative w-32 h-32 mb-4">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" stroke="var(--surface-4)" strokeWidth="8" fill="none" />
              <motion.circle 
                cx="50" cy="50" r="40" 
                stroke="var(--color-success)" strokeWidth="8" fill="none"
                strokeLinecap="round"
                initial={{ strokeDasharray: "0 251.2" }}
                animate={{ strokeDasharray: `${(completionPercentage / 100) * 251.2} 251.2` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-2xl font-bold text-[var(--text-primary)]">{completionPercentage}%</span>
            </div>
          </div>
          <span className="text-sm font-medium text-[var(--text-muted)]">Module Progress</span>
        </div>
      </div>
    </div>
  )
}
