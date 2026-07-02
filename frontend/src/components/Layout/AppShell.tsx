import { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { TopNav } from './TopNav'
import { ToastContainer } from '../UI/Toast'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <TopNav />
        <main className="page-content">
          {children}
        </main>
      </div>
      <ToastContainer />
    </div>
  )
}
