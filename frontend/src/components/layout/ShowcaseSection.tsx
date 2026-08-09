import { motion, useReducedMotion } from 'framer-motion'
import { SiGoogledrive, SiDropbox, SiGooglecloud, SiIcloud, SiBox } from 'react-icons/si'
import dashboardImg from '../../assets/product.jpg'

const integrations = [
  { name: 'Google Drive', Icon: SiGoogledrive },
  { name: 'Dropbox', Icon: SiDropbox },
  { name: 'Google Cloud', Icon: SiGooglecloud },
  { name: 'iCloud', Icon: SiIcloud },
  { name: 'Box', Icon: SiBox },
]

function ShowcaseSection() {
  const reduceMotion = useReducedMotion()

  const scrollEntrance = (delay: number, y = 120) => ({
    initial: reduceMotion ? (false as const) : { opacity: 0, y },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-80px' },
    transition: { duration: 1.2, delay, ease: 'easeOut' as const },
  })

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-start overflow-hidden px-6 pt-20 pb-0 md:pt-28 md:pb-0">


      <motion.h2
        {...scrollEntrance(0)}
        className="relative z-10 mx-auto max-w-3xl text-center text-3xl font-semibold leading-[1.12] tracking-tight md:text-5xl lg:text-[3.5rem]"
      >
        <span className="bg-gradient-to-b from-white to-[#b7d8ea] bg-clip-text text-transparent">
          Manage every Drive,
        </span>
        <br />
        <span className="bg-gradient-to-b from-white to-[#b7d8ea] bg-clip-text text-transparent">
          through one dashboard.
        </span>
      </motion.h2>

      <motion.p
        {...scrollEntrance(0.1)}
        className="relative z-10 mx-auto mt-5 max-w-xl text-center text-[16px] leading-relaxed text-muted"
      >
        Smarter file management and faster syncing across accounts.
      </motion.p>



      <motion.div
        {...scrollEntrance(0.3)}
        className="relative z-10 mx-auto mt-16 flex max-w-4xl flex-wrap items-center justify-center gap-x-14 gap-y-6 md:mt-20 md:justify-between"
      >
        {integrations.map(({ name, Icon }) => (
          <div
            key={name}
            className="flex items-center gap-2.5 text-white/25 select-none"
          >
            <Icon className="h-[18px] w-[18px] shrink-0" />
            <span className="text-[15px] font-medium tracking-wide whitespace-nowrap">
              {name}
            </span>
          </div>
        ))}
      </motion.div>

      <motion.div
        {...scrollEntrance(0.4)}
        className="relative mx-auto mt-16 max-w-[1100px] md:mt-24"
      >
        <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
          {!reduceMotion ? (
            <>
              <motion.div
                className="absolute inset-x-0 top-[30%] bottom-0 blur-[80px] md:blur-[120px]"
                style={{
                  background:
                    'radial-gradient(ellipse 90% 60% at 50% 60%, rgba(42,171,238,0.5) 0%, rgba(42,171,238,0.2) 40%, transparent 75%)',
                }}
                animate={{
                  scale: [1, 1.06, 1],
                  opacity: [0.75, 1, 0.75],
                }}
                transition={{
                  duration: 6,
                  ease: 'easeInOut',
                  repeat: Infinity,
                }}
              />
              <motion.div
                className="absolute left-0 top-[20%] h-[80%] w-[45%] rounded-full blur-[100px]"
                style={{
                  background:
                    'radial-gradient(circle, rgba(42,171,238,0.35) 0%, transparent 70%)',
                }}
                animate={{ opacity: [0.6, 0.9, 0.6] }}
                transition={{
                  duration: 7,
                  ease: 'easeInOut',
                  repeat: Infinity,
                  delay: 1,
                }}
              />
              <motion.div
                className="absolute right-0 top-[20%] h-[80%] w-[45%] rounded-full blur-[100px]"
                style={{
                  background:
                    'radial-gradient(circle, rgba(42,171,238,0.35) 0%, transparent 70%)',
                }}
                animate={{ opacity: [0.6, 0.9, 0.6] }}
                transition={{
                  duration: 7,
                  ease: 'easeInOut',
                  repeat: Infinity,
                  delay: 2,
                }}
              />
            </>
          ) : (
            <>
              <div
                className="absolute inset-x-0 top-[30%] bottom-0 opacity-75 blur-[80px] md:blur-[120px]"
                style={{
                  background:
                    'radial-gradient(ellipse 90% 60% at 50% 60%, rgba(42,171,238,0.5) 0%, rgba(42,171,238,0.2) 40%, transparent 75%)',
                }}
              />
              <div
                className="absolute left-0 top-[20%] h-[80%] w-[45%] rounded-full opacity-60 blur-[100px]"
                style={{
                  background:
                    'radial-gradient(circle, rgba(42,171,238,0.35) 0%, transparent 70%)',
                }}
              />
              <div
                className="absolute right-0 top-[20%] h-[80%] w-[45%] rounded-full opacity-60 blur-[100px]"
                style={{
                  background:
                    'radial-gradient(circle, rgba(42,171,238,0.35) 0%, transparent 70%)',
                }}
              />
            </>
          )}
        </div>

        <div
          className="relative z-10 rounded-2xl border border-white/[0.15] bg-white/[0.07] p-2 backdrop-blur-md md:p-3"
          style={{
            boxShadow:
              'inset 0 1px 0 0 rgba(255,255,255,0.2), 0 0 600px 100px rgba(42,171,238,0.15), 0 10px 1200px 0 rgba(42,171,238,0.25), 0 30px 2000px -10px rgba(42,171,238,0.3)',
          }}
        >
          <div className="overflow-hidden rounded-xl border border-white/[0.12]">
            <img
              src={dashboardImg}
              alt="UniDrive dashboard — unified file browser across multiple Google Drive accounts"
              className="block w-full"
              loading="lazy"
            />
          </div>
        </div>

        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 hidden md:block h-40"
          style={{
            background:
              'linear-gradient(to top, var(--color-ink) 5%, transparent)',
          }}
        />
      </motion.div>
    </section>
  )
}

export default ShowcaseSection
