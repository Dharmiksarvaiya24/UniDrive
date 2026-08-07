import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { SiGoogledrive } from 'react-icons/si'
import logo from '../../assets/logo-drive.png'

const VB_W = 1820
const VB_H = 500

const pathDefs = [
  {
    id: 'pathA',
    d: 'M-100,42 L272,42 L280,50 L280,97 L288,105 L543,105 L557,112 L744,249 L758,255 L810,255',
    side: 'left' as const,
  },
  {
    id: 'pathB',
    d: 'M-100,155 L412,155 L420,163 L802,253 L810,255',
    side: 'left' as const,
  },
  {
    id: 'pathC',
    d: 'M-100,460 L172,460 L180,452 L180,378 L188,370 L460,370 L474,363 L670,258 L685,255 L810,255',
    side: 'left' as const,
  },
  {
    id: 'pathD',
    d: 'M1940,95 L1488,95 L1480,103 L1480,165 L1472,173 L1200,173 L1186,180 L1020,252 L1012,255 L960,255',
    side: 'right' as const,
  },
  {
    id: 'pathE',
    d: 'M1940,310 L1318,310 L1310,302 L968,257 L960,255',
    side: 'right' as const,
  },
  {
    id: 'pathF',
    d: 'M1940,425 L1568,425 L1560,417 L1560,263 L1552,255 L960,255',
    side: 'right' as const,
  },
]

const elbowJoints = [
  { cx: 284, cy: 101 },
  { cx: 550, cy: 109 },
  { cx: 416, cy: 159 },
  { cx: 184, cy: 374 },
  { cx: 467, cy: 367 },
  { cx: 1476, cy: 169 },
  { cx: 1193, cy: 177 },
  { cx: 1314, cy: 306 },
  { cx: 1564, cy: 421 },
  { cx: 1556, cy: 259 },
]

const sockets: { cx: number; cy: number; side: 'left' | 'right'; ticks: number }[] = [
  { cx: 30, cy: 42, side: 'left', ticks: 2 },
  { cx: 30, cy: 155, side: 'left', ticks: 3 },
  { cx: 30, cy: 460, side: 'left', ticks: 2 },
  { cx: 1790, cy: 95, side: 'right', ticks: 3 },
  { cx: 1790, cy: 310, side: 'right', ticks: 2 },
  { cx: 1790, cy: 425, side: 'right', ticks: 2 },
]

const nodes = [
  { cx: 280, cy: 42, label: 'Account 1' },
  { cx: 420, cy: 155, label: 'Account 2' },
  { cx: 180, cy: 460, label: 'Account 3' },
  { cx: 1480, cy: 95, label: 'Account 4' },
  { cx: 1310, cy: 310, label: 'Account 5' },
  { cx: 1560, cy: 390, label: 'Account 6' },
]

const particles = [
  { x: 12, y: 10, size: 1.5, opacity: 0.04, drift: 6.2 },
  { x: 82, y: 32, size: 1, opacity: 0.05, drift: 7.8 },
  { x: 45, y: 78, size: 2, opacity: 0.03, drift: 5.5 },
  { x: 28, y: 55, size: 1, opacity: 0.06, drift: 8.1 },
  { x: 68, y: 18, size: 1.5, opacity: 0.04, drift: 6.9 },
  { x: 92, y: 62, size: 1, opacity: 0.05, drift: 7.2 },
  { x: 55, y: 42, size: 2, opacity: 0.03, drift: 5.8 },
  { x: 5, y: 85, size: 1, opacity: 0.04, drift: 7.5 },
  { x: 37, y: 92, size: 1.5, opacity: 0.05, drift: 6.4 },
  { x: 75, y: 6, size: 1, opacity: 0.06, drift: 8.3 },
  { x: 18, y: 38, size: 2, opacity: 0.03, drift: 5.3 },
  { x: 60, y: 70, size: 1, opacity: 0.04, drift: 7.1 },
  { x: 95, y: 48, size: 1.5, opacity: 0.05, drift: 6.7 },
]

const NODE_SIZE_SM = 36
const NODE_SIZE_MD = 56

const toPercent = (v: number, span: number) => `${((v / span) * 100).toFixed(4)}%`

function useMeasuredPathLengths(ids: string[]) {
  const [lengths, setLengths] = useState<Record<string, number>>({})
  const rafId = useRef(0)

  const measure = useCallback(() => {
    const result: Record<string, number> = {}
    ids.forEach((id) => {
      const el = document.getElementById(id)
      if (el) result[id] = (el as unknown as SVGPathElement).getTotalLength()
    })
    return result
  }, [ids])

  useEffect(() => {
    rafId.current = requestAnimationFrame(() => {
      setLengths(measure())
    })
    return () => cancelAnimationFrame(rafId.current)
  }, [measure])

  return lengths
}

const PATH_IDS = pathDefs.map((p) => p.id)

