import { Link } from 'react-router-dom'
import logo from '../assets/logo-drive.png'

function Login() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-6">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        <Link to="/" className="flex flex-col items-center gap-3">
          <img src={logo} alt="UniDrive" className="h-14 w-14 object-contain" />
          <span className="text-2xl font-bold tracking-widest text-white">UNIDRIVE</span>
        </Link>

        <div className="w-full flex flex-col gap-4">
          <h1 className="text-center text-3xl font-semibold bg-gradient-to-b from-white to-[#b7d8ea] bg-clip-text text-transparent">
            Welcome back
          </h1>
          <p className="text-center text-sm text-white/40">
            Sign in to access your unified drive
          </p>
        </div>

        <div className="w-full flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-white/40">
              Email
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none transition-colors focus:border-[#2AABEE]/60"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-white/40">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none transition-colors focus:border-[#2AABEE]/60"
            />
          </div>

          <button
            type="button"
            className="mt-2 w-full rounded-xl bg-[#2AABEE] px-4 py-3 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#1a90cc]"
          >
            Sign In
          </button>
        </div>

        <p className="text-xs text-white/30">
          Don&apos;t have an account?{' '}
          <Link to="/" className="text-[#2AABEE] hover:underline">
            Get early access
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Login
