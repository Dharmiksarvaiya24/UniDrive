import React from 'react'
import { motion } from 'framer-motion'
import { FiDownload, FiTrash2, FiCheck } from 'react-icons/fi'
import { MacFileIcon } from './MacFileIcon'
import type { DriveFile } from '../../types/drive'

interface FileGridViewProps {
  files: DriveFile[]
  selectedFileIds?: Set<string>
  onItemClick: (file: DriveFile) => void
  onDownload: (file: DriveFile) => void
  onToggleSelect?: (file: DriveFile) => void
  onDelete?: (file: DriveFile) => void
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '—'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`
}

function getFileSubtitle(file: DriveFile): { text: string; isHighlight: boolean } {
  if (file.mimeType === 'application/vnd.google-apps.folder' || file.mimeType === 'folder') {
    return { text: 'Folder', isHighlight: true }
  }
  if (file.dimensions) {
    return { text: file.dimensions, isHighlight: true }
  }
  if (file.size > 0) {
    return { text: formatBytes(file.size), isHighlight: true }
  }
  return { text: file.accountEmail.split('@')[0], isHighlight: false }
}

export const FileGridView: React.FC<FileGridViewProps> = ({
  files,
  selectedFileIds = new Set(),
  onItemClick,
  onDownload,
  onToggleSelect,
  onDelete,
}) => {
  const hasSelections = selectedFileIds.size > 0

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="grid grid-cols-2 gap-y-8 gap-x-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7"
    >
      {files.map((file, i) => {
        const subtitle = getFileSubtitle(file)
        const isFolder = file.mimeType === 'application/vnd.google-apps.folder' || file.mimeType === 'folder'
        const isSelected = selectedFileIds.has(file.id)

        return (
          <motion.div
            key={file.id}
            role="button"
            tabIndex={0}
            onClick={() => onItemClick(file)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onItemClick(file)
              }
            }}
            title={`${file.name} (${file.accountEmail})`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, delay: Math.min(i * 0.02, 0.6) }}
            className={`group relative flex cursor-pointer flex-col items-center rounded-xl p-2.5 transition-all focus:outline-none ${
              isSelected
                ? 'bg-blue-600/15 ring-2 ring-blue-500 shadow-lg shadow-blue-500/10'
                : 'hover:bg-white/[0.08] hover:shadow-lg hover:shadow-black/30'
            }`}
          >
            {/* Selection Checkbox */}
            {onToggleSelect && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleSelect(file)
                }}
                title={isSelected ? 'Deselect file' : 'Select file'}
                className={`absolute top-2 left-2 z-10 flex h-6 w-6 items-center justify-center rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-blue-500 bg-blue-600 text-white opacity-100 shadow-sm'
                    : hasSelections
                    ? 'border-white/30 bg-black/70 text-transparent opacity-80 hover:opacity-100 hover:border-white/60'
                    : 'border-white/20 bg-black/60 text-transparent opacity-0 group-hover:opacity-100 hover:border-white/50'
                }`}
              >
                <FiCheck className={`h-3.5 w-3.5 ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
              </button>
            )}

            {/* Actions: Download & Delete Buttons */}
            <div className="absolute top-2 right-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {!isFolder && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDownload(file)
                  }}
                  title={`Download ${file.name}`}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-black/75 text-white/70 backdrop-blur-md transition-all hover:bg-blue-600 hover:text-white hover:scale-105 shadow-md cursor-pointer"
                >
                  <FiDownload className="h-3.5 w-3.5" />
                </button>
              )}

              {onDelete && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(file)
                  }}
                  title={`Delete ${file.name}`}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-black/75 text-white/70 backdrop-blur-md transition-all hover:bg-red-600 hover:text-white hover:scale-105 shadow-md cursor-pointer"
                >
                  <FiTrash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Mac Icon Preview */}
            <div className="flex h-20 w-24 items-center justify-center transition-transform group-hover:scale-105">
              <MacFileIcon
                name={file.name}
                mimeType={file.mimeType}
                thumbnailLink={file.thumbnailLink}
                size="md"
              />
            </div>

            {/* File Name (centered, line clamped) */}
            <span className="mt-2.5 line-clamp-2 w-full text-center text-xs font-medium leading-snug text-white/90 group-hover:text-white break-words">
              {file.name}
            </span>

            {/* Metadata Subtitle (e.g. dimensions, size, item count) */}
            <span
              className={`mt-1 text-[11px] font-normal leading-none tracking-tight ${
                subtitle.isHighlight ? 'text-[#4eaef5]' : 'text-white/40'
              }`}
            >
              {subtitle.text}
            </span>
          </motion.div>
        )
      })}
    </motion.div>
  )
}