function HeroVisual() {
  const reduceMotion = useReducedMotion()
  const lengths = useMeasuredPathLengths(PATH_IDS)

  return (
    <div className="relative mx-auto mt-8 w-full md:mt-16" style={{ aspectRatio: `${VB_W} / ${VB_H}` }}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
      >
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[60px] md:blur-[120px]"
          style={{
            width: 'min(950px, 80%)',
            height: 'min(600px, 90%)',
            background: 'radial-gradient(circle, rgba(42,171,238,0.07) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute rounded-full blur-[50px] md:blur-[100px]"
          style={{
            width: 'min(400px, 35%)',
            height: 'min(400px, 60%)',
            left: '25%',
            top: '15%',
            background: 'radial-gradient(circle, rgba(42,171,238,0.04) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute rounded-full blur-[45px] md:blur-[90px]"
          style={{
            width: 'min(350px, 30%)',
            height: 'min(350px, 55%)',
            right: '20%',
            bottom: '10%',
            background: 'radial-gradient(circle, rgba(42,171,238,0.04) 0%, transparent 70%)',
          }}
        />

        {particles.map((p, i) => (
          <motion.div
            key={`particle-${i}`}
            className="absolute rounded-full bg-white"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              opacity: p.opacity,
            }}
            animate={
              reduceMotion
                ? undefined
                : { x: [0, 3, -2, 0], y: [0, -2, 3, 0] }
            }
            transition={{
              duration: p.drift,
              ease: 'easeInOut',
              repeat: Infinity,
            }}
          />
        ))}
      </div>

      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        overflow="visible"
        className="absolute inset-0 z-[1] h-full w-full pointer-events-none"
      >
        <defs>
          <linearGradient id="gradLeft" gradientUnits="userSpaceOnUse" x1="-100" y1="255" x2="810" y2="255">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
            <stop offset="8%" stopColor="#FFFFFF" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.08" />
          </linearGradient>
          <linearGradient id="gradRight" gradientUnits="userSpaceOnUse" x1="960" y1="255" x2="1940" y2="255">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.08" />
            <stop offset="92%" stopColor="#FFFFFF" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
        </defs>

        {pathDefs.map(({ id, d, side }) => (
          <path
            key={id}
            id={id}
            d={d}
            fill="none"
            stroke={side === 'left' ? 'url(#gradLeft)' : 'url(#gradRight)'}
            strokeWidth="1"
          />
        ))}

        {elbowJoints.map(({ cx, cy }) => (
          <circle
            key={`elbow-${cx}-${cy}`}
            cx={cx}
            cy={cy}
            r="3"
            fill="#FFFFFF"
            fillOpacity="0.3"
          />
        ))}

        {sockets.map(({ cx, cy, side, ticks }) => {
          const dir = side === 'left' ? -1 : 1
          return (
            <g key={`socket-${cx}-${cy}`}>
              <circle
                cx={cx}
                cy={cy}
                r="5"
                fill="none"
                stroke="#FFFFFF"
                strokeOpacity="0.2"
                strokeWidth="1"
              />
              {Array.from({ length: ticks }, (_, i) => (
                <line
                  key={i}
                  x1={cx + dir * (14 + i * 10)}
                  y1={cy - 4}
                  x2={cx + dir * (14 + i * 10)}
                  y2={cy + 4}
                  stroke="#FFFFFF"
                  strokeOpacity="0.15"
                  strokeWidth="1"
                />
              ))}
            </g>
          )
        })}

        {!reduceMotion &&
          pathDefs.map(({ id, d }, index) => {
            const length = lengths[id]
            if (!length) return null
            return (
              <motion.path
                key={`glow-${id}`}
                d={d}
                fill="none"
                stroke="#2AABEE"
                strokeWidth="1.5"
                strokeLinecap="round"
                style={{ filter: 'drop-shadow(0 0 3px #29A9EA)' }}
                strokeDasharray={`${length * 0.08} ${length}`}
                animate={{ strokeDashoffset: [0, -length] }}
                transition={{
                  duration: 3 + index * 0.4,
                  ease: 'linear',
                  repeat: Infinity,
                  delay: index * 0.5,
                }}
              />
            )
          })}
      </svg>

      <div className="absolute inset-0 z-[2] flex items-center justify-center pointer-events-none">
        {!reduceMotion ? (
          <motion.div
            className="h-[120px] w-[120px] rounded-full blur-3xl md:h-[220px] md:w-[220px]"
            style={{
              background: 'radial-gradient(circle, #29A9EA 0%, transparent 70%)',
            }}
            animate={{ scale: [1, 1.08, 1], opacity: [0.18, 0.28, 0.18] }}
            transition={{ duration: 3, ease: 'easeInOut', repeat: Infinity }}
          />
        ) : (
          <div
            className="h-[120px] w-[120px] rounded-full blur-3xl opacity-[0.18] md:h-[220px] md:w-[220px]"
            style={{
              background: 'radial-gradient(circle, #29A9EA 0%, transparent 70%)',
            }}
          />
        )}
      </div>

      <div
        className="absolute z-10 flex h-16 w-16 items-center justify-center rounded-xl border border-[#2AABEE]/30 bg-[#141414] -translate-x-1/2 -translate-y-1/2 md:h-[150px] md:w-[150px] md:rounded-2xl"
        style={{
          left: toPercent(885, VB_W),
          top: toPercent(255, VB_H),
          boxShadow: '0 0 20px rgba(42,171,238,0.15)',
        }}
      >
        <img src={logo} alt="Uni-drive logo" className="h-8 w-8 object-contain md:h-20 md:w-20" />
      </div>

      {nodes.map(({ cx, cy, label }) => (
        <div
          key={label}
          role="img"
          aria-label={label}
          title={label}
          className="absolute z-[3] flex items-center justify-center rounded-lg border border-white/10 bg-[#141414] -translate-x-1/2 -translate-y-1/2 md:rounded-xl"
          style={{
            width: `clamp(${NODE_SIZE_SM}px, 3.8vw, ${NODE_SIZE_MD}px)`,
            height: `clamp(${NODE_SIZE_SM}px, 3.8vw, ${NODE_SIZE_MD}px)`,
            left: toPercent(cx, VB_W),
            top: toPercent(cy, VB_H),
          }}
        >
          <SiGoogledrive className="h-4 w-4 text-[#d6d6d6] md:h-7 md:w-7" />
        </div>
      ))}
    </div>
  )
}

export default HeroVisual
