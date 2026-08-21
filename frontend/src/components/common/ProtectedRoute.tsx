import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { API_BASE_URL } from '../../config/api'

interface ProtectedRouteProps {
  children: ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation()
  const [isValidating, setIsValidating] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    let isMounted = true

    // Check "am I logged in?" via the HTTP-only session cookie.
    // No tokens in localStorage or URL — the browser sends the cookie automatically.
    fetch(`${API_BASE_URL}/auth/session`, {
      credentials: 'include',
    })
      .then((res) => {
        if (!isMounted) return
        if (!res.ok) throw new Error('Unauthorized')
        return res.json()
      })
      .then((data) => {
        if (!isMounted) return
        if (data?.valid && data?.userId) {
          setIsAuthenticated(true)
        } else {
          setIsAuthenticated(false)
        }
      })
      .catch(() => {
        if (isMounted) setIsAuthenticated(false)
      })
      .finally(() => {
        if (isMounted) setIsValidating(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  if (isValidating) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2AABEE] border-t-transparent"></div>
          <p className="text-sm text-white/50">Verifying session...</p>
        </div>
      </div>
    )
  }

  // If not authenticated, redirect to /login rather than 404
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

