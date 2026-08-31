

const TOKEN_KEY = 'unidrive_session_token'

/** Read the session JWT from sessionStorage (returns null if absent). */
export function getSessionToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

/** Persist a session JWT to sessionStorage. */
export function setSessionToken(token: string): void {
  try {
    sessionStorage.setItem(TOKEN_KEY, token)
  } catch {
    // sessionStorage may be unavailable in incognito in some browsers
  }
}

/** Remove the session JWT from sessionStorage (used on logout). */
export function clearSessionToken(): void {
  try {
    sessionStorage.removeItem(TOKEN_KEY)
  } catch {
    // noop
  }
}

/**
 * Check if the current URL hash contains a session token placed there by the
 * backend's OAuth redirect (e.g. /dashboard#session=<jwt>).  If found, store
 * it and clean the URL.
 *
 * Call this once on app mount / on pages that are targets of OAuth redirects.
 */
export function captureHashToken(): string | null {
  const hash = window.location.hash
  const prefix = '#session='
  if (hash.startsWith(prefix)) {
    const token = hash.substring(prefix.length)
    if (token) {
      setSessionToken(token)
      // Strip the hash from the URL so it doesn't linger in history / get
      // shared accidentally.  replaceState keeps the current history entry.
      window.history.replaceState(
        null,
        '',
        window.location.pathname + window.location.search
      )
      return token
    }
  }
  return null
}

/**
 * A drop-in replacement for fetch() that automatically includes:
 *   - credentials: 'include'  (for same-domain cookie auth)
 *   - Authorization: Bearer <token>  (for cross-domain token auth)
 */
export function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getSessionToken()

  const headers = new Headers(options.headers)
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  })
}
