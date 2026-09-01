/**
 * Shared authentication utilities for UniDrive.
 *
 * Problem:  Frontend (dharmik.live) and backend (vercel.com) are on different
 *           domains. Modern browsers silently block cross-site cookies even when
 *           SameSite=None + Secure is set correctly.
 *
 * Solution: After OAuth, the backend passes the signed session JWT in the URL
 *           hash fragment (never sent to any server, safe from Referer leaks).
 *           The frontend stores it in localStorage and sends it via the
 *           Authorization: Bearer header on every API call.
 *
 *           We use localStorage (not sessionStorage) because sessionStorage is
 *           tab-scoped and can be unreliable across OAuth redirect chains,
 *           especially on mobile browsers and some incognito modes.
 *
 *           Cookies are still set as a fallback (they work on same-domain
 *           deploys and for browsers that haven't restricted cross-site cookies).
 */

const TOKEN_KEY = 'unidrive_session_token'

// One-time migration: move token from sessionStorage → localStorage so existing
// sessions survive the storage backend change.
try {
  const legacy = sessionStorage.getItem(TOKEN_KEY)
  if (legacy && !localStorage.getItem(TOKEN_KEY)) {
    localStorage.setItem(TOKEN_KEY, legacy)
    sessionStorage.removeItem(TOKEN_KEY)
  }
} catch {
  // noop — storage may not be available
}

/** Read the session JWT from localStorage (returns null if absent). */
export function getSessionToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

/** Persist a session JWT to localStorage. */
export function setSessionToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    // localStorage may be unavailable in some restricted browser modes
  }
}

/** Remove the session JWT from localStorage (used on logout). */
export function clearSessionToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY)
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
 *
 * @param overrideToken  If provided, use this token instead of reading from
 *                       storage. Useful right after captureHashToken() to avoid
 *                       any storage timing issues.
 */
export function authFetch(
  url: string,
  options: RequestInit = {},
  overrideToken?: string | null
): Promise<Response> {
  const token = overrideToken ?? getSessionToken()

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
