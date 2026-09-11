import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiLoader, FiFolder } from 'react-icons/fi'
import { FaGoogleDrive } from 'react-icons/fa'
import { FilePreviewModal } from '../components/common/FilePreviewModal'
import { ManageAccountsModal } from '../components/dashboard/ManageAccountsModal'
import { DashboardSidebar } from '../components/dashboard/DashboardSidebar'
import { DashboardHeader } from '../components/dashboard/DashboardHeader'
import { DashboardStats } from '../components/dashboard/DashboardStats'
import { FileGridView } from '../components/dashboard/FileGridView'
import { FileListView } from '../components/dashboard/FileListView'
import { API_BASE_URL } from '../config/api'
import { authFetch, clearSessionToken } from '../utils/auth'
import { triggerDownload } from '../utils/download'
import type {
  BreadcrumbItem,
  ConnectedAccount,
  DriveFile,
  SidebarTab,
  StorageInfo,
  ViewMode,
} from '../types/drive'

function Dashboard() {
  const navigate = useNavigate()

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

  // Modal dialog states
  const [selectedFile, setSelectedFile] = useState<DriveFile | null>(null)
  const [manageAccountsOpen, setManageAccountsOpen] = useState(false)

  const currentFolder = folderBreadcrumbs.length > 0 ? folderBreadcrumbs[folderBreadcrumbs.length - 1] : null

  // 1. Fetch user profile from backend
  useEffect(() => {
    let isCancelled = false
    authFetch(`${API_BASE_URL}/auth/session`)
      .then((res) => {
        if (!res.ok) throw new Error('Unauthorized')
        return res.json()
      })
      .then((data) => {
        if (isCancelled) return
        if (data.valid && data.userId) {
          setUserId(data.userId)
          if (data.user?.name) setUserName(data.user.name)
          if (data.user?.email) setUserEmail(data.user.email)
          if (data.user?.picture) setUserPicture(data.user.picture)
        }
      })
      .catch((err) => {
        if (!isCancelled) console.error('Failed to fetch user profile:', err)
      })
    return () => {
      isCancelled = true
    }
  }, [])

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
    try {
      await authFetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
      })
    } catch (err) {
      console.error('Logout request failed:', err)
    }
    clearSessionToken()
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

  const handleItemClick = (file: DriveFile) => {
    if (file.mimeType === 'application/vnd.google-apps.folder' || file.mimeType === 'folder') {
      setFilesLoading(true)
      setFolderBreadcrumbs((prev) => [...prev, { id: file.id, name: file.name }])
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

  const sidebarProps = {
    activeTab,
    onTabChange: (tab: SidebarTab) => {
      setActiveTab(tab)
      setFolderBreadcrumbs([])
      setSubfolderFiles([])
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
      />

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
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 md:px-8 md:py-8">
          {/* Header Controls */}
          <DashboardHeader
            folderBreadcrumbs={folderBreadcrumbs}
            onNavigateBreadcrumb={handleNavigateBreadcrumb}
            onNavigateHome={handleNavigateHome}
            onNavigateParent={handleNavigateParent}
            activeTab={activeTab}
            selectedAccountEmail={selectedAccountEmail}
            onSelectAccountEmail={setSelectedAccountEmail}
            connectedAccounts={connectedAccounts}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            isSyncing={isSyncing}
            filesLoading={filesLoading}
            onSync={handleSync}
            onOpenMobileSidebar={() => setSidebarOpen(true)}
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
                onItemClick={handleItemClick}
                onDownload={(file) => triggerDownload(file.id, file.name, file.accountId)}
              />
            )}

            {/* List / Table View */}
            {!filesLoading && viewMode === 'list' && filteredFiles.length > 0 && (
              <FileListView
                files={filteredFiles}
                onItemClick={handleItemClick}
                onDownload={(file) => triggerDownload(file.id, file.name, file.accountId)}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default Dashboard
