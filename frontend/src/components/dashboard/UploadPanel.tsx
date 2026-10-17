import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiUploadCloud,
  FiX,
  FiCheckCircle,
  FiAlertCircle,
  FiChevronDown,
  FiRefreshCw,
} from 'react-icons/fi'
import type { UploadItem } from '../../types/drive'

interface UploadPanelProps {
  uploads: UploadItem[]
  onCancel: (id: string) => void
  onRetry: (id: string) => void
  onDismiss: (id: string) => void
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`
}

export const UploadPanel: React.FC<UploadPanelProps> = ({
  uploads,
  onCancel,
  onRetry,
  onDismiss,
}) => {
  const [collapsed, setCollapsed] = useState(false)

  if (uploads.length === 0) return null

  const activeCount = uploads.filter((u) => u.status === 'uploading' || u.status === 'queued').length
  const errorCount = uploads.filter((u) => u.status === 'error').length
  const successCount = uploads.filter((u) => u.status === 'success').length

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        transition={{ type: 'spring', damping: 25, stiffness: 320 }}
        className="fixed bottom-4 right-4 z-40 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-white/10 bg-[#16161a]/95 shadow-2xl shadow-black/80 backdrop-blur-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
          <div className="flex items-center gap-2">
            <FiUploadCloud
              className={`h-4 w-4 ${
                activeCount > 0
                  ? 'text-accent'
                  : errorCount > 0
                  ? 'text-red-400'
                  : 'text-emerald-400'
              }`}
            />
            <span className="text-xs font-semibold text-white/90">
              {activeCount > 0
                ? `Uploading ${activeCount} file${activeCount > 1 ? 's' : ''}...`
                : errorCount > 0
                ? `${errorCount} upload${errorCount > 1 ? 's' : ''} failed`
                : `${successCount} upload${successCount > 1 ? 's' : ''} complete`}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? 'Expand uploads' : 'Collapse uploads'}
            className="rounded-lg p-1 text-white/40 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
          >
            <FiChevronDown
              className={`h-4 w-4 transition-transform ${collapsed ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        {/* Items */}
        {!collapsed && (
          <div className="max-h-64 space-y-1 overflow-y-auto p-2">
            {uploads.map((u) => (
              <div key={u.id} className="rounded-xl px-2.5 py-2 transition-colors hover:bg-white/[0.03]">
                <div className="flex items-center gap-2">
                  {/* Status icon */}
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center">
                    {u.status === 'success' ? (
                      <FiCheckCircle className="h-4 w-4 text-emerald-400" />
                    ) : u.status === 'error' ? (
                      <FiAlertCircle className="h-4 w-4 text-red-400" />
                    ) : (
                      <FiUploadCloud
                        className={`h-4 w-4 ${
                          u.status === 'uploading' ? 'text-accent' : 'text-white/30'
                        }`}
                      />
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs font-medium text-white/85" title={u.name}>
                        {u.name}
                      </span>
                      <span className="shrink-0 text-[10px] text-white/40">
                        {u.status === 'success'
                          ? 'Done'
                          : u.status === 'error'
                          ? 'Failed'
                          : u.status === 'queued'
                          ? 'Queued'
                          : `${u.progress}%`}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className={`h-full rounded-full transition-all duration-200 ${
                          u.status === 'error'
                            ? 'bg-red-500'
                            : u.status === 'success'
                            ? 'bg-emerald-500'
                            : 'bg-accent'
                        }`}
                        style={{ width: `${u.status === 'error' ? 100 : u.progress}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`truncate text-[10px] ${
                          u.status === 'error' ? 'text-red-300/80' : 'text-white/35'
                        }`}
                        title={
                          u.status === 'success' && u.accountEmail
                            ? `Uploaded to ${u.accountEmail}`
                            : u.status === 'error'
                            ? u.error
                            : undefined
                        }
                      >
                        {u.status === 'success' && u.accountEmail
                          ? `Uploaded to ${u.accountEmail}`
                          : u.status === 'error' && u.error
                          ? u.error
                          : formatBytes(u.size)}
                      </span>

                      <div className="flex shrink-0 items-center gap-0.5">
                        {u.status === 'error' && (
                          <button
                            type="button"
                            onClick={() => onRetry(u.id)}
                            title="Retry upload"
                            className="flex h-6 w-6 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
                          >
                            <FiRefreshCw className="h-3 w-3" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => (u.status === 'uploading' || u.status === 'queued' ? onCancel(u.id) : onDismiss(u.id))}
                          title={
                            u.status === 'uploading' || u.status === 'queued'
                              ? 'Cancel upload'
                              : 'Dismiss'
                          }
                          className="flex h-6 w-6 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
                        >
                          <FiX className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
