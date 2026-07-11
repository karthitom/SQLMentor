import React from 'react'
import { motion } from 'framer-motion'
import { Check, Lock, Play } from 'lucide-react'

export interface RoadmapNode {
  id: string;
  title: string;
  status: 'completed' | 'current' | 'locked';
}

interface LearningRoadmapProps {
  nodes: RoadmapNode[];
}

export function LearningRoadmap({ nodes }: LearningRoadmapProps) {
  return (
    <div className="relative py-12 px-4 max-w-4xl mx-auto">
      {/* SVG Connecting Line */}
      <div className="absolute left-[27px] md:left-1/2 top-0 bottom-0 w-[2px] bg-[var(--surface-4)] -translate-x-1/2" />
      
      <div className="space-y-12">
        {nodes.map((node, i) => {
          const isLeft = i % 2 === 0;
          
          return (
            <motion.div 
              key={node.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`relative flex items-center ${isLeft ? 'md:flex-row-reverse' : 'md:flex-row'}`}
            >
              {/* Timeline Dot */}
              <div className="absolute left-[27px] md:left-1/2 -translate-x-1/2 flex items-center justify-center w-10 h-10 rounded-full border-4 border-[var(--surface-1)] shadow-sm z-10"
                   style={{ 
                     backgroundColor: node.status === 'completed' ? 'var(--color-success)' : 
                                      node.status === 'current' ? 'var(--color-primary-500)' : 
                                      'var(--surface-4)'
                   }}>
                {node.status === 'completed' && <Check size={16} className="text-white" />}
                {node.status === 'current' && <Play size={16} className="text-white ml-0.5" />}
                {node.status === 'locked' && <Lock size={16} className="text-[var(--text-disabled)]" />}
              </div>
              
              {/* Content Card */}
              <div className={`w-full md:w-1/2 pl-16 md:pl-0 ${isLeft ? 'md:pr-16 md:text-right' : 'md:pl-16'}`}>
                <motion.div 
                  whileHover={node.status !== 'locked' ? { scale: 1.02 } : {}}
                  className={`card p-5 ${node.status === 'locked' ? 'opacity-60 cursor-not-allowed' : 'hover-card cursor-pointer'}`}
                  style={{ 
                    borderColor: node.status === 'current' ? 'var(--color-primary-500)' : 'var(--surface-3)'
                  }}
                >
                  <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">{node.title}</h3>
                  <p className="text-sm text-[var(--text-muted)]">
                    {node.status === 'completed' ? 'Completed' : 
                     node.status === 'current' ? 'Up Next' : 'Locked'}
                  </p>
                </motion.div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
