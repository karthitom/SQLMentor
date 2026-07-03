/**
 * AuthProvider
 *
 * Wraps the app and listens to Firebase onAuthStateChanged.
 * On page refresh, Firebase restores its session asynchronously.
 * This component waits for that to complete before marking auth as ready,
 * preventing ProtectedRoute from redirecting to /login prematurely.
 */
import { useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useAuthStore } from '@/store'
import { authApi } from '@/api/client'

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { setUser, setAuthReady } = useAuthStore()

  useEffect(() => {
    // onAuthStateChanged fires once when Firebase has determined the auth state:
    // - Immediately with null if the user is not logged in
    // - With the Firebase user object if a valid session was persisted
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Force-refresh the ID token so the API client interceptor can attach it
          await firebaseUser.getIdToken(/* forceRefresh */ false)
          // Fetch the full backend profile
          const res = await authApi.me()
          setUser(res.data)
        } catch (err) {
          // Token is invalid or backend returned an error — clear state
          console.warn('[AuthProvider] Failed to fetch user profile:', err)
          setUser(null)
        }
      } else {
        // Not authenticated
        setUser(null)
      }
      // Mark Firebase auth as resolved regardless of outcome
      setAuthReady(true)
    })

    return unsubscribe
  }, [setUser, setAuthReady])

  return <>{children}</>
}
