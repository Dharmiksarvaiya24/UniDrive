import Navbar from './components/layout/Navbar'
import Hero from './components/layout/Hero'
import ShowcaseSection from './components/layout/ShowcaseSection'

function App() {
  return (
    <>
      <Navbar />
      <main className="h-screen overflow-y-auto snap-y snap-mandatory scroll-smooth">
        <div className="snap-start w-full">
          <Hero />
        </div>
        <div className="snap-start w-full">
          <ShowcaseSection />
        </div>
      </main>
    </>
  )
}

export default App
