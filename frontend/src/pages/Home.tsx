import { useEffect, useState } from 'react'
import Navbar from '../components/layout/Navbar'
import Hero from '../components/layout/Hero'
import ShowcaseSection from '../components/layout/ShowcaseSection'
import HowWorks from '../components/sections/HowWorks'
import IntegrationPlan from '../components/sections/IntegrationPlan'
import Footer from '../components/layout/Footer'

function Home() {
  const [error, setError] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    const urlError = new URLSearchParams(window.location.search).get('error')
    return urlError ? decodeURIComponent(urlError) : null
  })

  useEffect(() => {
    if (error && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      params.delete('error')
      window.history.replaceState({}, '', params.toString() ? `?${params}` : window.location.pathname)
    }
  }, [error])

  return (
    <>
      {error && (
        <div className="fixed top-24 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 backdrop-blur-md">
          <div className="flex items-center gap-3 text-sm text-red-300">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      <Navbar />
      <main>
        <div>
          <Hero />
        </div>
        <div id="showcase">
          <ShowcaseSection />
        </div>
        <div id="how-works">
          <HowWorks />
        </div>
        <div id="integrations">
          <IntegrationPlan />
        </div>
      </main>
      <div id="footer">
        <Footer />
      </div>
    </>
  )
}

export default Home
