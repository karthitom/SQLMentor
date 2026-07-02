import { useNotificationStore } from '@/store'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

const COLORS = {
  success: 'var(--color-success)',
  error: 'var(--color-danger)',
  warning: 'var(--color-warning)',
  info: 'var(--color-info)',
}

export function ToastContainer() {
  const { toasts, removeToast } = useNotificationStore()

  return (
    <div className="toast-container" role="region" aria-live="polite" aria-label="Notifications">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const Icon = ICONS[toast.type]
          return (
            <motion.div
              key={toast.id}
              className={`toast ${toast.type}`}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <Icon size={18} color={COLORS[toast.type]} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1, color: 'var(--text-primary)' }}>{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--text-muted)' }}
                aria-label="Dismiss notification"
              >
                <X size={14} />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

// Hook for easy toast usage
export function useToast() {
  const { addToast } = useNotificationStore()
  return {
    success: (message: string) => addToast({ type: 'success', message }),
    error: (message: string) => addToast({ type: 'error', message }),
    warning: (message: string) => addToast({ type: 'warning', message }),
    info: (message: string) => addToast({ type: 'info', message }),
  }
}
