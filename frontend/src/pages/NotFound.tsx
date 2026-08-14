import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-6 text-center gap-8">
      <div className="flex flex-col items-center gap-4">
        <span className="text-[8rem] font-black leading-none bg-gradient-to-b from-white to-[#b7d8ea] bg-clip-text text-transparent">
          404
        </span>
        <h1 className="text-2xl font-semibold text-white">
          Page not found
        </h1>
        <p className="max-w-sm text-sm text-white/40 leading-relaxed">
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>

      <Link
        to="/"
        className="rounded-full bg-[#2AABEE] px-8 py-3 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#1a90cc]"
      >
        Back to Home
      </Link>
    </div>
  )
}

export default NotFound
