import React from 'react'
import { motion } from 'framer-motion'
import { FiDownload } from 'react-icons/fi'
import { MacFileIcon } from './MacFileIcon'
import type { DriveFile } from '../../types/drive'

interface FileListViewProps {
  files: DriveFile[]
  onItemClick: (file: DriveFile) => void
  onDownload: (file: DriveFile) => void
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
  onItemClick,
  onDownload,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Desktop Table Header */}
      <div className="hidden sm:grid grid-cols-[1fr_180px_100px_100px_48px] gap-4 border-b border-white/5 px-4 pb-3 text-xs font-medium uppercase tracking-wider text-white/30">
        <span>name</span>
        <span>account</span>
        <span className="text-right">size</span>
        <span className="text-right">modified</span>
        <span className="text-center"></span>
      </div>

      {/* Table Rows */}
      {files.map((file, i) => {
        const isFolder = file.mimeType === 'application/vnd.google-apps.folder' || file.mimeType === 'folder'
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
            className="group block cursor-pointer rounded-xl transition-colors hover:bg-white/[0.04] focus:outline-none focus:bg-white/[0.06]"
          >
            {/* Desktop row */}
            <div className="hidden sm:grid grid-cols-[1fr_180px_100px_100px_48px] gap-4 px-4 py-3">
              <div className="flex items-center gap-3">
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
              <span className="self-center truncate text-sm text-white/40">{file.accountEmail}</span>
              <span className="self-center text-right text-sm text-white/40">{formatBytes(file.size)}</span>
              <span className="self-center text-right text-sm text-white/40">{timeAgo(file.modifiedTime)}</span>
              <div className="self-center flex items-center justify-end">
                {!isFolder ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDownload(file)
                    }}
                    title={`Download ${file.name}`}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-white/30 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                  >
                    <FiDownload className="h-4 w-4" />
                  </button>
                ) : (
                  <span className="w-7" />
                )}
              </div>
            </div>

            {/* Mobile row */}
            <div className="flex items-center gap-3 px-3 py-3 sm:hidden">
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
              {!isFolder && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDownload(file)
                  }}
                  title={`Download ${file.name}`}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/40 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                >
                  <FiDownload className="h-4 w-4" />
                </button>
              )}
            </div>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
