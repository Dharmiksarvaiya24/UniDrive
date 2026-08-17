export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? 'https://unidrive-7sze.onrender.com'
    : 'http://localhost:5001')
