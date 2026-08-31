const PRODUCTION_API_BASE_URL =
  'https://uni-drive-one.vercel.app'

const isLocalhost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1')

export const API_BASE_URL = isLocalhost
  ? (import.meta.env.VITE_LOCAL_API_URL || 'http://localhost:5001')
  : PRODUCTION_API_BASE_URL
