import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiPlus, FiChevronDown, FiUploadCloud, FiFolderPlus } from 'react-icons/fi'

interface NewMenuProps {
  onUploadFiles: () => void
  onNewFolder: () => void
}

export const NewMenu: React.FC<NewMenuProps> = ({ onUploadFiles, onNewFolder }) => {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Upload files or create a folder"
        className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all cursor-pointer ${
          open
            ? 'border-accent/40 bg-accent/15 text-accent shadow-sm shadow-accent/10'
            : 'border-accent/30 bg-accent/10 text-accent hover:bg-accent/20'
        }`}
      >
        <FiPlus className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">New</span>
        <FiChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full mt-2 w-56 max-w-[calc(100vw-2rem)] origin-top-left overflow-hidden rounded-xl border border-white/10 bg-[#161616] p-1.5 shadow-2xl shadow-black/80 z-50 backdrop-blur-xl"
          >
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                onUploadFiles()
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs text-white/70 transition-colors hover:bg-white/5 hover:text-white cursor-pointer"
            >
              <FiUploadCloud className="h-4 w-4 shrink-0 text-accent" />
              <div className="flex flex-col items-start">
                <span>Upload files</span>
                <span className="text-[10px] text-white/30">Drag &amp; drop also works</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setOpen(false)
                onNewFolder()
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs text-white/70 transition-colors hover:bg-white/5 hover:text-white cursor-pointer"
            >
              <FiFolderPlus className="h-4 w-4 shrink-0 text-accent" />
              <div className="flex flex-col items-start">
                <span>New folder</span>
                <span className="text-[10px] text-white/30">Create a folder here</span>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
