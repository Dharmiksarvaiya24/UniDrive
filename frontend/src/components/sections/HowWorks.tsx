import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { useRef, useEffect } from 'react'
import Lenis from 'lenis'
import loginImg from '../../assets/login.png'
import syncImg from '../../assets/sync.png'
import homeImg from '../../assets/product.jpg'

const cards = [
  {
    step: 'CONNECT',
    title: 'Connect',
    desc: 'Link all your Google Drive accounts securely.',
    img: loginImg,
    alt: 'Connect your accounts',
  },
  {
    step: 'SYNC',
    title: 'Sync',
    desc: 'Sync files across drives in real-time.',
    img: syncImg,
    alt: 'Sync files in real-time',
  },
  {
    step: 'HOME',
    title: 'Browse',
    desc: 'Search and browse all your files in one place.',
    img: homeImg,
    alt: 'Browse all files',
  },
]

function HowWorks() {
  const reduceMotion = useReducedMotion()
  const targetRef = useRef<HTMLElement>(null)

  // Initialize Lenis for smooth scrolling
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      touchMultiplier: 2,
    })

    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    return () => {
      lenis.destroy()
    }
  }, [])

  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end end"]
  })

  // Card 1 (Connect): Remains stable initially. Scales down as Card 2 enters, scales again as Card 3 enters.
  const scale1 = useTransform(scrollYProgress, [0, 0.2, 0.4, 0.6, 0.8, 1], [1, 1, 0.96, 0.96, 0.92, 0.92])
  const y1 = useTransform(scrollYProgress, [0, 0.2, 0.4, 0.6, 0.8, 1], ["0%", "0%", "-4%", "-4%", "-8%", "-8%"])

  // Card 2 (Sync): Enters after Card 1 is stable. Scales down as Card 3 enters.
  const scale2 = useTransform(scrollYProgress, [0, 0.2, 0.4, 0.6, 0.8, 1], [1, 1, 1, 1, 0.96, 0.96])
  const y2 = useTransform(scrollYProgress, [0, 0.2, 0.4, 0.6, 0.8, 1], ["100vh", "100vh", "0%", "0%", "-4%", "-4%"])

  // Card 3 (Home): Enters last and remains at full scale.
  const scale3 = useTransform(scrollYProgress, [0, 0.2, 0.4, 0.6, 0.8, 1], [1, 1, 1, 1, 1, 1])
  const y3 = useTransform(scrollYProgress, [0, 0.2, 0.4, 0.6, 0.8, 1], ["100vh", "100vh", "100vh", "100vh", "0%", "0%"])

  // Heading Animation: Shrinks and fades slightly as the user begins scrolling (before cards enter)
  const headingScale = useTransform(scrollYProgress, [0, 0.1], [1, 0.6])
  const headingOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 0.5])
  const headingY = useTransform(scrollYProgress, [0, 0.1], ["0px", "-20px"])

  const cardTransforms = [
    { scale: scale1, y: y1 },
    { scale: scale2, y: y2 },
    { scale: scale3, y: y3 }
  ]

  return (
    <section ref={targetRef} className="relative h-[600vh] bg-black">
      <div className="sticky top-0 h-screen flex flex-col items-center pt-28 md:pt-32 overflow-hidden">

        {/* Background glow blooming behind the card deck */}
        <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center" aria-hidden>
          <motion.div
            className="absolute h-[450px] w-[450px] md:h-[650px] md:w-[650px] rounded-full blur-[120px] md:blur-[180px]"
            style={{
              background:
                'radial-gradient(circle, rgba(42,171,238,0.16) 0%, rgba(42,171,238,0.04) 40%, transparent 70%)',
            }}
            animate={reduceMotion ? {} : {
              scale: [1, 1.06, 1],
              opacity: [0.85, 1, 0.85],
            }}
            transition={{
              duration: 6,
              ease: 'easeInOut',
              repeat: Infinity,
            }}
          />
        </div>

        {/* Background horizontal traveling lines */}
        {!reduceMotion && (
          <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
            {[10, 18, 26, 34, 42, 50, 58, 66, 74, 82, 90].map((rowPercent, index) => (
              <motion.div
                key={index}
                style={{
                  position: 'absolute',
                  top: `${rowPercent}%`,
                  left: 0,
                  height: '2px',
                  width: '260px',
                  background: 'linear-gradient(90deg, transparent, #2AABEE, transparent)',
                  opacity: 0.65,
                }}
                animate={{ x: ['-260px', '100vw'] }}
                transition={{
                  duration: 5 + (index % 4) * 1.5,
                  ease: 'linear',
                  repeat: Infinity,
                  delay: (index % 5) * 0.7,
                }}
              />
            ))}
          </div>
        )}

        {/* Headline & Subtitle - Shrinks when scrolling starts */}
        <motion.div
          style={{ scale: headingScale, opacity: headingOpacity, y: headingY, transformOrigin: 'top center' }}
          className="relative z-20 text-center max-w-4xl flex flex-col items-center px-6"
        >
          <h2 className="text-4xl font-semibold leading-[1.1] tracking-tight md:text-5xl text-white">
            One workspace for
            <br />
            every Google account.
          </h2>
          <p className="mt-3 max-w-xl text-[15px] text-muted">
            Connect, sync, and browse every Drive account from one clean interface.
          </p>
        </motion.div>

        {/* Stacked Cards Container - Centered in remaining space below heading */}
        <div className="relative z-10 w-full flex-1 flex flex-col items-center justify-center min-h-0 mt-4 md:mt-8 pb-12">
          <div className="relative w-[calc(100vw-64px)] md:w-[min(700px,calc(100vw-96px))] aspect-[4/3] max-h-[60vh] md:max-h-[70vh]">
            {cards.map((card, idx) => {
              const transforms = cardTransforms[idx]

              return (
                <motion.div
                  key={idx}
                  style={{
                    scale: transforms.scale,
                    y: transforms.y,
                    transformOrigin: 'top center',
                  }}
                  className="absolute inset-0 w-full h-full rounded-[2rem] overflow-hidden border border-white/[0.12] bg-neutral-950 px-4 pb-4 pt-2 md:px-5 md:pb-5 md:pt-3 shadow-2xl flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[10px] font-bold tracking-widest text-accent uppercase bg-accent/10 px-2 py-0.5 rounded-full">
                      {card.step}
                    </span>
                    <h3 className="text-lg md:text-xl font-bold text-white mt-1.5">{card.title}</h3>
                    <p className="text-xs text-muted mt-0.5">{card.desc}</p>
                  </div>

                  <div className="relative flex-1 mt-4 rounded-[1.5rem] overflow-hidden border border-white/[0.12] bg-neutral-950">
                    <img
                      src={card.img}
                      className={`absolute inset-0 w-full h-full object-cover rounded-[1.5rem] ${
                        idx === 2 ? 'object-center lg:object-top' : 'object-top'
                      }`}
                      alt={card.alt}
                      loading="lazy"
                    />
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

      </div>
    </section>
  )
}

export default HowWorks
