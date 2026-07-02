/**
 * Axios API client configured for Firebase Authentication.
 */

import axios, { InternalAxiosRequestConfig } from 'axios'
import { auth } from '@/lib/firebase'

const BASE_URL = import.meta.env.VITE_API_URL || ''

export const apiClient = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30_000,
})

// Attach Firebase ID token to every request
apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const user = auth.currentUser
  if (user) {
    const token = await user.getIdToken()
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── API Modules ──────────────────────────────────────────────────────────────
export const authApi = {
  // Authentication is now handled client-side via Firebase SDK,
  // but we still fetch the backend profile.
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
