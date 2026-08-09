import Navbar from './components/layout/Navbar'
import Hero from './components/layout/Hero'
import ShowcaseSection from './components/layout/ShowcaseSection'
import HowWorks from './components/sections/HowWorks'

function App() {
  return (
    <>
      <Navbar />
      <main>
        <div>
          <Hero />
        </div>
        <div>
          <ShowcaseSection />
        </div>
        <div>
          <HowWorks />
        </div>
      </main>
    </>
  )
}

export default App
