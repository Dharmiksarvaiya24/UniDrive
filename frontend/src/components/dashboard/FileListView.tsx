import React from 'react'
import { motion } from 'framer-motion'
import { FiDownload, FiTrash2, FiCheck, FiMinus } from 'react-icons/fi'
import { MacFileIcon } from './MacFileIcon'
import type { DriveFile } from '../../types/drive'

interface FileListViewProps {
  files: DriveFile[]
  selectedFileIds?: Set<string>
  onItemClick: (file: DriveFile) => void
  onDownload: (file: DriveFile) => void
  onToggleSelect?: (file: DriveFile) => void
  onSelectAll?: () => void
  onDeselectAll?: () => void
  onDelete?: (file: DriveFile) => void
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '—'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

export const FileListView: React.FC<FileListViewProps> = ({
  files,
  selectedFileIds = new Set(),
  onItemClick,
  onDownload,
  onToggleSelect,
  onSelectAll,
  onDeselectAll,
  onDelete,
}) => {
  const isAllSelected = files.length > 0 && files.every((f) => selectedFileIds.has(f.id))
  const isSomeSelected = !isAllSelected && files.some((f) => selectedFileIds.has(f.id))

  const handleHeaderCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isAllSelected) {
      onDeselectAll?.()
    } else {
      onSelectAll?.()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Desktop Table Header */}
      <div className="hidden sm:grid grid-cols-[36px_1fr_180px_100px_100px_72px] items-center gap-4 border-b border-white/5 px-4 pb-3 text-xs font-medium uppercase tracking-wider text-white/30">
        <div className="flex items-center justify-center">
          {onSelectAll && onDeselectAll && (
            <button
              type="button"
              onClick={handleHeaderCheckboxClick}
              title={isAllSelected ? 'Deselect all files' : 'Select all files'}
              className={`flex h-4 w-4 items-center justify-center rounded border transition-colors cursor-pointer ${
                isAllSelected
                  ? 'border-blue-500 bg-blue-600 text-white'
                  : isSomeSelected
                  ? 'border-blue-500/70 bg-blue-600/30 text-white'
                  : 'border-white/20 bg-white/5 hover:border-white/40'
              }`}
            >
              {isAllSelected && <FiCheck className="h-3 w-3" />}
              {isSomeSelected && <FiMinus className="h-3 w-3" />}
            </button>
          )}
        </div>
        <span>name</span>
        <span>account</span>
        <span className="text-right">size</span>
        <span className="text-right">modified</span>
        <span className="text-center">actions</span>
      </div>

      {/* Table Rows */}
      {files.map((file, i) => {
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
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: Math.min(i * 0.02, 0.5) }}
            className={`group block cursor-pointer rounded-xl transition-all focus:outline-none ${
              isSelected
                ? 'bg-blue-600/15 ring-1 ring-blue-500/50'
                : 'hover:bg-white/[0.04] focus:bg-white/[0.06]'
            }`}
          >
            {/* Desktop row */}
            <div className="hidden sm:grid grid-cols-[36px_1fr_180px_100px_100px_72px] items-center gap-4 px-4 py-3">
              {/* Checkbox */}
              <div className="flex items-center justify-center">
                {onToggleSelect && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleSelect(file)
                    }}
                    title={isSelected ? 'Deselect file' : 'Select file'}
                    className={`flex h-4 w-4 items-center justify-center rounded border transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-blue-500 bg-blue-600 text-white'
                        : 'border-white/20 bg-white/5 opacity-0 group-hover:opacity-100 hover:border-white/50'
                    }`}
                  >
                    <FiCheck className={`h-3 w-3 ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                  </button>
                )}
              </div>

              {/* Name & Icon */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center">
                  <MacFileIcon
                    name={file.name}
                    mimeType={file.mimeType}
                    thumbnailLink={file.thumbnailLink}
                    size="sm"
                  />
                </div>
                <span className="truncate text-sm font-medium text-white/90 group-hover:text-white">
                  {file.name}
                </span>
              </div>

              {/* Account */}
              <span className="truncate text-sm text-white/40">{file.accountEmail}</span>

              {/* Size */}
              <span className="text-right text-sm text-white/40">{formatBytes(file.size)}</span>

              {/* Modified Time */}
              <span className="text-right text-sm text-white/40">{timeAgo(file.modifiedTime)}</span>

              {/* Actions */}
              <div className="flex items-center justify-end gap-1">
                {!isFolder && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDownload(file)
                    }}
                    title={`Download ${file.name}`}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-white/40 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                  >
                    <FiDownload className="h-4 w-4" />
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
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-white/40 hover:bg-red-500/20 hover:text-red-400 transition-colors cursor-pointer"
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Mobile row */}
            <div className="flex items-center gap-3 px-3 py-3 sm:hidden">
              {onToggleSelect && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleSelect(file)
                  }}
                  title={isSelected ? 'Deselect file' : 'Select file'}
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors cursor-pointer ${
                    isSelected
                      ? 'border-blue-500 bg-blue-600 text-white'
                      : 'border-white/20 bg-white/5'
                  }`}
                >
                  <FiCheck className={`h-3.5 w-3.5 ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                </button>
              )}

              <div className="flex h-7 w-7 shrink-0 items-center justify-center">
                <MacFileIcon
                  name={file.name}
                  mimeType={file.mimeType}
                  thumbnailLink={file.thumbnailLink}
                  size="sm"
                />
              </div>

              <div className="flex flex-1 flex-col overflow-hidden">
                <span className="truncate text-sm font-medium text-white/90 group-hover:text-white">
                  {file.name}
                </span>
                <span className="truncate text-xs text-white/30">
                  {file.accountEmail} · {formatBytes(file.size)} · {timeAgo(file.modifiedTime)}
                </span>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {!isFolder && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDownload(file)
                    }}
                    title={`Download ${file.name}`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                  >
                    <FiDownload className="h-4 w-4" />
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
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 hover:bg-red-500/20 hover:text-red-400 transition-colors cursor-pointer"
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )
      })}
    </motion.div>
  )
}

