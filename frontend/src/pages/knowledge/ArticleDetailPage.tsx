import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronRight, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { HeroCard } from '@/components/Knowledge/HeroCard'
import { InteractiveDatabaseDiagram } from '@/components/Knowledge/InteractiveDatabaseDiagram'
import { SQLExecutionSimulator } from '@/components/Knowledge/SQLExecutionSimulator'
import { CodeComparison } from '@/components/Knowledge/CodeComparison'
import { KnowledgeCheckQuiz } from '@/components/Knowledge/KnowledgeCheckQuiz'
import { AITutorSidebar } from '@/components/Knowledge/AITutorSidebar'
import { SQLPlayground } from '@/components/Playground/SQLPlayground'
import { useAuthStore, useNotificationStore } from '@/store'

export default function ArticleDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { user, setUser } = useAuthStore()
  const { addToast } = useNotificationStore()
  const [isCompleting, setIsCompleting] = useState(false)
  const [showCompletionConfetti, setShowCompletionConfetti] = useState(false)

  // Hardcoded for MVP, usually fetched from backend
  const moduleId = "sql-fundamentals-01"
  const xpReward = 250
  
  const handleCompleteModule = async () => {
    setIsCompleting(true)
    try {
      const res = await fetch("http://localhost:8000/api/v1/gamification/complete-module", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module_id: moduleId, xp_earned: xpReward })
      })
      
      if (res.ok) {
        const data = await res.json()
        setShowCompletionConfetti(true)
        
        // Update local user state
        if (user) {
          setUser({
            ...user,
            xp: data.new_total_xp,
            level: data.new_level,
            badges: [...(user.badges || []), ...data.badges_earned],
            completed_modules: [...(user.completed_modules || []), moduleId]
          })
        }
        
        addToast({
          type: "success",
          message: `You earned ${data.xp_awarded} XP!`,
          duration: 5000
        })

        if (data.level_up) {
           addToast({
              type: "info",
              message: `You reached Level ${data.new_level}!`,
              duration: 8000
           })
        }

        setTimeout(() => {
          navigate('/knowledge')
        }, 3000)
      } else {
        throw new Error("Failed to complete module")
      }
    } catch (err) {
      addToast({ type: "error", message: "Failed to save progress." })
      setIsCompleting(false)
    }
  }

  const isAlreadyCompleted = user?.completed_modules?.includes(moduleId)

  return (
    <div className="relative pb-24">
      {/* Completion Overlay */}
      <AnimatePresence>
        {showCompletionConfetti && (
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
           >
             <motion.div 
               initial={{ scale: 0.8, y: 50 }}
               animate={{ scale: 1, y: 0 }}
               className="bg-[var(--surface-2)] p-10 rounded-2xl border border-[var(--color-primary-500)] text-center max-w-md shadow-[0_0_50px_var(--color-primary-500)]"
             >
                <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 size={40} className="text-green-400" />
                </div>
                <h2 className="text-3xl font-extrabold text-white mb-2">Module Complete!</h2>
                <p className="text-xl text-[var(--color-primary-400)] font-bold mb-6">+{xpReward} XP Earned</p>
                <p className="text-[var(--text-secondary)] mb-8">Great job mastering SQL Injection Fundamentals. Redirecting you back to the roadmap...</p>
             </motion.div>
           </motion.div>
        )}
      </AnimatePresence>


      <button
        className="btn btn-ghost btn-sm mb-6 flex items-center gap-2"
        onClick={() => navigate('/knowledge')}
      >
        <ArrowLeft size={16} /> Back to Roadmap
      </button>

      {/* Hero Section */}
      <HeroCard 
        title="SQL Injection Fundamentals"
        category="Vulnerability"
        difficulty="Beginner"
        moduleNumber={3}
        estimatedTime="15 mins"
        xpReward={xpReward}
        completionPercentage={isAlreadyCompleted ? 100 : 20}
        learningObjectives={[
          "Understand how user input interacts with database queries",
          "Identify common injection entry points in web applications",
          "Learn how string concatenation causes logic subversion",
          "Recognize the importance of parameterized queries"
        ]}
      />

      <div className="max-w-4xl mx-auto space-y-16 mt-12">
        
        {/* Section 1: Introduction */}
        <section className="prose prose-invert max-w-none">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">What is SQL Injection?</h2>
          <p className="text-[var(--text-secondary)] text-lg leading-relaxed mb-6">
            SQL Injection (SQLi) is a critical web security vulnerability that allows an attacker to interfere with the queries that an application makes to its database. It occurs when untrusted user input is directly concatenated into a dynamic SQL query without proper sanitization or parameterization.
          </p>
        </section>

        {/* Section 2: Database Visualization */}
        <section>
          <InteractiveDatabaseDiagram />
        </section>

        {/* Section 3: The Mechanics of Injection */}
        <section className="prose prose-invert max-w-none">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">The Mechanics of Injection</h2>
          <p className="text-[var(--text-secondary)] text-lg leading-relaxed mb-6">
            Imagine a simple login form. The application takes the username and password, and constructs a query like this:
            <br/><br/>
            <code className="bg-[var(--surface-3)] px-2 py-1 rounded text-[var(--color-primary-400)]">SELECT * FROM users WHERE username = 'USER_INPUT' AND password = 'PASSWORD_INPUT'</code>
            <br/><br/>
            If an attacker enters <code className="text-red-400 font-bold">' OR 1=1--</code> as the username, the resulting query becomes dangerously modified. Let's see how the execution engine processes this.
          </p>
        </section>

        {/* Section 4: Execution Simulator */}
        <section>
          <SQLExecutionSimulator />
        </section>

        {/* Section 5: Interactive Playground */}
        <section className="h-[600px] mb-24">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Hands-on: Try it yourself</h2>
          <p className="text-[var(--text-secondary)] mb-6">Use the interactive playground below to write SQL queries against the mock database. Try fetching the `users` table or modifying the query to bypass conditions.</p>
          <SQLPlayground />
        </section>

        {/* Section 6: Secure Coding */}
        <section>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Prevention & Mitigation</h2>
          <p className="text-[var(--text-secondary)] mb-6">The only foolproof way to prevent SQL Injection is by separating the query structure from the user data. This is achieved using Parameterized Queries (Prepared Statements).</p>
          
          <CodeComparison 
            vulnerableCode={`// Node.js Express Example (Vulnerable)
app.post('/login', async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  
  // DANGER: String concatenation allows SQL injection
  const query = \`SELECT * FROM users WHERE username = '\${username}' AND password = '\${password}'\`;
  
  const result = await db.execute(query);
  if (result.rows.length > 0) {
    loginUser(req, res);
  }
});`}
            secureCode={`// Node.js Express Example (Secure)
app.post('/login', async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  
  // SAFE: Using parameterized queries (?)
  const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
  
  // The database driver safely escapes the parameters
  const result = await db.execute(query, [username, password]);
  
  if (result.rows.length > 0) {
    loginUser(req, res);
  }
});`}
            explanation="Parameterized queries force the database to treat user input as data, not as executable code. Even if the input contains SQL commands, it is safely escaped."
          />
        </section>

        {/* Section 7: Knowledge Check */}
        <section>
          <KnowledgeCheckQuiz 
            question="Which of the following techniques is the most effective defense against SQL Injection?"
            options={[
              { id: 'a', text: 'Encoding all user input to Base64', isCorrect: false, explanation: 'Encoding does not remove the dangerous characters, it just changes their format. The database will decode it and execute it.' },
              { id: 'b', text: 'Using Parameterized Queries (Prepared Statements)', isCorrect: true, explanation: 'Parameterized queries ensure that the database driver safely separates the query structure from the data.' },
              { id: 'c', text: 'Validating input on the frontend using JavaScript', isCorrect: false, explanation: 'Frontend validation can be easily bypassed by intercepting the request with a proxy (like Burp Suite) or using curl.' },
              { id: 'd', text: 'Using a Web Application Firewall (WAF)', isCorrect: false, explanation: 'While a WAF helps, it is not foolproof. Attackers frequently find bypasses for WAF rules. Secure coding is the primary defense.' }
            ]}
            onComplete={(passed) => {
              if (passed && !isAlreadyCompleted) {
                 addToast({ type: "info", message: "Knowledge Check Passed! You are ready to complete the module." })
              }
            }}
          />
        </section>
        
        <div className="flex justify-between items-center mt-12 border-t border-[var(--surface-3)] pt-8 pb-12">
          <div>
             {isAlreadyCompleted && (
                <div className="flex items-center gap-2 text-green-500 font-bold">
                  <CheckCircle2 size={20} /> Module Completed
                </div>
             )}
          </div>
          <button 
            className="btn btn-primary px-8 py-3 text-lg font-bold shadow-lg shadow-[var(--color-primary-500)]/20" 
            onClick={handleCompleteModule}
            disabled={isCompleting || isAlreadyCompleted}
          >
            {isCompleting ? 'Saving Progress...' : isAlreadyCompleted ? 'Review Finished' : 'Complete Module & Earn XP'} <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* AI Tutor */}
      <AITutorSidebar />
    </div>
  )
}
