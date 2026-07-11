import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, BookOpen, FlaskConical, Database,
  Bot, HelpCircle, Award, FileBadge, Activity,
  User, Settings, Shield, LogOut, ChevronDown, ChevronRight
} from 'lucide-react'
import { useAuthStore, useUIStore } from '@/store'
import { useMutation } from '@tanstack/react-query'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'

const navSections = [
  {
    label: 'Platform',
    items: [
      { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ],
  },
  {
    label: 'Academy',
    items: [
      { 
        path: '/paths', icon: BookOpen, label: 'Learning Paths',
        subItems: [
          { path: '/paths/sql-basics', label: 'SQL Basics' },
          { path: '/paths/db-fundamentals', label: 'Database Fundamentals' },
          { path: '/knowledge/sql-injection-fundamentals', label: 'SQL Injection Fundamentals' },
          { path: '/paths/error-based', label: 'Error-Based Concepts' },
          { path: '/paths/union-based', label: 'UNION Concepts' },
          { path: '/paths/boolean-based', label: 'Boolean-Based Concepts' },
          { path: '/paths/blind-sql', label: 'Blind SQL Concepts' },
          { path: '/paths/time-based', label: 'Time-Based Concepts' },
          { path: '/paths/secure-coding', label: 'Secure Coding' },
        ]
      },
      { 
        path: '/labs', icon: FlaskConical, label: 'Interactive Labs',
        subItems: [
          { path: '/labs/beginner', label: 'Beginner Labs' },
          { path: '/labs/intermediate', label: 'Intermediate Labs' },
          { path: '/labs/advanced', label: 'Advanced Labs' },
          { path: '/labs/challenges', label: 'Challenge Labs' },
        ]
      },
      { path: '/playground', icon: Database, label: 'SQL Playground' },
      { path: '/visualizer', icon: Database, label: 'Database Visualizer' },
      { path: '/mentor', icon: Bot, label: 'AI Mentor' },
      { path: '/quizzes', icon: HelpCircle, label: 'Quizzes' },
    ],
  },
  {
    label: 'Progression',
    items: [
      { path: '/achievements', icon: Award, label: 'Achievements' },
      { path: '/certificates', icon: FileBadge, label: 'Certificates' },
      { path: '/leaderboard', icon: Activity, label: 'My Progress' },
    ],
  },
  {
    label: 'Account',
    items: [
      { path: '/profile', icon: User, label: 'Profile' },
      { path: '/settings', icon: Settings, label: 'Settings' },
    ],
  },
]

function NavItem({ item, isActive, currentPath }: { item: any, isActive: (p: string) => boolean, currentPath: string }) {
  const [isOpen, setIsOpen] = useState(isActive(item.path))
  const isItemActive = isActive(item.path)
  const hasSubItems = item.subItems && item.subItems.length > 0

  return (
    <div className="mb-1">
      {hasSubItems ? (
        <div 
          className={`nav-item cursor-pointer ${isItemActive ? 'active font-medium' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-3">
            <item.icon size={17} />
            <span>{item.label}</span>
          </div>
          {isOpen ? <ChevronDown size={14} className="opacity-50" /> : <ChevronRight size={14} className="opacity-50" />}
        </div>
      ) : (
        <Link to={item.path} className={`nav-item ${isItemActive ? 'active font-medium' : ''}`}>
          <div className="flex items-center gap-3">
            <item.icon size={17} />
            <span>{item.label}</span>
          </div>
        </Link>
      )}

      {/* Sub Items */}
      <AnimatePresence>
        {hasSubItems && isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden ml-[22px] border-l-2 border-[var(--surface-3)] mt-1 mb-2 space-y-1"
          >
            {item.subItems.map((subItem: any) => (
              <Link 
                key={subItem.path} 
                to={subItem.path}
                className={`block py-1.5 pl-4 pr-3 text-sm rounded-r-md transition-colors ${
                  currentPath === subItem.path 
                    ? 'text-[var(--color-primary-400)] font-medium bg-[var(--surface-2)] border-l-2 -ml-[2px] border-[var(--color-primary-500)]' 
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)]'
                }`}
              >
                {subItem.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function Sidebar() {
  const location = useLocation()
  const { user, logout } = useAuthStore()

  const logoutMutation = useMutation({
    mutationFn: () => signOut(auth),
    onSettled: () => {
      logout() 
    },
  })

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/')

  return (
    <motion.aside
      className="sidebar flex flex-col h-full bg-[var(--surface-1)] border-r border-[var(--surface-3)]"
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Logo */}
      <div className="sidebar-logo p-5 border-b border-[var(--surface-3)] flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--color-primary-600)] to-[var(--color-accent-600)] flex items-center justify-center shadow-lg shadow-[var(--color-primary-900)]">
          <Shield size={20} className="text-white" />
        </div>
        <div>
          <div className="font-extrabold text-[1.05rem] text-[var(--text-primary)] tracking-tight">
            SQLMentor Labs
          </div>
          <div className="text-[0.65rem] text-[var(--color-primary-400)] font-semibold uppercase tracking-wider">
            Cybersecurity Academy
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {navSections.map((section) => (
          <div key={section.label}>
            <div className="text-[0.7rem] font-bold text-[var(--text-disabled)] uppercase tracking-wider mb-2 ml-2">{section.label}</div>
            {section.items.map((item) => (
              <NavItem key={item.path} item={item} isActive={isActive} currentPath={location.pathname} />
            ))}
          </div>
        ))}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-[var(--surface-3)] bg-[var(--surface-2)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-primary-700)] to-[var(--color-accent-600)] flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-md">
            {user?.username?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-[var(--text-primary)] truncate">
              {user?.full_name || user?.username || 'Student'}
            </div>
            <div className="text-[0.7rem] text-[var(--color-accent-400)] font-semibold truncate uppercase tracking-wider">
              Level 4 Hacker
            </div>
          </div>
          <button
            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-red-400/10 transition-colors"
            onClick={() => logoutMutation.mutate()}
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </motion.aside>
  )
}
