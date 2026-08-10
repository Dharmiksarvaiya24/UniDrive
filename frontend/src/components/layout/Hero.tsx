import { motion, useReducedMotion } from 'framer-motion'
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
          Unite every Drive,
        </span>
        <br />
        <span className="text-accent">one account at a time.</span>
      </motion.h1>

      <motion.p
        {...entrance(0.35)}
        className="mx-auto mt-6 max-w-2xl text-center text-[17px] leading-relaxed text-muted"
      >
        <strong className="font-semibold text-white">All your Google Drives in one place.</strong>
      </motion.p>

      <motion.div
        {...entrance(0.45)}
        className="mt-10 flex flex-wrap items-center justify-center gap-4"
      >
        <div className="relative flex cursor-not-allowed items-center gap-2 overflow-hidden rounded-full border border-white/10 px-7 py-3 text-[15px] text-white/40">
          <motion.span
            className="h-2 w-2 rounded-full bg-accent"
            animate={
              reduceMotion
                ? undefined
                : { scale: [1, 1.7, 1], opacity: [1, 0.5, 1] }
            }
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <span className="relative z-10">Coming Soon</span>
          {!reduceMotion && (
            <motion.div
              aria-hidden
              className="absolute inset-y-0 left-0 w-[200%] pointer-events-none"
              style={{
                background:
                  'linear-gradient(120deg, transparent 25%, rgba(42,171,238,0.07) 50%, transparent 75%)',
              }}
              animate={{ x: ['-100%', '100%'] }}
              transition={{
                duration: 3.5,
                ease: 'easeInOut',
                repeat: Infinity,
                repeatDelay: 1,
              }}
            />
          )}
        </div>
      </motion.div>

      <HeroVisual />
    </section>
  )
}

export default Hero
