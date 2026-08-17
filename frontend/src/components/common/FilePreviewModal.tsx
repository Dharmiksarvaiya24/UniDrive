import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiExternalLink, FiDownload } from 'react-icons/fi'
import { FaGoogleDrive } from 'react-icons/fa'

interface FilePreviewModalProps {
  fileId?: string
  fileName?: string
  webViewLink?: string
  accountEmail?: string
  isOpen: boolean
  onClose: () => void
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  fileId,
  fileName,
  webViewLink,
  accountEmail,
  isOpen,
  onClose,
}) => {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen || !fileId) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 320 }}
          className="relative z-10 flex h-[88vh] w-[94vw] max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#121214] shadow-2xl shadow-black/80"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 bg-[#18181b] px-4 sm:px-5">
            {/* File Info */}
            <div className="flex flex-col overflow-hidden pr-3">
              <span className="truncate text-sm font-semibold text-white/90" title={fileName}>
                {fileName || 'File Preview'}
              </span>
              {accountEmail && (
                <div className="flex items-center gap-1.5 text-xs text-white/40">
                  <FaGoogleDrive className="h-3 w-3 shrink-0 text-white/30" />
                  <span className="truncate">{accountEmail}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Download Button */}
              <a
                href={`https://drive.google.com/uc?export=download&id=${fileId}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Download file"
                className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white"
              >
                <FiDownload className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Download</span>
              </a>

              {/* Open in Google Drive */}
              {webViewLink && (
                <a
                  href={webViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open in Google Drive"
                  className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:border-accent/40 hover:bg-accent/10"
                >
                  <span className="hidden md:inline">Open in Drive</span>
                  <FiExternalLink className="h-3.5 w-3.5" />
                </a>
              )}

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close preview"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 transition-colors hover:bg-white/10 hover:text-white"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Iframe Preview Body */}
          <div className="relative flex-1 bg-[#0d0d0f]">
            <iframe
              src={`https://drive.google.com/file/d/${fileId}/preview`}
              width="100%"
              height="100%"
              allow="autoplay"
              title={fileName || 'Google Drive File Preview'}
              className="h-full w-full border-0"
            />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
