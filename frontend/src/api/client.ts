/**
 * Axios API client with:
 * - CSRF token injection (double-submit cookie pattern)
 * - 401 auto-refresh handling
 * - Secure error handling (no credential logging)
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || ''

export const apiClient = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  withCredentials: true,        // Send cookies with every request
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30_000,
})

// ── CSRF Token Injection ────────────────────────────────────────────────────
// Double-submit cookie pattern: JS reads the CSRF cookie and sends it as a header
function getCsrfToken(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)__Host-csrf_token=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const method = config.method?.toUpperCase()
  if (method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const csrfToken = getCsrfToken()
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken
    }
  }
  return config
})

// ── 401 Auto-refresh ────────────────────────────────────────────────────────
let isRefreshing = false
let refreshQueue: Array<(token: string) => void> = []

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue concurrent requests
        return new Promise((resolve) => {
          refreshQueue.push(() => resolve(apiClient(originalRequest)))
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        await apiClient.post('/auth/refresh')
        refreshQueue.forEach((cb) => cb(''))
        refreshQueue = []
        return apiClient(originalRequest)
      } catch {
        // Refresh failed — clear state and redirect to login
        refreshQueue = []
        // Use dynamic import to avoid circular dependency
        const { useAuthStore } = await import('@/store')
        useAuthStore.getState().logout()
        return Promise.reject(error)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

// ── API Modules ──────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),

  register: (data: { email: string; username: string; password: string; full_name?: string }) =>
    apiClient.post('/auth/register', data),

  logout: () => apiClient.post('/auth/logout'),

  refresh: () => apiClient.post('/auth/refresh'),

  me: () => apiClient.get('/auth/me'),
}

export const workspacesApi = {
  list: (includeArchived = false) =>
    apiClient.get('/workspaces', { params: { include_archived: includeArchived } }),

  get: (id: string) => apiClient.get(`/workspaces/${id}`),

  create: (data: { name: string; description?: string; color?: string; icon?: string }) =>
    apiClient.post('/workspaces', data),

  update: (id: string, data: Partial<{ name: string; description: string; color: string; icon: string; is_pinned: boolean; is_archived: boolean }>) =>
    apiClient.patch(`/workspaces/${id}`, data),

  delete: (id: string) => apiClient.delete(`/workspaces/${id}`),
}

export const projectsApi = {
  create: (data: {
    workspace_id: string
    name: string
    description?: string
    lab_url?: string
    lab_type?: string
    difficulty_level?: string
  }) => apiClient.post('/projects', data),

  get: (id: string) => apiClient.get(`/projects/${id}`),

  update: (id: string, data: object) => apiClient.patch(`/projects/${id}`, data),

  delete: (id: string) => apiClient.delete(`/projects/${id}`),
}

export const analysisApi = {
  create: (data: { project_id: string; target_url: string; title?: string; description?: string }) =>
    apiClient.post('/analysis', data),

  get: (id: string) => apiClient.get(`/analysis/${id}`),

  discover: (id: string) => apiClient.post(`/analysis/${id}/discover`),

  runTest: (id: string, data: {
    parameter_name: string
    parameter_location: string
    baseline_value: string
    test_value: string
    request_method?: string
  }) => apiClient.post(`/analysis/${id}/test`, data),
}

export const aiApi = {
  chat: (messages: Array<{ role: string; content: string }>, context?: string) =>
    apiClient.post('/ai/chat', { messages, context }),

  explain: (concept: string, skill_level = 'beginner') =>
    apiClient.post('/ai/explain', { concept, skill_level }),
}

export const knowledgeApi = {
  listArticles: () => apiClient.get('/knowledge/articles'),
  getArticle: (slug: string) => apiClient.get(`/knowledge/articles/${slug}`),
}

export const reportsApi = {
  list: () => apiClient.get('/reports'),
  generate: (data: object) => apiClient.post('/reports/generate', data),
}
