import { motion, useReducedMotion } from 'framer-motion'
import { FaXTwitter, FaLinkedinIn, FaGithub, FaEnvelope } from 'react-icons/fa6'
import { SiDropbox } from 'react-icons/si'
import { ImOnedrive } from 'react-icons/im'
import { TbServer } from 'react-icons/tb'
import logo from '../../assets/logo-drive.png'

function Footer() {
  const reduceMotion = useReducedMotion()

  return (
    <footer className="relative overflow-hidden bg-[#0a0a0a] pt-20 pb-10 border-t border-white/5">

      {/* Top Ambient Wave */}
      <motion.div
        className="absolute top-0 left-0 h-40 w-[200%] opacity-20 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, #2AABEE 0%, transparent 50%)',
          backgroundSize: '50% 100%',
          filter: 'blur(50px)',
        }}
        animate={reduceMotion ? { x: 0 } : { x: ['0%', '-50%'] }}
        transition={{ repeat: Infinity, duration: 25, ease: 'linear' }}
      />

      {/* Bottom Ambient Wave */}
      <motion.div
        className="absolute bottom-0 left-0 h-40 w-[200%] opacity-20 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 100%, #2AABEE 0%, transparent 50%)',
          backgroundSize: '50% 100%',
          filter: 'blur(50px)',
        }}
        animate={reduceMotion ? { x: 0 } : { x: ['-50%', '0%'] }}
        transition={{ repeat: Infinity, duration: 25, ease: 'linear' }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-6">

        {/* Two Column Split (Left: Socials, Right: Logo in right-center) */}
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-16 w-full">

          {/* Left Side: Socials & Newsletter */}
          <div className="flex flex-1 flex-col items-center md:items-start gap-12 w-full">

            {/* Socials (Top) */}
            <div className="flex flex-col items-center md:items-start gap-5">
              <h4 className="text-[11px] font-semibold uppercase tracking-[0.05em] text-white/40">
                Connect
              </h4>
              <div className="flex items-center gap-4">
                <a href="https://x.com" target="_blank" rel="noreferrer" className="text-white/40 hover:text-white transition-all hover:scale-110">
                  <FaXTwitter size={20} />
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="text-white/40 hover:text-white transition-all hover:scale-110">
                  <FaLinkedinIn size={20} />
                </a>
                <a href="https://github.com" target="_blank" rel="noreferrer" className="text-white/40 hover:text-white transition-all hover:scale-110">
                  <FaGithub size={20} />
                </a>
                <a href="mailto:connect@dharmik.live" className="text-white/40 hover:text-white transition-all hover:scale-110">
                  <FaEnvelope size={20} />
                </a>
              </div>
            </div>

            {/* Newsletter Bar (Bottom) */}
            <div className="flex flex-col items-center md:items-start gap-3 w-full max-w-sm">
              <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-white/40">
                Drop Suggestions here
              </span>
              <div className="flex items-center w-full rounded-full border border-white/10 bg-transparent p-1 transition-colors focus-within:border-[#2AABEE]/50">
                <input
                  type="email"
                  placeholder="Message"
                  className="flex-1 bg-transparent px-5 py-2 text-sm text-white placeholder:text-white/30 outline-none w-full"
                />
                <a
                  href="mailto:connect@dharmik.live"
                  className="rounded-full bg-white px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-black transition-colors hover:bg-neutral-200 shrink-0"
                >
                  Send
                </a>
              </div>
            </div>

          </div>

          {/* Center: Drive Chain (Solid Line) */}
          <div className="flex flex-1 flex-col items-center justify-center w-full my-8 md:my-0 translate-x-4 md:translate-x-12 gap-8">

            <div className="relative flex items-center justify-between w-full max-w-[340px] px-2">
              {/* Solid Blue Line */}
              <div
                className="absolute top-1/2 left-6 right-6 h-[2px] bg-[#2AABEE] -translate-y-1/2 z-0"
              />

              {/* Google Drive */}
              <div className="relative z-10 w-12 h-12 rounded-full bg-[#0a0a0a] border border-[#2AABEE]/40 flex items-center justify-center shadow-[0_0_15px_rgba(42,171,238,0.15)]">
                <div className="w-[1.4rem] h-[1.4rem]">
                  <svg viewBox="0 0 87.3 78" width="100%" height="100%">
                    <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da" />
                    <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47" />
                    <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335" />
                    <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d" />
                    <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc" />
                    <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00" />
                  </svg>
                </div>
              </div>

              {/* Google Photos */}
              <div className="relative z-10 w-12 h-12 rounded-full bg-[#0a0a0a] border border-[#2AABEE]/40 flex items-center justify-center shadow-[0_0_15px_rgba(42,171,238,0.15)]">
                <div className="w-6 h-6">
                  <svg viewBox="0 0 100 100" width="100%" height="100%">
                    <path d="M50 50 L50 0 A25 25 0 0 0 50 50 Z" fill="#EA4335" />
                    <path d="M50 50 L100 50 A25 25 0 0 0 50 50 Z" fill="#4285F4" />
                    <path d="M50 50 L50 100 A25 25 0 0 0 50 50 Z" fill="#34A853" />
                    <path d="M50 50 L0 50 A25 25 0 0 0 50 50 Z" fill="#FBBC04" />
                  </svg>
                </div>
              </div>

              {/* Dropbox */}
              <div className="relative z-10 w-12 h-12 rounded-full bg-[#0a0a0a] border border-[#2AABEE]/40 flex items-center justify-center shadow-[0_0_15px_rgba(42,171,238,0.15)]">
                <SiDropbox size={24} color="#0061FF" />
              </div>

              {/* OneDrive */}
              <div className="relative z-10 w-12 h-12 rounded-full bg-[#0a0a0a] border border-[#2AABEE]/40 flex items-center justify-center shadow-[0_0_15px_rgba(42,171,238,0.15)]">
                <ImOnedrive size={24} color="#0364B8" />
              </div>

              {/* WebDAV */}
              <div className="relative z-10 w-12 h-12 rounded-full bg-[#0a0a0a] border border-[#2AABEE]/40 flex items-center justify-center shadow-[0_0_15px_rgba(42,171,238,0.15)]">
                <TbServer size={26} color="#E5E7EB" />
              </div>
            </div>

            {/* Beautiful Tagline Line */}
            <p className="text-[10px] uppercase tracking-[0.3em] font-semibold text-transparent bg-clip-text bg-gradient-to-r from-white/20 via-white/80 to-white/20">
              One Unified Platform
            </p>

          </div>

          {/* Right Side: Logo & Branding (Far Right) */}
          <div className="flex flex-1 flex-col items-center md:items-end justify-center">
            <div className="flex flex-col items-center gap-5 md:-translate-x-12">
              <img src={logo} alt="UniDrive" className="w-24 h-24 object-contain" />
              <span className="text-2xl font-bold tracking-widest text-white">
                UNIDRIVE
              </span>
            </div>
          </div>

        </div>

        {/* Bottom Row */}
        <div className="mt-20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-t border-white/10 pt-8 text-xs text-white/40">
          <p>
            &copy; 2026 &middot; UniDrive
          </p>
        </div>

      </div>
    </footer>
  )
}

export default Footer
