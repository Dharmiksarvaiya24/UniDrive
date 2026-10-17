import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiFolderPlus, FiLoader, FiX, FiAlertCircle } from 'react-icons/fi'

interface CreateFolderModalProps {
  isOpen: boolean
  isCreating: boolean
  error: string | null
  /** Human-readable destination, e.g. `"Work" · work@gmail.com` */
  targetLabel: string
  onClose: () => void
  onCreate: (name: string) => void
}

const CreateFolderModalContent: React.FC<CreateFolderModalProps> = ({
  isCreating,
  error,
  targetLabel,
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState('')

  // Close on Escape (unless a create is in flight)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isCreating) onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isCreating, onClose])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const clean = name.trim()
    if (!clean || isCreating) return
    onCreate(clean)
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          onClick={() => {
            if (!isCreating) onClose()
          }}
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#141416] p-6 shadow-2xl shadow-black/80"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            type="button"
            disabled={isCreating}
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-30 cursor-pointer"
          >
            <FiX className="h-5 w-5" />
          </button>

          {/* Icon */}
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10 text-accent">
            <FiFolderPlus className="h-6 w-6" />
          </div>

          {/* Title & Description */}
          <h3 className="text-lg font-semibold text-white">New folder</h3>
          <p className="mt-2 text-sm leading-relaxed text-white/60">
            Created in <span className="font-semibold text-white/90">{targetLabel}</span>
          </p>

          <form onSubmit={handleSubmit} className="mt-4">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Folder name"
              maxLength={255}
              autoFocus
              disabled={isCreating}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition-colors focus:border-accent/50 disabled:opacity-60"
            />

            {error && (
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-900/30 bg-red-950/30 px-3 py-2 text-xs text-red-300/90">
                <FiAlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isCreating}
                onClick={onClose}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-40 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreating || !name.trim()}
                className="flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-accent/25 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isCreating ? (
                  <>
                    <FiLoader className="h-4 w-4 animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <FiFolderPlus className="h-4 w-4" />
                    <span>Create Folder</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export const CreateFolderModal: React.FC<CreateFolderModalProps> = (props) => {
  // Mounting the content only while open resets the input on every open
  if (!props.isOpen) return null
  return <CreateFolderModalContent {...props} />
}
