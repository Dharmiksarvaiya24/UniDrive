import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiTrash2, FiCheckSquare, FiSquare, FiX, FiShare2, FiCopy, FiCheck, FiLoader } from 'react-icons/fi'
import type { DriveFile } from '../../types/drive'

interface SelectionActionBarProps {
  selectedCount: number
  totalCount: number
  selectedFiles: DriveFile[]
  isSharing: boolean
  onSelectAll: () => void
  onDeselectAll: () => void
  onShareSelected: () => void
  onCopySelected: () => void
  onDeleteSelected: () => void
}

export const SelectionActionBar: React.FC<SelectionActionBarProps> = ({
  selectedCount,
  totalCount,
  selectedFiles,
  isSharing,
  onSelectAll,
  onDeselectAll,
  onShareSelected,
  onCopySelected,
  onDeleteSelected,
}) => {
  const isAllSelected = selectedCount > 0 && selectedCount === totalCount
  // Folders are excluded from share/copy — only files are shareable in this app
  const shareableCount = selectedFiles.filter(
    (f) => f.mimeType !== 'application/vnd.google-apps.folder' && f.mimeType !== 'folder'
  ).length
  const [linkCopied, setLinkCopied] = useState(false)

  useEffect(() => {
    if (!linkCopied) return
    const t = setTimeout(() => setLinkCopied(false), 2000)
    return () => clearTimeout(t)
  }, [linkCopied])

  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-2xl border border-white/15 bg-[#18181d]/90 px-4 py-2.5 shadow-2xl shadow-black/80 backdrop-blur-xl"
        >
          {/* Selected count */}
          <div className="flex items-center gap-2 pr-2 border-r border-white/10">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-white shadow-sm shadow-accent/40">
              {selectedCount}
            </span>
            <span className="text-xs font-medium text-white/90">
              {selectedCount === 1 ? '1 file selected' : `${selectedCount} files selected`}
            </span>
          </div>

          {/* Select / Deselect All */}
          <button
            type="button"
            onClick={isAllSelected ? onDeselectAll : onSelectAll}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            {isAllSelected ? (
              <>
                <FiSquare className="h-3.5 w-3.5 text-white/60" />
                <span>Deselect all</span>
              </>
            ) : (
              <>
                <FiCheckSquare className="h-3.5 w-3.5 text-accent" />
                <span>Select all ({totalCount})</span>
              </>
            )}
          </button>

          {/* Share Selected Button — files only */}
          {shareableCount > 0 && (
            <button
              type="button"
              onClick={onShareSelected}
              disabled={isSharing}
              title="Share: anyone with the link can view"
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 hover:border-blue-400/40 hover:bg-blue-400/10 hover:text-blue-300 transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
            >
              {isSharing ? (
                <>
                  <FiLoader className="h-3.5 w-3.5 animate-spin" />
                  <span>Sharing...</span>
                </>
              ) : (
                <>
                  <FiShare2 className="h-3.5 w-3.5 text-blue-400" />
                  <span>
                    Share{shareableCount > 1 ? ` (${shareableCount})` : ''}
                  </span>
                </>
              )}
            </button>
          )}

          {/* Copy Link Button — copies link(s) of selected files */}
          {shareableCount > 0 && (
            <button
              type="button"
              onClick={() => {
                onCopySelected()
                setLinkCopied(true)
              }}
              title="Copy link"
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 hover:bg-white/10 hover:text-white transition-all active:scale-95 cursor-pointer"
            >
              {linkCopied ? (
                <>
                  <FiCheck className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <FiCopy className="h-3.5 w-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          )}

          {/* Delete Selected Button */}
          <button
            type="button"
            onClick={onDeleteSelected}
            className="flex items-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-red-600/30 transition-all active:scale-95 cursor-pointer"
          >
            <FiTrash2 className="h-3.5 w-3.5" />
            <span>Delete</span>
          </button>

          {/* Clear selection */}
          <button
            type="button"
            onClick={onDeselectAll}
            title="Clear selection"
            aria-label="Clear selection"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-white/40 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <FiX className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
