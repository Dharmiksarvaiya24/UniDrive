import { motion, useReducedMotion } from 'framer-motion'
import { TbCircleCheckFilled } from 'react-icons/tb'
import IntegrationOrbit from './IntegrationOrbit'

function IntegrationPlan() {
  const reduceMotion = useReducedMotion()

  return (
    <section className="bg-[#0a0a0a] py-24 px-6 md:py-32">
      <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center gap-16 lg:gap-24">

        {/* Left Column: Text content */}
        <motion.div
          className="flex-1 w-full"
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <span className="text-muted text-sm font-semibold tracking-wider uppercase mb-3 block">
            Roadmap
          </span>
          <h2 className="text-3xl md:text-[40px] font-semibold tracking-tight leading-[1.15] mb-6 bg-gradient-to-b from-white to-[#b7d8ea] bg-clip-text text-transparent">
            Where we're headed next
          </h2>
          <p className="text-muted text-lg leading-relaxed mb-10 max-w-xl">
            We’re starting with Google Drive and adding more ways to store and access your files.
          </p>

          <ul className="space-y-6 relative">
            {/* The vertical connecting line and shining animation */}
            <div className="absolute left-[9px] top-4 bottom-6 w-[2px] bg-[#2AABEE]/20 overflow-hidden">
              <motion.div
                className="absolute left-0 right-0 h-[40%] bg-gradient-to-b from-transparent via-[#2AABEE] to-transparent"
                animate={reduceMotion ? {} : { top: ['-40%', '100%'] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: 'linear' }}
              />
            </div>

            <li className="flex items-start gap-4 relative z-10">
              <div className="bg-[#0a0a0a] rounded-full mt-0.5 shrink-0 z-10 p-[2px] -ml-[2px]">
                <TbCircleCheckFilled className="text-[#2AABEE] text-[1.125rem]" />
              </div>
              <p className="text-muted leading-relaxed">
                <strong className="text-white/90 font-medium">Near-term:</strong>Integrations for Google Photos, Dropbox, OneDrive, and WebDAV.
              </p>
            </li>
            <li className="flex items-start gap-4 relative z-10">
              <div className="bg-[#0a0a0a] rounded-full mt-0.5 shrink-0 z-10 p-[2px] -ml-[2px]">
                <TbCircleCheckFilled className="text-[#2AABEE] text-[1.125rem]" />
              </div>
              <p className="text-muted leading-relaxed">
                <strong className="text-white/90 font-medium">Mid-term:</strong> Support for S3-compatible cloud storage, self-hosted NAS, and WebDAV protocols.
              </p>
            </li>
            <li className="flex items-start gap-4 relative z-10">
              <div className="bg-[#0a0a0a] rounded-full mt-0.5 shrink-0 z-10 p-[2px] -ml-[2px]">
                <TbCircleCheckFilled className="text-[#2AABEE] text-[1.125rem]" />
              </div>
              <p className="text-muted leading-relaxed">
                <strong className="text-white/90 font-medium">Long-term:</strong> Build and add your own storage connections.
              </p>
            </li>
          </ul>
        </motion.div>

        {/* Right Column: Image */}
        <motion.div
          className="flex-1 w-full"
          initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
        >
          <div className="relative rounded-2xl overflow-hidden bg-neutral-900">
            <IntegrationOrbit />
          </div>
        </motion.div>

      </div>
    </section>
  )
}

export default IntegrationPlan
