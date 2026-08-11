import { useState } from 'react'
import { FiMenu, FiX } from 'react-icons/fi'
import logo from '../../assets/logo-drive.png'

const navLinks = [
  { label: 'Product', href: '#showcase' },
  { label: 'How Works', href: '#how-works' },
  { label: 'Integrations', href: '#integrations' },
  { label: 'Connect', href: '#footer' }
]

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault()
    if (targetId === '#') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      const element = document.querySelector(targetId)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }
    setMenuOpen(false)
  }

  return (
    <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-ink/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <a 
          href="#" 
          onClick={(e) => handleScroll(e, '#')}
          className="flex items-center gap-2"
        >
          <img src={logo} alt="Uni-drive logo" className="h-10 w-10 object-contain" />
          <span className="font-bold text-lg tracking-wide text-white">UniDrive</span>
        </a>

        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => handleScroll(e, link.href)}
              className="group relative text-[15px] text-muted transition-colors duration-300 hover:text-white"
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-accent transition-transform duration-300 group-hover:scale-x-100" />
            </a>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className="text-white md:hidden"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="flex flex-col gap-5 border-t border-white/10 px-6 pb-8 pt-5 md:hidden">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => handleScroll(e, link.href)}
              className="text-[15px] text-muted transition-colors duration-300 hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
    </header>
  )
}

export default Navbar
