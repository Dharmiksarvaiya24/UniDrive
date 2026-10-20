import { useState, useEffect, useRef, type ChangeEvent, type DragEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiLoader, FiFolder, FiCheckCircle, FiAlertCircle, FiUploadCloud } from 'react-icons/fi'
import { FaGoogleDrive } from 'react-icons/fa'
import { FilePreviewModal } from '../components/common/FilePreviewModal'
import { ManageAccountsModal } from '../components/dashboard/ManageAccountsModal'
import { DashboardSidebar } from '../components/dashboard/DashboardSidebar'
import { DashboardHeader } from '../components/dashboard/DashboardHeader'
import { DashboardStats } from '../components/dashboard/DashboardStats'
import { FileGridView } from '../components/dashboard/FileGridView'
import { FileListView } from '../components/dashboard/FileListView'
import { DeleteConfirmModal } from '../components/dashboard/DeleteConfirmModal'
import { SelectionActionBar } from '../components/dashboard/SelectionActionBar'
import { UploadPanel } from '../components/dashboard/UploadPanel'
import { CreateFolderModal } from '../components/dashboard/CreateFolderModal'
import { API_BASE_URL } from '../config/api'
import { authFetch } from '../utils/auth'
import { useAuth } from '../context/AuthContext'
import { triggerDownload } from '../utils/download'
import { uploadFile } from '../utils/upload'
import type {
  BreadcrumbItem,
  ConnectedAccount,
  DriveFile,
  SidebarTab,
  StorageInfo,
  UploadItem,
  ViewMode,
} from '../types/drive'

// How many uploads run at the same time (rest stay queued)
const MAX_CONCURRENT_UPLOADS = 3

interface UploadOutcome {
  outcome: 'success' | 'error' | 'cancelled'
  accountEmail?: string
}

