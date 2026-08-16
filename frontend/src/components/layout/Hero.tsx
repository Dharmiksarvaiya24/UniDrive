import { motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
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
        <h4 className="text-white">All your Google Drives in one place.</h4>
      </motion.p>

      <motion.div
        {...entrance(0.45)}
        className="mt-10 flex flex-wrap items-center justify-center gap-4"
      >
        <div className="relative group">
          {/* Glowing backdrop */}
          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-[#2AABEE] to-[#b7d8ea] opacity-40 blur-md transition-all duration-300 group-hover:opacity-75 animate-pulse"></div>
          
          <Link
            to="/login"
            className="relative flex items-center justify-center overflow-hidden rounded-full bg-[#2AABEE] px-8 py-3 text-[15px] font-bold tracking-wide text-white transition-all hover:scale-105 hover:bg-[#1a90cc]"
          >
            <span className="relative z-10">Get Started</span>
          </Link>
        </div>
      </motion.div>

      <HeroVisual />
    </section>
  )
}

export default Hero
