import { API_BASE_URL } from '../config/api'
import { getSessionToken } from './auth'

/**
 * Construct an authenticated download URL for a file in UniDrive.
 * Appends the session token and optional accountId as query parameters
 * to ensure downloads work across domains and without requiring Google login.
 */
export function getDownloadUrl(fileId: string, accountId?: string): string {
  if (!fileId) return ''
  const token = getSessionToken()
  const params = new URLSearchParams()
  if (token) params.set('token', token)
  if (accountId) params.set('accountId', accountId)
  const qs = params.toString()
  return `${API_BASE_URL}/api/files/${fileId}/download${qs ? `?${qs}` : ''}`
}

/**
 * Triggers a browser download for a file by creating an anchor element and clicking it.
 * This directly streams the file to disk without loading large blobs into JavaScript memory.
 */
export function triggerDownload(fileId: string, fileName?: string, accountId?: string): void {
  const url = getDownloadUrl(fileId, accountId)
  if (!url) return

  const anchor = document.createElement('a')
  anchor.href = url
  if (fileName) {
    anchor.setAttribute('download', fileName)
  }
  // Open in same tab or hidden download trigger
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
}
