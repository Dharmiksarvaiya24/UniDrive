import React from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
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
  const shouldReduceMotion = useReducedMotion()
  const isMultiple = files.length > 1

  return (
    <AnimatePresence>
      {isOpen && files.length > 0 && (
        <div key="delete-confirm" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Dimming scrim — pairs the surface with a dim to focus on the modal task */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0.15 : 0.2 }}
            className="fixed inset-0 bg-black/60"
            onClick={() => {
              if (!isDeleting) onClose()
            }}
          />

          {/* Modal Dialog — translucent material: blur + scale arrive together */}
          <motion.div
            initial={
              shouldReduceMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.96, y: 8, filter: 'blur(8px)' }
            }
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
            exit={
              shouldReduceMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.96, y: 8, filter: 'blur(8px)' }
            }
            transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#1c1c1e]/75 p-6 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.7),inset_0_1px_0_0_rgba(255,255,255,0.08)]"
            style={{ willChange: 'transform, opacity, filter' }}
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
              className="absolute right-4 top-4 rounded-full p-1.5 text-white/40 transition-all duration-100 ease-out hover:bg-white/10 hover:text-white active:scale-90 disabled:opacity-30 cursor-pointer"
            >
              <FiX className="h-5 w-5" />
            </button>

            {/* Warning Icon */}
            

            {/* Title & Description — weight + size + tracking as a set */}
            <h3 id="delete-confirm-title" className="text-lg font-semibold tracking-tight text-white">
              {isMultiple
                ? `Delete ${files.length} item${files.length > 1 ? 's' : ''}?`
                : 'Delete this file?'}
            </h3>
            <p id="delete-confirm-description" className="mt-2 text-sm leading-relaxed text-white/60">
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
                  <span className="break-all font-semibold text-white/90">"{files[0]?.name}"</span>{' '}
                  from Google Drive?
                </>
              )}
            </p>

            {/* Preview of items being deleted if multiple */}
            {isMultiple && (
              <div
                className="mt-4 max-h-32 space-y-0.5 overflow-y-auto overscroll-contain rounded-2xl border border-white/[0.06] bg-black/20 p-2"
                style={{
                  maskImage: 'linear-gradient(to bottom, transparent 0, black 8px, black calc(100% - 8px), transparent 100%)',
                  WebkitMaskImage:
                    'linear-gradient(to bottom, transparent 0, black 8px, black calc(100% - 8px), transparent 100%)',
                  maskComposite: 'intersect',
                  WebkitMaskComposite: 'source-in',
                }}
              >
                {files.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-xs text-white/70 transition-colors hover:bg-white/[0.04]"
                  >
                    <span className="truncate">{f.name}</span>
                    <span className="shrink-0 text-[10px] text-white/40">{f.accountEmail}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Consequence banner — clear, plain language about what will happen */}
            <div className="mt-4 flex items-center gap-2.5 rounded-2xl border border-red-500/15 bg-red-950/30 px-3.5 py-2.5 text-xs leading-relaxed text-red-300/90">
              <FiAlertTriangle className="h-4 w-4 shrink-0 text-red-400" aria-hidden="true" />
              <span>
                {isMultiple
                  ? `These ${files.length} files will be permanently deleted from Google Drive.`
                  : 'This file will be permanently deleted from Google Drive.'}
              </span>
            </div>

            {/* Action Buttons — feedback lives on the press, instantly */}
            <div className="mt-6 flex items-stretch justify-end gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={onClose}
                className="flex-1 basis-0 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm font-medium text-white/80 transition-all duration-100 ease-out hover:bg-white/10 hover:text-white active:scale-[0.97] disabled:opacity-40 cursor-pointer sm:flex-none"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={onConfirm}
                className="flex flex-1 basis-0 items-center justify-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-600/25 transition-all duration-100 ease-out hover:bg-red-500 active:scale-[0.97] disabled:opacity-50 cursor-pointer sm:flex-none"
              >
                {isDeleting ? (
                  <>
                    <FiLoader className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                    <span>Deleting…</span>
                  </>
                ) : (
                  <>
                    <FiTrash2 className="h-4 w-4" aria-hidden="true" />
                    <span>Delete{isMultiple ? ` ${files.length}` : ' File'}</span>
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
