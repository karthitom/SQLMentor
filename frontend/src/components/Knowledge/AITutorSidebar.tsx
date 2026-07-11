import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, X, Send, Sparkles, Book, Target } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function AITutorSidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi! I am your AI Cybersecurity Tutor. How can I help you understand this lesson?' }
  ])
  const [input, setInput] = useState('')

  const [isLoading, setIsLoading] = useState(false)

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || input
    if (!textToSend.trim() || isLoading) return
    
    setMessages(prev => [...prev, { role: 'user', content: textToSend }])
    if (!customPrompt) setInput('')
    setIsLoading(true)
    
    try {
      // Assuming a generic AI endpoint for the chat MVP, but we'll use the generate endpoint for specialized tasks
      if (customPrompt?.includes("Quiz") || customPrompt?.includes("Explain")) {
         const type = customPrompt.includes("Quiz") ? "quiz" : "notes"
         const res = await fetch("http://localhost:8000/api/v1/ai/generate", {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({ topic: "SQL Injection", content_type: type })
         })
         
         if (res.ok) {
           const data = await res.json()
           setMessages(prev => [...prev, { role: 'assistant', content: data.content }])
         } else {
           throw new Error("Failed to generate content")
         }
      } else {
         // Generic Chat fallback simulation
         setTimeout(() => {
           setMessages(prev => [...prev, { 
             role: 'assistant', 
             content: "That's a great question about SQL Injection! Since this is a UI prototype, I don't have a live chat connection yet, but I can generate quizzes and notes for you!" 
           }])
           setIsLoading(false)
         }, 1000)
         return
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I had trouble connecting to the AI service." }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Floating Action Button when closed */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-[var(--color-primary-500)] to-[var(--color-accent-500)] shadow-2xl flex items-center justify-center z-50 hover:shadow-[0_0_20px_var(--color-primary-500)]"
          >
            <Bot size={24} className="text-white" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Sidebar Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full md:w-[400px] bg-[var(--surface-1)] border-l border-[var(--surface-3)] shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-[var(--surface-3)] flex items-center justify-between bg-[var(--surface-2)]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-[var(--color-primary-500)] flex items-center justify-center">
                  <Bot size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-[var(--text-primary)]">AI Tutor</h3>
                  <p className="text-xs text-[var(--color-primary-400)] flex items-center gap-1">
                    <Sparkles size={10} /> Context-Aware
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-[var(--surface-3)] rounded-lg text-[var(--text-muted)]"
              >
                <X size={20} />
              </button>
            </div>

            {/* Suggested Actions */}
            <div className="p-3 border-b border-[var(--surface-3)] flex gap-2 overflow-x-auto no-scrollbar">
              <button 
                onClick={() => handleSend("Explain Simply")}
                disabled={isLoading}
                className="flex-shrink-0 flex items-center gap-1 text-xs px-3 py-1.5 bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--surface-3)] rounded-full text-[var(--text-secondary)] disabled:opacity-50"
              >
                <Book size={12} /> Explain Simply
              </button>
              <button 
                onClick={() => handleSend("Quiz Me")}
                disabled={isLoading}
                className="flex-shrink-0 flex items-center gap-1 text-xs px-3 py-1.5 bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--surface-3)] rounded-full text-[var(--text-secondary)] disabled:opacity-50"
              >
                <Target size={12} /> Quiz Me
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl ${
                    msg.role === 'user' 
                      ? 'bg-[var(--color-primary-600)] text-white rounded-tr-sm' 
                      : 'bg-[var(--surface-2)] border border-[var(--surface-3)] text-[var(--text-primary)] rounded-tl-sm'
                  }`}>
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-[var(--surface-3)] bg-[var(--surface-2)]">
              <div className="relative">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask me anything..."
                  className="w-full bg-[var(--surface-1)] border border-[var(--surface-3)] rounded-xl py-3 pl-4 pr-12 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary-500)]"
                />
                <button 
                  onClick={() => handleSend()}
                  disabled={!input.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-[var(--color-primary-500)] text-white rounded-lg disabled:opacity-50"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
