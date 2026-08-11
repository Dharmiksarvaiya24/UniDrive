import { useReducedMotion } from 'framer-motion'
import { SiDropbox } from 'react-icons/si'
import { ImOnedrive } from 'react-icons/im'
import { TbServer } from 'react-icons/tb'
import logo from '../../assets/logo-drive.png'

function IntegrationOrbit() {
  const reduceMotion = useReducedMotion()

  return (
    <div className="relative w-full max-w-[600px] aspect-square mx-auto bg-[#0a0a0a]">
      {/* SVG Canvas for Orbits and Center Ring */}
      <svg
        viewBox="0 0 600 600"
        className="absolute inset-0 w-full h-full pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="orbitGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#2AABEE" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#2AABEE" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Static background glow */}
        <circle
          cx="300"
          cy="300"
          r="240"
          fill="url(#orbitGlow)"
        />

        {/* Orbit Path 1 (Top-Left to Bottom-Right) */}
        <ellipse
          cx="300"
          cy="300"
          rx="280"
          ry="110"
          transform="rotate(35 300 300)"
          fill="none"
          stroke="rgba(42,171,238,0.2)"
          strokeWidth="1.5"
        />

        {/* Orbit Path 2 (Bottom-Left to Top-Right) */}
        <ellipse
          cx="300"
          cy="300"
          rx="280"
          ry="110"
          transform="rotate(-35 300 300)"
          fill="none"
          stroke="rgba(42,171,238,0.2)"
          strokeWidth="1.5"
        />

        {/* Orbit 1 Badges */}
        <g transform="translate(300,300) rotate(35)">
          {/* WebDAV (Right side) */}
          <g transform={`translate(${reduceMotion ? 280 : 0}, 0)`}>
            {!reduceMotion && (
              <animateMotion dur="25s" repeatCount="indefinite" path="M 280 0 A 280 110 0 1 1 -280 0 A 280 110 0 1 1 280 0" />
            )}
            <g transform="rotate(-35)">
              <g transform="translate(-35, -35)">
                <TbServer size={70} color="#E5E7EB" />
              </g>
            </g>
          </g>

          {/* Google Photos (Left side) */}
          <g transform={`translate(${reduceMotion ? -280 : 0}, 0)`}>
            {!reduceMotion && (
              <animateMotion dur="25s" repeatCount="indefinite" path="M -280 0 A 280 110 0 1 1 280 0 A 280 110 0 1 1 -280 0" />
            )}
            <g transform="rotate(-35)">
              <g transform="translate(-35, -35) scale(0.70)">
                <path d="M50 50 L50 0 A25 25 0 0 0 50 50 Z" fill="#EA4335" />
                <path d="M50 50 L100 50 A25 25 0 0 0 50 50 Z" fill="#4285F4" />
                <path d="M50 50 L50 100 A25 25 0 0 0 50 50 Z" fill="#34A853" />
                <path d="M50 50 L0 50 A25 25 0 0 0 50 50 Z" fill="#FBBC04" />
              </g>
            </g>
          </g>
        </g>

        {/* Orbit 2 Badges */}
        <g transform="translate(300,300) rotate(-35)">
          {/* Dropbox (Right side) */}
          <g transform={`translate(${reduceMotion ? 280 : 0}, 0)`}>
            {!reduceMotion && (
              <animateMotion dur="25s" repeatCount="indefinite" path="M 280 0 A 280 110 0 1 1 -280 0 A 280 110 0 1 1 280 0" />
            )}
            <g transform="rotate(35)">
              <g transform="translate(-35, -35)">
                <SiDropbox size={70} color="#0061FF" />
              </g>
            </g>
          </g>

          {/* OneDrive (Left side) */}
          <g transform={`translate(${reduceMotion ? -280 : 0}, 0)`}>
            {!reduceMotion && (
              <animateMotion dur="25s" repeatCount="indefinite" path="M -280 0 A 280 110 0 1 1 280 0 A 280 110 0 1 1 -280 0" />
            )}
            <g transform="rotate(35)">
              <g transform="translate(-35, -35)">
                <ImOnedrive size={70} color="#0364B8" />
              </g>
            </g>
          </g>
        </g>


      </svg>

      {/* Center Image Overlay */}
      <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
        <img 
          src={logo} 
          alt="UniDrive Logo" 
          className="w-24 h-24 md:w-32 md:h-32 object-contain drop-shadow-[0_0_20px_rgba(42,171,238,0.4)]" 
        />
      </div>
    </div>
  )
}

export default IntegrationOrbit
