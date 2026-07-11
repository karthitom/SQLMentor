import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Server, Database, Code, ShieldAlert, Cpu, Activity, Send, CheckCircle2 } from 'lucide-react'

export function SQLExecutionSimulator() {
  const [step, setStep] = useState(0)
  
  const steps = [
    { label: "User Input", desc: "Attacker types payload ' OR 1=1-- into the login form's username field.", icon: Code, code: "' OR 1=1--" },
    { label: "Application", desc: "The frontend sends the raw payload to the backend server via HTTP POST.", icon: Send, code: "POST /login\nusername=' OR 1=1--" },
    { label: "Query Construction", desc: "The backend concatenates the payload into a raw SQL string.", icon: Server, code: "SELECT * FROM users\nWHERE user='' OR 1=1--'\nAND pass=''" },
    { label: "SQL Parser", desc: "The database parses the string into an Abstract Syntax Tree (AST). The '--' comments out the password check.", icon: ShieldAlert, code: "AST:\n- SELECT *\n- FROM users\n- WHERE (user='') OR (1=1)" },
    { label: "Optimizer", desc: "The DB engine realizes '1=1' is always true, optimizing the execution plan to scan all rows.", icon: Cpu, code: "Plan: TableScan (users)" },
    { label: "Execution Engine", desc: "The engine executes the plan. Because the condition is always true, it retrieves the first row (usually admin).", icon: Activity, code: "Fetching Row 1 (admin)" },
    { label: "Database", desc: "The physical storage layer returns the extracted row data back to the execution engine.", icon: Database, code: "{ id: 1, role: 'admin' }" },
    { label: "Response", desc: "The application receives the admin record and logs the attacker in as administrator.", icon: CheckCircle2, code: "HTTP 200 OK\nSet-Cookie: session=admin" }
  ]

  return (
    <div className="card p-6 my-8 overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--surface-1)] to-[var(--surface-2)] opacity-50 pointer-events-none" />
      <h3 className="text-xl font-extrabold text-[var(--text-primary)] mb-8 relative z-10">SQL Execution Pipeline Simulator</h3>
      
      <div className="grid grid-cols-4 md:grid-cols-8 gap-4 mb-8 relative z-10">
        {steps.map((s, idx) => (
          <div key={idx} className="relative flex flex-col items-center">
            <div 
              className={`flex flex-col items-center text-center cursor-pointer transition-all duration-300 ${step === idx ? 'scale-110' : 'opacity-60 hover:opacity-100 hover:scale-105'}`}
              onClick={() => setStep(idx)}
            >
              <div 
                className={`w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center mb-2 shadow-lg border-2 transition-colors duration-300
                  ${step === idx 
                    ? 'border-[var(--color-primary-500)] bg-gradient-to-br from-[var(--color-primary-600)] to-[var(--color-primary-800)] text-white shadow-[var(--color-primary-500)]/30' 
                    : step > idx 
                      ? 'border-green-500 bg-green-500/10 text-green-400'
                      : 'border-transparent bg-[var(--surface-3)] text-[var(--text-muted)]'}`}
              >
                <s.icon size={20} />
              </div>
              <span className={`text-[0.65rem] md:text-xs font-bold leading-tight ${step === idx ? 'text-[var(--color-primary-400)]' : 'text-[var(--text-secondary)]'}`}>
                {s.label}
              </span>
            </div>
            {/* Connecting lines */}
            {idx < steps.length - 1 && (
              <div className="hidden md:block absolute top-7 left-1/2 w-full h-[2px] bg-[var(--surface-4)] -z-10">
                <motion.div 
                  className="h-full bg-[var(--color-primary-500)] shadow-[0_0_8px_var(--color-primary-500)]"
                  initial={{ width: '0%' }}
                  animate={{ width: step > idx ? '100%' : '0%' }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10 mt-10">
        <AnimatePresence mode="wait">
          <motion.div 
            key={`desc-${step}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="p-5 bg-[var(--surface-2)] rounded-xl border border-[var(--surface-3)] shadow-inner flex flex-col justify-center"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-[var(--color-primary-500)]/20 flex items-center justify-center text-[var(--color-primary-400)] font-bold">
                {step + 1}
              </div>
              <h4 className="text-lg font-bold text-[var(--text-primary)]">{steps[step].label}</h4>
            </div>
            <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{steps[step].desc}</p>
          </motion.div>
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div 
            key={`code-${step}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="p-5 bg-[#0d1117] rounded-xl border border-[#30363d] font-mono text-sm shadow-xl flex items-center"
          >
            <pre className="text-green-400 whitespace-pre-wrap leading-relaxed w-full">
              {steps[step].code}
            </pre>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-8 flex justify-between items-center relative z-10 pt-4 border-t border-[var(--surface-3)]">
        <div className="flex gap-1">
          {steps.map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === step ? 'bg-[var(--color-primary-500)]' : 'bg-[var(--surface-4)]'}`} />
          ))}
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary btn-sm px-6" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>Previous</button>
          <button className="btn btn-primary btn-sm px-6" onClick={() => setStep(Math.min(steps.length - 1, step + 1))} disabled={step === steps.length - 1}>
            {step === steps.length - 1 ? 'Finish' : 'Next Stage'}
          </button>
        </div>
      </div>
    </div>
  )
}
