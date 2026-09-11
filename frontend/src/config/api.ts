const isLocalhost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1')

const DEFAULT_LOCAL_API_URL = 'http://localhost:5001'
const DEFAULT_PRODUCTION_API_URL = 'https://uni-drive-one.vercel.app'

// In production, ensure we never accidentally call localhost even if dev env is present
export const API_BASE_URL: string = isLocalhost
  ? (import.meta.env.VITE_LOCAL_API_URL || import.meta.env.VITE_API_URL || DEFAULT_LOCAL_API_URL)
  : (import.meta.env.VITE_API_URL && !import.meta.env.VITE_API_URL.includes('localhost')
      ? import.meta.env.VITE_API_URL
      : DEFAULT_PRODUCTION_API_URL)
