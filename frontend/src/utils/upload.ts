import { API_BASE_URL } from '../config/api'
import { getSessionToken } from './auth'
import type { DriveFile } from '../types/drive'

export interface UploadResult {
  file: DriveFile
  accountEmail: string
}

export interface UploadOptions {
  folderId?: string
  accountId?: string
  onProgress?: (percent: number) => void
  /** Receives the underlying XHR so callers can abort an in-flight upload. */
  onXhr?: (xhr: XMLHttpRequest) => void
}

interface UploadResponse {
  file?: DriveFile
  accountEmail?: string
  error?: string
}

/**
 * Uploads a file to Google Drive through the UniDrive backend.
 *
 * Uses XMLHttpRequest instead of fetch() because fetch has no upload progress
 * events. The backend streams the raw request body straight into Drive, so no
 * multipart parsing or local buffering is needed.
 */
export function uploadFile(file: File, options: UploadOptions = {}): Promise<UploadResult> {
  const { folderId, accountId, onProgress, onXhr } = options

  return new Promise<UploadResult>((resolve, reject) => {
    const params = new URLSearchParams()
    params.set('name', file.name)
    // Always send the raw body as octet-stream so body parsers (express.json)
    // never touch the stream; the real MIME type travels as a query param.
    params.set('mimeType', file.type || 'application/octet-stream')
    if (folderId) params.set('folderId', folderId)
    if (accountId) params.set('accountId', accountId)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${API_BASE_URL}/api/files/upload?${params.toString()}`)
    xhr.withCredentials = true
    xhr.setRequestHeader('Content-Type', 'application/octet-stream')

    const token = getSessionToken()
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)

    onXhr?.(xhr)

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        // Cap at 99% — the server finalizes the Drive upload after the last byte
        onProgress(Math.min(99, Math.round((e.loaded / e.total) * 100)))
      }
    }

    xhr.onload = () => {
      let data: UploadResponse | null = null
      try {
        data = JSON.parse(xhr.responseText) as UploadResponse
      } catch {
        // Response wasn't JSON — treated as a failed upload below
      }

      if (xhr.status >= 200 && xhr.status < 300 && data?.file) {
        onProgress?.(100)
        resolve({ file: data.file, accountEmail: data.accountEmail || '' })
      } else {
        reject(new Error(data?.error || `Upload failed (${xhr.status})`))
      }
    }

    xhr.onerror = () => reject(new Error('Network error during upload'))
    xhr.ontimeout = () => reject(new Error('Upload timed out'))
    xhr.onabort = () => reject(new DOMException('Upload cancelled', 'AbortError'))

    xhr.send(file)
  })
}
