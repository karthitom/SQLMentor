import { useState } from 'react'
import { useNavigate, Link, Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Shield, Mail, Lock, User, Eye, EyeOff, AlertCircle, UserPlus } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/api/client'
import { useAuthStore } from '@/store'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { auth } from '@/lib/firebase'

const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(64, 'Username must not exceed 64 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username may only contain letters, numbers, underscores, and hyphens'),
  full_name: z.string().max(128, 'Name too long').optional(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const navigate = useNavigate()
  const { setUser, isAuthenticated } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterForm) => {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password)
      if (data.full_name || data.username) {
        await updateProfile(userCredential.user, {
          displayName: data.full_name || data.username
        })
      }
      const res = await authApi.me()
      return res.data
    },
    onSuccess: (userData) => {
      setUser(userData)
      navigate('/dashboard', { replace: true })
    },
    onError: (error: any) => {
      setServerError(error?.message || error?.response?.data?.detail || 'Registration failed. Please try again.')
    },
  })

  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--surface-0)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', width: 500, height: 500, background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)', top: '10%', right: '5%', pointerEvents: 'none' }} />

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        style={{ width: '100%', maxWidth: 480, position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'linear-gradient(135deg, var(--color-primary-600), var(--color-accent-600))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem', boxShadow: 'var(--shadow-glow-blue)',
          }}>
            <Shield size={28} color="white" />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>
            Create your account
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Join SQLMentor and start your security learning journey
          </p>
        </div>

        <div className="disclaimer-banner">
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <span><strong>Educational platform</strong> — Use only on systems you own or have explicit written authorization to test.</span>
        </div>

        <div className="card" style={{ padding: '2rem' }}>
          {serverError && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1.25rem', color: '#f87171', fontSize: '0.875rem' }}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit((data) => { setServerError(null); registerMutation.mutate(data) })} noValidate>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Full Name */}
              <div>
                <label htmlFor="reg-fullname" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>Full name</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input id="reg-fullname" type="text" autoComplete="name" className="input" style={{ paddingLeft: '2.5rem' }} placeholder="John Smith" {...register('full_name')} />
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="reg-email" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>Email address <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input id="reg-email" type="email" autoComplete="email" className={`input ${errors.email ? 'error' : ''}`} style={{ paddingLeft: '2.5rem' }} placeholder="you@example.com" {...register('email')} />
                </div>
                {errors.email && <p style={{ color: 'var(--color-danger)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>{errors.email.message}</p>}
              </div>

              {/* Username */}
              <div>
                <label htmlFor="reg-username" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>Username <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                <input id="reg-username" type="text" autoComplete="username" className={`input ${errors.username ? 'error' : ''}`} placeholder="johndoe" {...register('username')} />
                {errors.username && <p style={{ color: 'var(--color-danger)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>{errors.username.message}</p>}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="reg-password" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>Password <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input id="reg-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" className={`input ${errors.password ? 'error' : ''}`} style={{ paddingLeft: '2.5rem', paddingRight: '2.75rem' }} placeholder="Minimum 8 characters" {...register('password')} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p style={{ color: 'var(--color-danger)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>{errors.password.message}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="reg-confirm" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>Confirm password <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input id="reg-confirm" type={showPassword ? 'text' : 'password'} autoComplete="new-password" className={`input ${errors.confirmPassword ? 'error' : ''}`} style={{ paddingLeft: '2.5rem' }} placeholder="Repeat your password" {...register('confirmPassword')} />
                </div>
                {errors.confirmPassword && <p style={{ color: 'var(--color-danger)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>{errors.confirmPassword.message}</p>}
              </div>

              <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '0.5rem' }} disabled={registerMutation.isPending} id="register-submit-btn">
                {registerMutation.isPending ? (
                  <><div className="animate-spin" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%' }} /> Creating account...</>
                ) : (
                  <><UserPlus size={16} /> Create account</>
                )}
              </button>
            </div>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--color-primary-400)', fontWeight: 500, textDecoration: 'none' }}>Sign in</Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
