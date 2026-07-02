import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// ── Types ─────────────────────────────────────────────────────────────────────
export interface User {
  id: string
  email: string
  username: string
  full_name: string | null
  bio: string | null
  avatar_url: string | null
  role: 'student' | 'instructor' | 'admin'
  is_active: boolean
  learning_streak_days: number
  total_analyses: number
  total_reports: number
  created_at: string
  last_login_at: string | null
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void
}

// Auth store — user data only (tokens in HttpOnly cookies, not stored here)
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) =>
        set({ user, isAuthenticated: !!user, isLoading: false }),

      setLoading: (isLoading) => set({ isLoading }),

      logout: () => {
        // Clear ALL client-side state on logout
        set({ user: null, isAuthenticated: false, isLoading: false })
        // Full page redirect to clear any cached state
        window.location.href = '/login'
      },
    }),
    {
      name: 'sqlmentor-auth',
      storage: createJSONStorage(() => sessionStorage), // sessionStorage, not localStorage
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
)

// ── UI Store ──────────────────────────────────────────────────────────────────
interface UIState {
  sidebarOpen: boolean
  commandPaletteOpen: boolean
  theme: 'dark' | 'light'
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setCommandPaletteOpen: (open: boolean) => void
  setTheme: (theme: 'dark' | 'light') => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      commandPaletteOpen: false,
      theme: 'dark',

      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setCommandPaletteOpen: (commandPaletteOpen) => set({ commandPaletteOpen }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'sqlmentor-ui',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ theme: state.theme, sidebarOpen: state.sidebarOpen }),
    }
  )
)

// ── Notifications Store ──────────────────────────────────────────────────────
export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
}

interface NotificationState {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  toasts: [],

  addToast: (toast) => {
    const id = Math.random().toString(36).slice(2)
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }))
    // Auto-remove after duration
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    }, toast.duration ?? 4000)
  },

  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}))

// ── Workspace Store ──────────────────────────────────────────────────────────
interface WorkspaceState {
  activeWorkspaceId: string | null
  activeProjectId: string | null
  setActiveWorkspace: (id: string | null) => void
  setActiveProject: (id: string | null) => void
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      activeWorkspaceId: null,
      activeProjectId: null,
      setActiveWorkspace: (id) => set({ activeWorkspaceId: id }),
      setActiveProject: (id) => set({ activeProjectId: id }),
    }),
    {
      name: 'sqlmentor-workspace',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)
