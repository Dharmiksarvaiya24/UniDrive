import React, { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiX,
  FiExternalLink,
  FiZoomIn,
  FiZoomOut,
  FiRotateCcw,
  FiCopy,
  FiCheck,
  FiLoader,
  FiAlertCircle,
} from 'react-icons/fi'
import { FaGoogleDrive } from 'react-icons/fa'
import { API_BASE_URL } from '../../config/api'
import { getSessionToken, authFetch } from '../../utils/auth'
import { MacFileIcon } from '../dashboard/MacFileIcon'

export interface FilePreviewModalProps {
  fileId?: string
  fileName?: string
  mimeType?: string
  size?: number
  webViewLink?: string
  accountEmail?: string
  accountId?: string
  isOpen: boolean
  onClose: () => void
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  fileId,
  fileName,
  mimeType = '',
  size,
  webViewLink,
  accountEmail,
  accountId,
  isOpen,
  onClose,
}) => {
  const [zoom, setZoom] = useState(1)
  const [isMediaLoading, setIsMediaLoading] = useState(true)
  const [mediaError, setMediaError] = useState(false)
  const [textContent, setTextContent] = useState<string>('')
  const [isTextLoading, setIsTextLoading] = useState(false)
  const [textError, setTextError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Reset states on file change or close
  useEffect(() => {
    if (!isOpen) {
      setZoom(1)
      setIsMediaLoading(true)
      setMediaError(false)
      setTextContent('')
      setIsTextLoading(false)
      setTextError(null)
      setCopied(false)
    } else {
      setIsMediaLoading(true)
      setMediaError(false)
      setZoom(1)
    }
  }, [isOpen, fileId])

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

  const ext = (fileName || '').split('.').pop()?.toLowerCase() || ''

  // Determine preview type
  const isImage = useMemo(() => {
    return (
      mimeType.startsWith('image/') ||
      ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp', 'ico'].includes(ext)
    )
  }, [mimeType, ext])

  const isVideo = useMemo(() => {
    return (
      mimeType.startsWith('video/') ||
      ['mp4', 'webm', 'mov', 'mkv', 'ogg'].includes(ext)
    )
  }, [mimeType, ext])

  const isAudio = useMemo(() => {
    return (
      mimeType.startsWith('audio/') ||
      ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'].includes(ext)
    )
  }, [mimeType, ext])

  const isPdf = useMemo(() => {
    return mimeType === 'application/pdf' || ext === 'pdf'
  }, [mimeType, ext])

  const isGoogleDoc = useMemo(() => {
    return (
      mimeType === 'application/vnd.google-apps.document' ||
      mimeType === 'application/vnd.google-apps.spreadsheet' ||
      mimeType === 'application/vnd.google-apps.presentation'
    )
  }, [mimeType])

  const isText = useMemo(() => {
    if (isImage || isVideo || isAudio || isPdf || isGoogleDoc) return false
    return (
      mimeType.startsWith('text/') ||
      mimeType.includes('json') ||
      mimeType.includes('javascript') ||
      mimeType.includes('xml') ||
      [
        'txt',
        'md',
        'json',
        'js',
        'jsx',
        'ts',
        'tsx',
        'html',
        'css',
        'csv',
        'xml',
        'yaml',
        'yml',
        'sh',
        'py',
        'sql',
        'log',
      ].includes(ext)
    )
  }, [mimeType, ext, isImage, isVideo, isAudio, isPdf, isGoogleDoc])

  // Build authenticated preview URL through UniDrive backend
  const previewUrl = useMemo(() => {
    if (!fileId) return ''
    const token = getSessionToken()
    const params = new URLSearchParams()
    if (token) params.set('token', token)
    if (accountId) params.set('accountId', accountId)
    const qs = params.toString()
    return `${API_BASE_URL}/api/files/${fileId}/preview${qs ? `?${qs}` : ''}`
  }, [fileId, accountId])

  // Fetch text file contents directly when text preview is active
  useEffect(() => {
    if (isOpen && isText && previewUrl) {
      setIsTextLoading(true)
      setTextError(null)
      authFetch(previewUrl)
        .then(async (res) => {
          if (!res.ok) {
            throw new Error(`Failed to load file (${res.status})`)
          }
          const text = await res.text()
          setTextContent(text)
          setIsTextLoading(false)
        })
        .catch((err) => {
          setTextError(err.message || 'Failed to load text preview')
          setIsTextLoading(false)
        })
    }
  }, [isOpen, isText, previewUrl])

  const handleCopyText = async () => {
    if (!textContent) return
    try {
      await navigator.clipboard.writeText(textContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard write may fail in restricted context
    }
  }

  if (!isOpen || !fileId) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-7">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ type: 'spring', damping: 26, stiffness: 340 }}
          className="relative z-10 flex h-[90vh] w-[95vw] max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#121215] shadow-2xl shadow-black/90"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 bg-[#17171c]/90 px-4 sm:px-6 backdrop-blur-sm">
            {/* File Info */}
            <div className="flex items-center gap-3 overflow-hidden pr-3">
              <div className="hidden sm:flex h-8 w-8 shrink-0 items-center justify-center">
                <MacFileIcon name={fileName || 'file'} mimeType={mimeType} size="sm" />
              </div>

              <div className="flex flex-col overflow-hidden">
                <div className="flex items-center gap-2">
                  <span
                    className="truncate text-sm font-semibold text-white/90"
                    title={fileName}
                  >
                    {fileName || 'File Preview'}
                  </span>
                  {size !== undefined && size > 0 && (
                    <span className="hidden md:inline-block shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/50">
                      {formatBytes(size)}
                    </span>
                  )}
                </div>

                {accountEmail && (
                  <div className="flex items-center gap-1.5 text-xs text-white/40">
                    <FaGoogleDrive className="h-3 w-3 shrink-0 text-white/30" />
                    <span className="truncate">{accountEmail}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Image Zoom Controls */}
              {isImage && (
                <div className="hidden sm:flex items-center gap-1 border-r border-white/10 pr-2 mr-1">
                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.max(0.4, z - 0.25))}
                    title="Zoom out"
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <FiZoomOut className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-[11px] font-mono text-white/50 w-9 text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                    title="Zoom in"
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <FiZoomIn className="h-3.5 w-3.5" />
                  </button>
                  {zoom !== 1 && (
                    <button
                      type="button"
                      onClick={() => setZoom(1)}
                      title="Reset zoom"
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-white/40 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      <FiRotateCcw className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}

              {/* Text Copy Button */}
              {isText && textContent && (
                <button
                  type="button"
                  onClick={handleCopyText}
                  title="Copy file text"
                  className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                >
                  {copied ? (
                    <>
                      <FiCheck className="h-3.5 w-3.5 text-green-400" />
                      <span className="hidden sm:inline text-green-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <FiCopy className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Copy</span>
                    </>
                  )}
                </button>
              )}

              {/* Open in Google Drive Link */}
              {webViewLink && (
                <a
                  href={webViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open in Google Drive"
                  className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-blue-400 hover:border-blue-400/40 hover:bg-blue-400/10 transition-colors"
                >
                  <span className="hidden sm:inline">Open in Drive</span>
                  <FiExternalLink className="h-3.5 w-3.5" />
                </a>
              )}

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close preview"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 transition-colors hover:bg-white/10 hover:text-white ml-1"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Preview Body */}
          <div className="relative flex-1 overflow-hidden bg-[#09090b] flex items-center justify-center">
            {/* 1. Image Preview */}
            {isImage && (
              <div className="relative h-full w-full flex items-center justify-center overflow-auto p-4">
                {isMediaLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#09090b]">
                    <FiLoader className="h-8 w-8 animate-spin text-white/40" />
                  </div>
                )}
                <img
                  src={previewUrl}
                  alt={fileName || 'Image preview'}
                  style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: 'center center',
                  }}
                  onLoad={() => setIsMediaLoading(false)}
                  onError={() => {
                    setIsMediaLoading(false)
                    setMediaError(true)
                  }}
                  className={`max-h-full max-w-full rounded-lg object-contain shadow-2xl transition-transform duration-150 select-none ${
                    isMediaLoading ? 'opacity-0' : 'opacity-100'
                  }`}
                />
              </div>
            )}

            {/* 2. Video Preview */}
            {isVideo && (
              <div className="relative h-full w-full flex items-center justify-center p-4">
                <video
                  src={previewUrl}
                  controls
                  playsInline
                  autoPlay={false}
                  onLoadedData={() => setIsMediaLoading(false)}
                  onError={() => {
                    setIsMediaLoading(false)
                    setMediaError(true)
                  }}
                  className="max-h-full max-w-full rounded-xl shadow-2xl outline-none bg-black"
                />
              </div>
            )}

            {/* 3. Audio Preview */}
            {isAudio && (
              <div className="flex flex-col items-center justify-center p-8 max-w-md w-full text-center">
                <div className="h-28 w-28 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-xl">
                  <MacFileIcon name={fileName || 'audio.mp3'} mimeType={mimeType} size="lg" />
                </div>
                <h3 className="text-base font-semibold text-white/90 mb-1 truncate max-w-xs">
                  {fileName}
                </h3>
                <p className="text-xs text-white/40 mb-6">{accountEmail}</p>
                <audio
                  src={previewUrl}
                  controls
                  className="w-full shadow-lg rounded-full"
                  onError={() => setMediaError(true)}
                />
              </div>
            )}

            {/* 4. PDF and Google Workspace Documents (Docs, Sheets, Slides) */}
            {(isPdf || isGoogleDoc) && (
              <div className="relative h-full w-full bg-[#18181b]">
                {isMediaLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#18181b] z-10">
                    <FiLoader className="h-8 w-8 animate-spin text-blue-400 mb-3" />
                    <span className="text-xs text-white/50 font-medium">Loading document...</span>
                  </div>
                )}
                <iframe
                  src={`${previewUrl}#toolbar=1&navpanes=0`}
                  width="100%"
                  height="100%"
                  title={fileName || 'Document Preview'}
                  className="h-full w-full border-0"
                  onLoad={() => setIsMediaLoading(false)}
                  onError={() => {
                    setIsMediaLoading(false)
                    setMediaError(true)
                  }}
                />
              </div>
            )}

            {/* 5. Text / Code Preview */}
            {isText && (
              <div className="h-full w-full flex flex-col overflow-hidden bg-[#0d0d11]">
                {isTextLoading ? (
                  <div className="flex h-full w-full items-center justify-center">
                    <FiLoader className="h-8 w-8 animate-spin text-white/40" />
                  </div>
                ) : textError ? (
                  <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center">
                    <FiAlertCircle className="h-10 w-10 text-amber-400 mb-3" />
                    <p className="text-sm font-medium text-white/80 mb-4">{textError}</p>
                    {webViewLink && (
                      <a
                        href={webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg bg-white/10 px-4 py-2 text-xs font-medium text-white hover:bg-white/20 transition-colors"
                      >
                        Open in Google Drive
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="h-full w-full overflow-auto p-4 sm:p-6 font-mono text-xs sm:text-sm text-white/80 leading-relaxed selection:bg-blue-500/30">
                    <pre className="whitespace-pre-wrap break-words">{textContent}</pre>
                  </div>
                )}
              </div>
            )}

            {/* 6. Non-previewable / Binary files Fallback Card */}
            {!isImage && !isVideo && !isAudio && !isPdf && !isGoogleDoc && !isText && (
              <div className="flex flex-col items-center justify-center p-8 max-w-md text-center">
                <div className="flex items-center justify-center mb-6">
                  <MacFileIcon name={fileName || 'file'} mimeType={mimeType} size="lg" />
                </div>
                <h3 className="text-base font-semibold text-white/90 mb-1 max-w-sm break-words">
                  {fileName}
                </h3>
                <div className="flex items-center gap-2 text-xs text-white/40 mb-6">
                  {size !== undefined && size > 0 && <span>{formatBytes(size)}</span>}
                  {size !== undefined && size > 0 && <span>•</span>}
                  <span className="truncate max-w-[200px]">{accountEmail}</span>
                </div>

                <p className="text-xs text-white/50 mb-6 max-w-xs">
                  Direct inline preview is not supported for this file type ({ext ? `.${ext}` : 'binary'}).
                </p>

                {webViewLink && (
                  <a
                    href={webViewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-medium text-blue-400 hover:bg-white/10 transition-colors"
                  >
                    <span>Open in Google Drive</span>
                    <FiExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            )}

            {/* Media Error State Overlay */}
            {mediaError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#09090b]/95 p-6 text-center">
                <FiAlertCircle className="h-10 w-10 text-amber-400 mb-3" />
                <h4 className="text-sm font-semibold text-white mb-1">
                  Preview could not be displayed
                </h4>
                <p className="text-xs text-white/40 mb-5 max-w-xs">
                  The file content could not be rendered directly in the browser.
                </p>
                {webViewLink && (
                  <a
                    href={webViewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-blue-400 hover:bg-white/10 transition-colors"
                  >
                    <span>Open in Google Drive</span>
                    <FiExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
