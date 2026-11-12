import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiTrash2, FiAlertTriangle, FiLoader, FiX } from 'react-icons/fi'
import type { DriveFile } from '../../types/drive'

interface DeleteConfirmModalProps {
  isOpen: boolean
  files: DriveFile[]
  isDeleting: boolean
  onClose: () => void
  onConfirm: () => void
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  files,
  isDeleting,
  onClose,
  onConfirm,
}) => {
  const isMultiple = files.length > 1

  // Close on Escape (unless a delete is in flight)
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isDeleting, onClose])

  return (
    <AnimatePresence>
      {isOpen && files.length > 0 && (
        <div
          key="delete-confirm"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => {
              if (!isDeleting) onClose()
            }}
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#141416] p-6 shadow-2xl shadow-black/80"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-confirm-title"
            aria-describedby="delete-confirm-description"
          >
            {/* Close button */}
            <button
              type="button"
              disabled={isDeleting}
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 top-4 rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-30 cursor-pointer"
            >
              <FiX className="h-5 w-5" />
            </button>

            {/* Icon */}
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400">
              <FiTrash2 className="h-6 w-6" />
            </div>

            {/* Title & Description */}
            <h3
              id="delete-confirm-title"
              className="text-lg font-semibold text-white"
            >
              {isMultiple
                ? `Delete ${files.length} item${files.length > 1 ? 's' : ''}?`
                : 'Delete this file?'}
            </h3>
            <p
              id="delete-confirm-description"
              className="mt-2 text-sm leading-relaxed text-white/60"
            >
              {isMultiple ? (
                <>
                  Are you sure you want to delete{' '}
                  <span className="font-semibold text-white/90">
                    {files.length} selected files
                  </span>{' '}
                  from Google Drive?
                </>
              ) : (
                <>
                  Are you sure you want to delete{' '}
                  <span className="break-all font-semibold text-white/90">
                    "{files[0]?.name}"
                  </span>{' '}
                  from Google Drive?
                </>
              )}
            </p>

            {/* Preview of items being deleted if multiple */}
            {isMultiple && (
              <div className="mt-4 max-h-32 space-y-0.5 overflow-y-auto overscroll-contain rounded-xl border border-white/5 bg-white/[0.03] p-2">
                {files.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-xs text-white/70 transition-colors hover:bg-white/[0.04]"
                  >
                    <span className="truncate">{f.name}</span>
                    <span className="shrink-0 text-[10px] text-white/40">
                      {f.accountEmail}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Warning banner */}
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-900/30 bg-red-950/30 px-3 py-2.5 text-xs leading-relaxed text-red-300/90">
              <FiAlertTriangle
                className="mt-0.5 h-4 w-4 shrink-0 text-red-400"
                aria-hidden="true"
              />
              <span>
                {isMultiple
                  ? `These ${files.length} files will be permanently deleted from Google Drive.`
                  : 'This file will be permanently deleted from Google Drive.'}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={onClose}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-40 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={onConfirm}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-red-600/25 transition-all hover:bg-red-500 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <FiLoader
                      className="h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                    <span>Deleting…</span>
                  </>
                ) : (
                  <>
                    <FiTrash2 className="h-4 w-4" aria-hidden="true" />
                    <span>
                      Delete{isMultiple ? ` ${files.length}` : ' File'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