function Dashboard() {
  const navigate = useNavigate()
  const { user: authUser, userId: authUserId, logout: authLogout } = useAuth()

  // Workspace & Navigation state
  const [activeTab, setActiveTab] = useState<SidebarTab>('all')
  const [selectedAccountEmail, setSelectedAccountEmail] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [folderBreadcrumbs, setFolderBreadcrumbs] = useState<BreadcrumbItem[]>([])

  // User Profile state
  const [userId, setUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userPicture, setUserPicture] = useState<string | null>(null)

  // Drive Data state
  const [rootFiles, setRootFiles] = useState<DriveFile[]>([])
  const [subfolderFiles, setSubfolderFiles] = useState<DriveFile[]>([])
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([])
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null)
  const [filesLoading, setFilesLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)

  // Selection & Deletion state
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set())
  const [deleteConfirmFiles, setDeleteConfirmFiles] = useState<DriveFile[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSharingSelection, setIsSharingSelection] = useState(false)
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // Modal dialog states
  const [selectedFile, setSelectedFile] = useState<DriveFile | null>(null)
  const [manageAccountsOpen, setManageAccountsOpen] = useState(false)

  // Upload & "New" menu state
  const [uploads, setUploads] = useState<UploadItem[]>([])
  const [createFolderOpen, setCreateFolderOpen] = useState(false)
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const [createFolderError, setCreateFolderError] = useState<string | null>(null)
  const [isDraggingFiles, setIsDraggingFiles] = useState(false)

  // Refs: hidden file picker, in-flight XHRs, cancelled ids, drag depth
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadXhrRef = useRef<Map<string, XMLHttpRequest>>(new Map())
  const cancelledUploadsRef = useRef<Set<string>>(new Set())
  const dragDepthRef = useRef(0)

  const currentFolder = folderBreadcrumbs.length > 0 ? folderBreadcrumbs[folderBreadcrumbs.length - 1] : null

  // 1. Sync user profile from shared auth session (validated once in AuthProvider).
  //    No extra /auth/session network call — login-once stays fast.
  useEffect(() => {
    setUserId(authUserId)
    setUserName(authUser?.name ?? null)
    setUserEmail(authUser?.email ?? null)
    setUserPicture(authUser?.picture ?? null)
  }, [authUser, authUserId])

  // 2. Fetch root files when userId is available
  useEffect(() => {
    if (!userId) return
    let isCancelled = false
    authFetch(`${API_BASE_URL}/api/files`)
      .then((res) => res.json())
      .then((data) => {
        if (isCancelled) return
        setRootFiles(data.files || [])
        setConnectedAccounts(data.accounts || [])
        if (data.storage) {
          setStorageInfo(data.storage)
        }
      })
      .catch((err) => {
        if (!isCancelled) console.error('Failed to fetch files:', err)
      })
      .finally(() => {
        if (!isCancelled) setFilesLoading(false)
      })
    return () => {
      isCancelled = true
    }
  }, [userId])

  // 3. Fetch subfolder files when navigating into folders
  useEffect(() => {
    if (!userId || !currentFolder) {
      return
    }
    let isCancelled = false
    authFetch(`${API_BASE_URL}/api/files?folderId=${currentFolder.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (isCancelled) return
        setSubfolderFiles(data.files || [])
      })
      .catch((err) => {
        if (!isCancelled) console.error('Failed to fetch folder contents:', err)
      })
      .finally(() => {
        if (!isCancelled) setFilesLoading(false)
      })
    return () => {
      isCancelled = true
    }
  }, [userId, currentFolder])

  const handleLogout = async () => {
    await authLogout()
    navigate('/', { replace: true })
  }

  const handleAccountRemoved = (accountId: string) => {
    setConnectedAccounts((prev) => prev.filter((a) => a.googleAccountId !== accountId))
    setRootFiles((prev) => prev.filter((f) => f.accountId !== accountId))
    setSubfolderFiles((prev) => prev.filter((f) => f.accountId !== accountId))
    if (userId) {
      authFetch(`${API_BASE_URL}/api/files`)
        .then((res) => res.json())
        .then((data) => {
          setRootFiles(data.files || [])
          setConnectedAccounts(data.accounts || [])
          if (data.storage) setStorageInfo(data.storage)
        })
        .catch((err) => console.error('Error refreshing files after account removal:', err))
    }
  }

  const handleSync = async () => {
    if (!userId || isSyncing) return
    setIsSyncing(true)
    try {
      const rootRes = await authFetch(`${API_BASE_URL}/api/files`)
      const rootData = await rootRes.json()
      setRootFiles(rootData.files || [])
      setConnectedAccounts(rootData.accounts || [])
      if (rootData.storage) {
        setStorageInfo(rootData.storage)
      }

      if (currentFolder) {
        const folderRes = await authFetch(`${API_BASE_URL}/api/files?folderId=${currentFolder.id}`)
        const folderData = await folderRes.json()
        setSubfolderFiles(folderData.files || [])
      }
    } catch (err) {
      console.error('Failed to sync files:', err)
    } finally {
      setIsSyncing(false)
    }
  }

  // Keeps a reference to the latest handleSync so async flows (uploads) always
  // refresh whichever folder the user is viewing when they finish.
  const handleSyncRef = useRef(handleSync)
  useEffect(() => {
    handleSyncRef.current = handleSync
  })

  const handleItemClick = (file: DriveFile) => {
    if (file.mimeType === 'application/vnd.google-apps.folder' || file.mimeType === 'folder') {
      setFilesLoading(true)
      setFolderBreadcrumbs((prev) => [
        ...prev,
        { id: file.id, name: file.name, accountId: file.accountId },
      ])
      setSearchQuery('')
    } else {
      setSelectedFile(file)
    }
  }

  const handleNavigateBreadcrumb = (targetIndex: number) => {
    setFilesLoading(true)
    setFolderBreadcrumbs((prev) => prev.slice(0, targetIndex + 1))
  }

  const handleNavigateHome = () => {
    setFolderBreadcrumbs([])
    setSubfolderFiles([])
  }

  const handleNavigateParent = () => {
    if (folderBreadcrumbs.length <= 1) {
      handleNavigateHome()
    } else {
      setFilesLoading(true)
      setFolderBreadcrumbs((prev) => prev.slice(0, -1))
    }
  }

  // Determine which files to display based on folder navigation
  const displayedFiles = currentFolder ? subfolderFiles : rootFiles

  // Filter files by account, search query, and active tab
  const filteredFiles = displayedFiles
    .filter((file) => {
      if (selectedAccountEmail && file.accountEmail !== selectedAccountEmail) {
        return false
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchesName = file.name.toLowerCase().includes(q)
        const matchesEmail = file.accountEmail.toLowerCase().includes(q)
        return matchesName || matchesEmail
      }

      if (activeTab === 'favorites') {
        return file.starred === true
      }

      return true
    })
    .sort((a, b) => {
      if (activeTab === 'recent') {
        return new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime()
      }
      return 0
    })

  // Auto-dismiss toast messages
  useEffect(() => {
    if (!toastMessage) return
    const timeout = toastMessage.type === 'error' ? 8000 : 4000
    const timer = setTimeout(() => setToastMessage(null), timeout)
    return () => clearTimeout(timer)
  }, [toastMessage])

  // Deselect on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedFileIds.size > 0 && deleteConfirmFiles.length === 0 && !selectedFile) {
        setSelectedFileIds(new Set())
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedFileIds, deleteConfirmFiles, selectedFile])

  const handleToggleSelect = (file: DriveFile) => {
    setSelectedFileIds((prev) => {
      const next = new Set(prev)
      if (next.has(file.id)) {
        next.delete(file.id)
      } else {
        next.add(file.id)
      }
      return next
    })
  }

  const handleSelectAll = () => {
    setSelectedFileIds(new Set(filteredFiles.map((f) => f.id)))
  }

  const handleDeselectAll = () => {
    setSelectedFileIds(new Set())
  }

  const handleRequestDeleteSingle = (file: DriveFile) => {
    setDeleteConfirmFiles([file])
  }

  const handleRequestDeleteSelected = () => {
    const selected = filteredFiles.filter((f) => selectedFileIds.has(f.id))
    if (selected.length > 0) {
      setDeleteConfirmFiles(selected)
    }
  }

  const handleCloseDeleteModal = () => {
    if (!isDeleting) {
      setDeleteConfirmFiles([])
    }
  }

  const handleConfirmDelete = async () => {
    if (deleteConfirmFiles.length === 0 || isDeleting) return
    setIsDeleting(true)
    try {
      if (deleteConfirmFiles.length === 1) {
        const file = deleteConfirmFiles[0]
        const qs = file.accountId ? `?accountId=${encodeURIComponent(file.accountId)}` : ''
        const res = await authFetch(`${API_BASE_URL}/api/files/${file.id}${qs}`, {
          method: 'DELETE',
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to delete file')

        const deletedId = file.id
        setRootFiles((prev) => prev.filter((f) => f.id !== deletedId))
        setSubfolderFiles((prev) => prev.filter((f) => f.id !== deletedId))
        setSelectedFileIds((prev) => {
          const next = new Set(prev)
          next.delete(deletedId)
          return next
        })
        if (selectedFile?.id === deletedId) {
          setSelectedFile(null)
        }
        setToastMessage({ text: `"${file.name}" deleted from Google Drive`, type: 'success' })
      } else {
        const payload = {
          files: deleteConfirmFiles.map((f) => ({
            fileId: f.id,
            accountId: f.accountId,
          })),
        }
        const res = await authFetch(`${API_BASE_URL}/api/files/batch-delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to delete files')

        const deletedIds: string[] = Array.isArray(data.deleted)
          ? (data.deleted as string[])
          : deleteConfirmFiles.map((f) => f.id)
        const deletedSet = new Set<string>(deletedIds)
        setRootFiles((prev) => prev.filter((f) => !deletedSet.has(f.id)))
        setSubfolderFiles((prev) => prev.filter((f) => !deletedSet.has(f.id)))
        setSelectedFileIds((prev) => {
          const next = new Set<string>(prev)
          deletedSet.forEach((id) => next.delete(id))
          return next
        })
        if (selectedFile && deletedSet.has(selectedFile.id)) {
          setSelectedFile(null)
        }
        setToastMessage({
          text: `Deleted ${deletedSet.size} file${deletedSet.size > 1 ? 's' : ''} from Google Drive`,
          type: 'success',
        })
      }
      setDeleteConfirmFiles([])
    } catch (err: any) {
      console.error('Deletion error:', err)
      setToastMessage({ text: err.message || 'Failed to delete file', type: 'error' })
    } finally {
      setIsDeleting(false)
    }
  }

  // ---------- Uploads ----------

  const updateUploadItem = (id: string, patch: Partial<UploadItem>) => {
    setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)))
  }

  const runUpload = async (item: UploadItem): Promise<UploadOutcome> => {
    if (cancelledUploadsRef.current.has(item.id)) {
      cancelledUploadsRef.current.delete(item.id)
      return { outcome: 'cancelled' }
    }

    updateUploadItem(item.id, { status: 'uploading', progress: 0, error: undefined })
    try {
      const result = await uploadFile(item.file, {
        folderId: item.folderId,
        accountId: item.accountId,
        onProgress: (percent) => updateUploadItem(item.id, { progress: percent }),
        onXhr: (xhr) => uploadXhrRef.current.set(item.id, xhr),
      })
      uploadXhrRef.current.delete(item.id)
      updateUploadItem(item.id, {
        status: 'success',
        progress: 100,
        accountEmail: result.accountEmail,
        completedAt: Date.now(),
      })
      return { outcome: 'success', accountEmail: result.accountEmail }
    } catch (err) {
      uploadXhrRef.current.delete(item.id)
      if (err instanceof DOMException && err.name === 'AbortError') {
        cancelledUploadsRef.current.delete(item.id)
        setUploads((prev) => prev.filter((u) => u.id !== item.id))
        return { outcome: 'cancelled' }
      }
      const message = err instanceof Error ? err.message : 'Upload failed'
      updateUploadItem(item.id, { status: 'error', error: message })
      return { outcome: 'error' }
    }
  }

  // Resolves where uploads/folders should go: the folder's own account when
  // inside a folder, the filtered account at root, otherwise auto-routing
  // (backend picks the account with the most free storage).
  const resolveUploadTarget = (): { folderId?: string; accountId?: string } => {
    const folderId = currentFolder?.id
    const accountId =
      currentFolder?.accountId ||
      (selectedAccountEmail
        ? connectedAccounts.find((a) => a.email === selectedAccountEmail)?.googleAccountId
        : undefined)
    return { folderId, accountId }
  }

  const startUploads = (files: File[]) => {
    if (files.length === 0) return
    if (connectedAccounts.length === 0) {
      setToastMessage({ text: 'Connect a Google Drive account before uploading files.', type: 'error' })
      return
    }

    const { folderId, accountId } = resolveUploadTarget()

    const items: UploadItem[] = files.map((file) => ({
      id: `up-${Date.now().toString(36)}-${Math.random().toString(36).slice(3, 9)}`,
      file,
      name: file.name,
      size: file.size,
      folderId,
      accountId,
      progress: 0,
      status: 'queued',
    }))

    setUploads((prev) => [...prev, ...items])

    // Bounded-concurrency upload pool
    let cursor = 0
    const outcomes: UploadOutcome[] = []
    const worker = async () => {
      while (cursor < items.length) {
        const item = items[cursor]
        cursor += 1
        outcomes.push(await runUpload(item))
      }
    }

    void Promise.all(
      Array.from({ length: Math.min(MAX_CONCURRENT_UPLOADS, items.length) }, worker)
    ).then(async () => {
      const successCount = outcomes.filter((o) => o.outcome === 'success').length
      const errorCount = outcomes.filter((o) => o.outcome === 'error').length

      if (successCount > 0) {
        const emails = Array.from(
          new Set(
            outcomes
              .filter((o) => o.outcome === 'success' && o.accountEmail)
              .map((o) => o.accountEmail as string)
          )
        )
        const destination = emails.length === 1 ? ` to ${emails[0]}` : ''
        setToastMessage({
          text: `Uploaded ${successCount} file${successCount > 1 ? 's' : ''}${destination}${
            errorCount > 0 ? ` — ${errorCount} failed` : ''
          }`,
          type: errorCount > 0 ? 'error' : 'success',
        })
      } else if (errorCount > 0) {
        setToastMessage({
          text: `Upload failed for ${errorCount} file${errorCount > 1 ? 's' : ''}. Check the upload panel for details.`,
          type: 'error',
        })
      }

      if (successCount > 0) {
        await handleSyncRef.current()
      }
    })
  }

  const handleCancelUpload = (id: string) => {
    cancelledUploadsRef.current.add(id)
    const xhr = uploadXhrRef.current.get(id)
    if (xhr) {
      xhr.abort()
    } else {
      // Still queued — remove it before a worker picks it up
      setUploads((prev) => prev.filter((u) => u.id !== id))
    }
  }

  const handleRetryUpload = (id: string) => {
    const item = uploads.find((u) => u.id === id)
    if (!item || item.status !== 'error') return
    void runUpload(item).then(async (result) => {
      if (result.outcome === 'success') {
        setToastMessage({
          text: `Uploaded "${item.name}"${result.accountEmail ? ` to ${result.accountEmail}` : ''}`,
          type: 'success',
        })
        await handleSyncRef.current()
      }
    })
  }

  const handleDismissUpload = (id: string) => {
    setUploads((prev) => prev.filter((u) => u.id !== id))
  }

  // Auto-dismiss completed uploads after a few seconds
  const hasCompletedUploads = uploads.some((u) => u.status === 'success')
  useEffect(() => {
    if (!hasCompletedUploads) return
    const interval = setInterval(() => {
      setUploads((prev) => {
        const next = prev.filter(
          (u) => !(u.status === 'success' && u.completedAt && Date.now() - u.completedAt > 4000)
        )
        return next.length === prev.length ? prev : next
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [hasCompletedUploads])

  const handleOpenUploadPicker = () => {
    if (connectedAccounts.length === 0) {
      setToastMessage({ text: 'Connect a Google Drive account before uploading files.', type: 'error' })
      return
    }
    fileInputRef.current?.click()
  }

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    startUploads(files)
  }

  // ---------- New folder ----------

  const handleCreateFolder = async (name: string) => {
    if (isCreatingFolder) return
    setIsCreatingFolder(true)
    setCreateFolderError(null)
    try {
      const { folderId, accountId } = resolveUploadTarget()

      const res = await authFetch(`${API_BASE_URL}/api/files/folder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, parentId: folderId, accountId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create folder')

      const newFolder: DriveFile | undefined = data.file
      if (newFolder) {
        if (folderId) {
          setSubfolderFiles((prev) => [newFolder, ...prev])
        } else {
          setRootFiles((prev) => [newFolder, ...prev])
        }
      }

      setCreateFolderOpen(false)
      setToastMessage({
        text: `Folder "${name}" created${data.accountEmail ? ` in ${data.accountEmail}` : ''}`,
        type: 'success',
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create folder'
      setCreateFolderError(message)
    } finally {
      setIsCreatingFolder(false)
    }
  }

  const createFolderTargetLabel = (() => {
    if (currentFolder) {
      const email = currentFolder.accountId
        ? connectedAccounts.find((a) => a.googleAccountId === currentFolder.accountId)?.email
        : undefined
      return `"${currentFolder.name}"${email ? ` · ${email}` : ''}`
    }
    if (selectedAccountEmail) return `All files · ${selectedAccountEmail}`
    return 'All files · auto (account with most free space)'
  })()

  // ---------- Drag & drop uploads ----------

  const handleDragEnter = (e: DragEvent<HTMLElement>) => {
    if (!e.dataTransfer?.types?.includes('Files')) return
    e.preventDefault()
    dragDepthRef.current += 1
    if (connectedAccounts.length > 0) setIsDraggingFiles(true)
  }

  const handleDragOver = (e: DragEvent<HTMLElement>) => {
    if (!e.dataTransfer?.types?.includes('Files')) return
    e.preventDefault()
  }

  const handleDragLeave = (e: DragEvent<HTMLElement>) => {
    if (!e.dataTransfer?.types?.includes('Files')) return
    e.preventDefault()
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1)
    if (dragDepthRef.current === 0) setIsDraggingFiles(false)
  }

  const handleDropFiles = (e: DragEvent<HTMLElement>) => {
    if (!e.dataTransfer?.types?.includes('Files')) return
    e.preventDefault()
    dragDepthRef.current = 0
    setIsDraggingFiles(false)
    startUploads(Array.from(e.dataTransfer.files || []))
  }

  // Don't let the browser open files dropped outside the main area
  useEffect(() => {
    const preventDefault = (e: Event) => e.preventDefault()
    window.addEventListener('dragover', preventDefault)
    window.addEventListener('drop', preventDefault)
    return () => {
      window.removeEventListener('dragover', preventDefault)
      window.removeEventListener('drop', preventDefault)
    }
  }, [])

  // ---------- Share feedback ----------

  const handleShareFeedback = (feedback: { text: string; type: 'success' | 'error' }) => {
    setToastMessage(feedback)
  }

  // ---------- Batch share / copy for the selection action bar ----------

  const selectedFiles = filteredFiles.filter((f) => selectedFileIds.has(f.id))
  const shareableFiles = selectedFiles.filter(
    (f) => f.mimeType !== 'application/vnd.google-apps.folder' && f.mimeType !== 'folder'
  )

  const copyLinks = async (links: string[]): Promise<boolean> => {
    if (links.length === 0) return false
    try {
      await navigator.clipboard.writeText(links.length === 1 ? links[0] : links.join('\n'))
      return true
    } catch {
      // Clipboard may be unavailable — links are still shared even if copy fails
      return false
    }
  }

  // Makes each selected file viewable by anyone with the link, then copies the link(s)
  const handleShareSelected = async () => {
    if (shareableFiles.length === 0 || isSharingSelection) return
    setIsSharingSelection(true)
    try {
      const results = await Promise.allSettled(
        shareableFiles.map(async (file) => {
          const qs = file.accountId ? `?accountId=${encodeURIComponent(file.accountId)}` : ''
          const res = await authFetch(`${API_BASE_URL}/api/files/${file.id}/share${qs}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: 'reader' }),
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error || 'Failed to share file')
          return { name: file.name, link: (data.webViewLink || file.webViewLink) as string | undefined }
        })
      )

      const ok = results.filter(
        (r): r is PromiseFulfilledResult<{ name: string; link?: string }> => r.status === 'fulfilled'
      )
      const failedCount = results.length - ok.length
      const copied = await copyLinks(ok.map((r) => r.value.link || '').filter(Boolean))

      if (ok.length === 0) {
        setToastMessage({ text: 'Failed to share selected files', type: 'error' })
      } else if (ok.length === 1) {
        setToastMessage({
          text: `"${ok[0].value.name}" is now viewable by anyone with the link${copied ? ' — copied to clipboard' : ''}`,
          type: 'success',
        })
      } else {
        setToastMessage({
          text: `${ok.length} files are now viewable by anyone with the link${copied ? ' — links copied to clipboard' : ''}`,
          type: 'success',
        })
      }
      if (failedCount > 0) {
        setToastMessage({
          text: failedCount === ok.length
            ? 'Failed to share selected files'
            : `Shared ${ok.length} of ${results.length} files — ${failedCount} failed`,
          type: 'error',
        })
      }
    } finally {
      setIsSharingSelection(false)
    }
  }

  // Copies the existing share links of the selected files without changing permissions
  const handleCopySelected = async () => {
    if (shareableFiles.length === 0) return
    const links = shareableFiles.map((f) => f.webViewLink).filter((l): l is string => !!l)
    if (links.length === 0) {
      setToastMessage({ text: 'No link available — use Share to create one first', type: 'error' })
      return
    }
    const copied = await copyLinks(links)
    if (copied) {
      setToastMessage({
        text: links.length === 1 ? 'Link copied to clipboard' : `${links.length} links copied to clipboard`,
        type: 'success',
      })
    } else {
      setToastMessage({ text: 'Could not access the clipboard', type: 'error' })
    }
  }

  const sidebarProps = {
    activeTab,
    onTabChange: (tab: SidebarTab) => {
      setActiveTab(tab)
      setFolderBreadcrumbs([])
      setSubfolderFiles([])
      setSelectedFileIds(new Set())
      setSidebarOpen(false)
    },
    connectedAccounts,
    onOpenManageAccounts: () => setManageAccountsOpen(true),
    storageInfo,
    userName,
    userEmail,
    userPicture,
    userId,
    onLogout: handleLogout,
    isSubfolderActive: folderBreadcrumbs.length > 0,
  }

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white overflow-hidden">
      {/* File Preview Modal */}
      <FilePreviewModal
        fileId={selectedFile?.id}
        fileName={selectedFile?.name}
        mimeType={selectedFile?.mimeType}
        size={selectedFile?.size}
        accountId={selectedFile?.accountId}
        webViewLink={selectedFile?.webViewLink}
        accountEmail={selectedFile?.accountEmail}
        isOpen={!!selectedFile}
        onClose={() => setSelectedFile(null)}
        onDelete={selectedFile ? () => handleRequestDeleteSingle(selectedFile) : undefined}
        onShareFeedback={handleShareFeedback}
      />

      {/* Create Folder Modal */}
      <CreateFolderModal
        isOpen={createFolderOpen}
        isCreating={isCreatingFolder}
        error={createFolderError}
        targetLabel={createFolderTargetLabel}
        onClose={() => {
          if (!isCreatingFolder) {
            setCreateFolderOpen(false)
            setCreateFolderError(null)
          }
        }}
        onCreate={handleCreateFolder}
      />

      {/* Upload Queue Panel */}
      <UploadPanel
        uploads={uploads}
        onCancel={handleCancelUpload}
        onRetry={handleRetryUpload}
        onDismiss={handleDismissUpload}
      />

      {/* Hidden file input used by New → Upload files */}
      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileInputChange} />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteConfirmFiles.length > 0}
        files={deleteConfirmFiles}
        isDeleting={isDeleting}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
      />

      {/* Selection Action Bar */}
      <SelectionActionBar
        selectedCount={selectedFileIds.size}
        totalCount={filteredFiles.length}
        selectedFiles={selectedFiles}
        isSharing={isSharingSelection}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
        onShareSelected={handleShareSelected}
        onCopySelected={handleCopySelected}
        onDeleteSelected={handleRequestDeleteSelected}
      />

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`fixed top-6 right-6 z-50 flex items-center gap-3 rounded-xl border px-4 py-3 text-xs font-medium shadow-2xl backdrop-blur-xl ${
              toastMessage.type === 'success'
                ? 'border-emerald-500/30 bg-[#121c16]/90 text-emerald-300 shadow-emerald-950/40'
                : 'border-red-500/30 bg-[#221214]/90 text-red-300 shadow-red-950/40'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <FiCheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <FiAlertCircle className="h-4 w-4 text-red-400 shrink-0" />
            )}
            <div className="flex flex-col gap-1 max-w-sm">
              <span className="leading-snug">{toastMessage.text}</span>
              {toastMessage.text.toLowerCase().includes('reconnect') && (
                <a
                  href={`${API_BASE_URL}/auth/google?redirectUrl=${encodeURIComponent(window.location.origin)}`}
                  className="mt-1 inline-flex items-center gap-1.5 self-start rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-200 px-2.5 py-1 text-[11px] font-semibold border border-red-500/30 transition-colors"
                >
                  <FaGoogleDrive className="h-3 w-3" />
                  <span>Reconnect Google Drive</span>
                </a>
              )}
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="ml-2 rounded-lg p-1 text-white/40 hover:bg-white/10 hover:text-white transition-colors self-start"
            >
              <FiX className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manage Connected Accounts Modal */}
      <ManageAccountsModal
        isOpen={manageAccountsOpen}
        onClose={() => setManageAccountsOpen(false)}
        accounts={connectedAccounts}
        onAccountRemoved={handleAccountRemoved}
      />

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-white/5 bg-[#0f0f0f]">
        <DashboardSidebar {...sidebarProps} />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/60 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/5 bg-[#0f0f0f] md:hidden"
            >
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close menu"
                className="absolute right-3 top-5 rounded-lg p-2 text-white/40 transition-colors hover:bg-white/5 hover:text-white cursor-pointer"
              >
                <FiX className="h-5 w-5" />
              </button>
              <DashboardSidebar {...sidebarProps} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main
        className="flex-1 overflow-y-auto"
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDropFiles}
      >
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 md:px-8 md:py-8">
          {/* Header Controls */}
          <DashboardHeader
            folderBreadcrumbs={folderBreadcrumbs}
            onNavigateBreadcrumb={handleNavigateBreadcrumb}
            onNavigateHome={handleNavigateHome}
            onNavigateParent={handleNavigateParent}
            activeTab={activeTab}
            selectedAccountEmail={selectedAccountEmail}
            onSelectAccountEmail={(email) => {
              setSelectedAccountEmail(email)
              setSelectedFileIds(new Set())
            }}
            connectedAccounts={connectedAccounts}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            isSyncing={isSyncing}
            filesLoading={filesLoading}
            onSync={handleSync}
            onOpenMobileSidebar={() => setSidebarOpen(true)}
            onUploadFiles={handleOpenUploadPicker}
            onNewFolder={() => {
              setCreateFolderError(null)
              setCreateFolderOpen(true)
            }}
          />

          {/* Stats Cards (on root / All files view) */}
          {folderBreadcrumbs.length === 0 && activeTab === 'all' && (
            <DashboardStats
              filesLoading={filesLoading}
              filesCount={selectedAccountEmail ? filteredFiles.length : rootFiles.length}
              accountsCount={connectedAccounts.length}
              totalBytes={(selectedAccountEmail ? filteredFiles : rootFiles).reduce(
                (sum, f) => sum + (f.size || 0),
                0
              )}
            />
          )}

          {/* Files Representation Section */}
          <div className="mt-8 sm:mt-10">
            {/* Loading state */}
            {filesLoading && (
              <div className="flex items-center justify-center gap-2 py-16 text-white/30">
                <FiLoader className="h-5 w-5 animate-spin" />
                <span className="text-sm">Loading files from Google Drive...</span>
              </div>
            )}

            {/* Empty state: No connected accounts */}
            {!filesLoading && connectedAccounts.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-accent">
                  <FaGoogleDrive className="h-8 w-8" />
                </div>
                <div className="max-w-md space-y-1">
                  <h3 className="text-lg font-semibold text-white">No Google Drive connected yet</h3>
                  <p className="text-sm text-white/40">
                    Connect your Google Drive account to view and manage all your files in UniDrive.
                  </p>
                </div>
                <a
                  href={`${API_BASE_URL}/auth/google?redirectUrl=${encodeURIComponent(window.location.origin)}`}
                  className="mt-2 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent/80 hover:shadow-lg hover:shadow-accent/20"
                >
                  <FaGoogleDrive className="h-4 w-4" />
                  <span>Connect Google Drive</span>
                </a>
              </div>
            )}

            {/* Empty state: Filtered files empty */}
            {!filesLoading && connectedAccounts.length > 0 && filteredFiles.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-white/30">
                <FiFolder className="h-8 w-8" />
                <p className="text-sm">
                  {searchQuery
                    ? 'No files match your search.'
                    : activeTab === 'favorites'
                    ? 'No starred files found.'
                    : activeTab === 'recent'
                    ? 'No recent files found.'
                    : selectedAccountEmail
                    ? `No files found for ${selectedAccountEmail}.`
                    : 'This folder is empty.'}
                </p>
              </div>
            )}

            {/* Grid View */}
            {!filesLoading && viewMode === 'grid' && filteredFiles.length > 0 && (
              <FileGridView
                files={filteredFiles}
                selectedFileIds={selectedFileIds}
                onItemClick={handleItemClick}
                onDownload={(file) => triggerDownload(file.id, file.name, file.accountId)}
                onToggleSelect={handleToggleSelect}
                onDelete={handleRequestDeleteSingle}
              />
            )}

            {/* List / Table View */}
            {!filesLoading && viewMode === 'list' && filteredFiles.length > 0 && (
              <FileListView
                files={filteredFiles}
                selectedFileIds={selectedFileIds}
                onItemClick={handleItemClick}
                onDownload={(file) => triggerDownload(file.id, file.name, file.accountId)}
                onToggleSelect={handleToggleSelect}
                onSelectAll={handleSelectAll}
                onDeselectAll={handleDeselectAll}
                onDelete={handleRequestDeleteSingle}
              />
            )}
          </div>
        </div>

        {/* Drag & drop upload overlay */}
        {isDraggingFiles && (
          <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-accent/60 bg-[#101014]/90 px-10 py-8 shadow-2xl sm:px-14 sm:py-10">
              <FiUploadCloud className="h-10 w-10 text-accent" />
              <p className="text-sm font-semibold text-white">Drop files to upload</p>
              <p className="text-xs text-white/40">
                {currentFolder
                  ? `Uploading to "${currentFolder.name}"`
                  : selectedAccountEmail
                  ? `Uploading to ${selectedAccountEmail}`
                  : 'Files go to the account with the most free space'}
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default Dashboard

