import { motion, useReducedMotion } from 'framer-motion'
import { API_BASE_URL } from '../../config/api'
import HeroVisual from './HeroVisual'

function Hero() {
  const reduceMotion = useReducedMotion()

  const entrance = (delay: number, y = 20) => ({
    initial: reduceMotion ? false : { opacity: 0, y },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay, ease: 'easeOut' as const },
  })

  return (
    <section className="relative flex min-h-screen flex-col items-center overflow-hidden px-6 pb-24 pt-36">

      <motion.h1
        {...entrance(0.25)}
        className="mt-1 max-w-4xl text-center text-4xl font-medium leading-[1.08] tracking-tight md:text-6xl lg:text-7xl"
      >
        <span className="bg-gradient-to-b from-white to-[#b7d8ea] bg-clip-text text-transparent">
          Everything You Store,
        </span>
        <br />
        <span className="text-accent">One Place to Find It.</span>
      </motion.h1>

      <motion.p
        {...entrance(0.35)}
        className="mx-auto mt-6 max-w-2xl text-center text-[17px] leading-relaxed text-muted"
      >
        <span className="block font-medium text-white">All your Google Drives in one place.</span>
      </motion.p>

      <motion.div
        {...entrance(0.45)}
        className="mt-10 flex flex-wrap items-center justify-center gap-4"
      >
        <div className="relative group">
          {/* Glowing backdrop */}
          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-[#2AABEE] to-[#b7d8ea] opacity-40 blur-md transition-all duration-300 group-hover:opacity-75 animate-pulse"></div>
          
          <a
            href={`${API_BASE_URL}/auth/google?redirectUrl=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin : '')}`}
            className="relative flex items-center justify-center gap-3 overflow-hidden rounded-full bg-white px-7 py-3 text-[15px] font-semibold tracking-wide text-neutral-900 transition-all hover:scale-105 hover:bg-neutral-100 hover:shadow-lg hover:shadow-white/20 active:scale-95"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            <span className="relative z-10 font-semibold text-neutral-900">Continue with Google</span>
          </a>
        </div>
      </motion.div>

      <HeroVisual />
    </section>
  )
}

export default Hero
