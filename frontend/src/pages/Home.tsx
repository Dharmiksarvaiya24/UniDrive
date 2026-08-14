import Navbar from '../components/layout/Navbar'
import Hero from '../components/layout/Hero'
import ShowcaseSection from '../components/layout/ShowcaseSection'
import HowWorks from '../components/sections/HowWorks'
import IntegrationPlan from '../components/sections/IntegrationPlan'
import Footer from '../components/layout/Footer'

function Home() {
  return (
    <>
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
