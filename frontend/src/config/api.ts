const PRODUCTION_API_BASE_URL =
  'https://vercel.com/dharmiksarvaiya24s-projects/uni-drive/7aWyGd8s9uiE1XMhtfgydtry7f1s'

const isLocalhost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1')

export const API_BASE_URL = isLocalhost
  ? (import.meta.env.VITE_LOCAL_API_URL || 'http://localhost:5001')
  : PRODUCTION_API_BASE_URL
