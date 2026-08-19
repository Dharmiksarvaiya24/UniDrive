import { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import logo from '../assets/logo-drive.png'
import {
  FiGrid,
  FiList,
  FiStar,
  FiClock,
  FiSearch,
  FiPlus,
  FiFolder,
  FiUser,
  FiLogOut,
  FiMail,
  FiChevronUp,
  FiMenu,
  FiX,
  FiLoader,
  FiChevronRight,
  FiArrowLeft,
  FiFilter,
  FiCheck,
  FiRefreshCw,
} from 'react-icons/fi'
import { FaGoogleDrive } from 'react-icons/fa'
import { MacFileIcon } from '../components/dashboard/MacFileIcon'
import { FilePreviewModal } from '../components/common/FilePreviewModal'
import { ManageAccountsModal } from '../components/dashboard/ManageAccountsModal'
import { API_BASE_URL } from '../config/api'

/* ─── Types ─── */
interface DriveFile {
  id: string
  name: string
  mimeType: string
  size: number
  modifiedTime: string
  iconLink?: string
  thumbnailLink?: string
  webViewLink?: string
  parents?: string[]
  dimensions?: string | null
  starred?: boolean
  accountEmail: string
  accountId: string
}

interface ConnectedAccount {
  googleAccountId: string
  email: string
  name: string
  storage?: {
    limit: number
    usage: number
  } | null
}

interface StorageInfo {
  totalLimit: number
  totalUsage: number
}

/* ─── Helpers ─── */
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

type SidebarTab = 'all' | 'favorites' | 'recent'

function Dashboard() {
  const [activeTab, setActiveTab] = useState<SidebarTab>('all')
  const [selectedAccountEmail, setSelectedAccountEmail] = useState<string | null>(null)
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [userId, setUserId] = useState<string | null>(() => {
    return new URLSearchParams(window.location.search).get('userId') || localStorage.getItem('unidrive_userId')
  })
  const [userName, setUserName] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userPicture, setUserPicture] = useState<string | null>(null)
  const [showProfile, setShowProfile] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<DriveFile | null>(null)
  const [manageAccountsOpen, setManageAccountsOpen] = useState(false)
  const [folderBreadcrumbs, setFolderBreadcrumbs] = useState<Array<{ id: string; name: string }>>([])
  const profileRef = useRef<HTMLDivElement>(null)
  const filterRef = useRef<HTMLDivElement>(null)

  // Real data state
  const [rootFiles, setRootFiles] = useState<DriveFile[]>([])
  const [subfolderFiles, setSubfolderFiles] = useState<DriveFile[]>([])
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([])
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null)
  const [filesLoading, setFilesLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const currentFolder = folderBreadcrumbs.length > 0 ? folderBreadcrumbs[folderBreadcrumbs.length - 1] : null

  // Persist userId from URL to localStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlUserId = params.get('userId')
    if (urlUserId) {
      localStorage.setItem('unidrive_userId', urlUserId)
      setUserId(urlUserId)
    } else {
      const stored = localStorage.getItem('unidrive_userId')
      if (stored) setUserId(stored)
    }
  }, [searchParams])

  // Fetch user profile
  useEffect(() => {
    if (!userId) return
    fetch(`${API_BASE_URL}/api/user/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.name) setUserName(data.name)
        if (data.email) setUserEmail(data.email)
        if (data.picture) setUserPicture(data.picture)
      })
      .catch((err) => console.error('Failed to fetch user:', err))
  }, [userId])

  // Fetch root files from backend
  useEffect(() => {
    if (!userId) return
    setFilesLoading(true)
    fetch(`${API_BASE_URL}/api/files?userId=${userId}`)
      .then((res) => res.json())
      .then((data) => {
        setRootFiles(data.files || [])
        setConnectedAccounts(data.accounts || [])
        if (data.storage) {
          setStorageInfo(data.storage)
        }
      })
      .catch((err) => console.error('Failed to fetch files:', err))
      .finally(() => setFilesLoading(false))
  }, [userId])

  // Fetch subfolder files if drilling down into a folder
  useEffect(() => {
    if (!userId) return
    if (!currentFolder) {
      setSubfolderFiles([])
      return
    }
    setFilesLoading(true)
    fetch(`${API_BASE_URL}/api/files?userId=${userId}&folderId=${currentFolder.id}`)
      .then((res) => res.json())
      .then((data) => {
        setSubfolderFiles(data.files || [])
      })
      .catch((err) => console.error('Failed to fetch folder contents:', err))
      .finally(() => setFilesLoading(false))
  }, [userId, currentFolder?.id])

  // Close popovers when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false)
      }
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('unidrive_userId')
    navigate('/login')
  }

  // Handle removing a connected account
  const handleAccountRemoved = (accountId: string) => {
    setConnectedAccounts((prev) => prev.filter((a) => a.googleAccountId !== accountId))
    setRootFiles((prev) => prev.filter((f) => f.accountId !== accountId))
    setSubfolderFiles((prev) => prev.filter((f) => f.accountId !== accountId))
    // Re-fetch files and update storage totals
    if (userId) {
      fetch(`${API_BASE_URL}/api/files?userId=${userId}`)
        .then((res) => res.json())
        .then((data) => {
          setRootFiles(data.files || [])
          setConnectedAccounts(data.accounts || [])
          if (data.storage) setStorageInfo(data.storage)
        })
        .catch((err) => console.error('Error refreshing files after account removal:', err))
    }
  }

  // Sync & Refresh all files from Google Drive
  const handleSync = async () => {
    if (!userId || isSyncing) return
    setIsSyncing(true)
    try {
      // 1. Refresh root files, accounts, and storage
      const rootRes = await fetch(`${API_BASE_URL}/api/files?userId=${userId}`)
      const rootData = await rootRes.json()
      setRootFiles(rootData.files || [])
      setConnectedAccounts(rootData.accounts || [])
      if (rootData.storage) {
        setStorageInfo(rootData.storage)
      }

      // 2. If inside a subfolder, refresh subfolder contents as well
      if (currentFolder) {
        const folderRes = await fetch(`${API_BASE_URL}/api/files?userId=${userId}&folderId=${currentFolder.id}`)
        const folderData = await folderRes.json()
        setSubfolderFiles(folderData.files || [])
      }
    } catch (err) {
      console.error('Failed to sync files:', err)
    } finally {
      setIsSyncing(false)
    }
  }

  // Handle clicking file vs folder
  const handleItemClick = (file: DriveFile) => {
    if (file.mimeType === 'application/vnd.google-apps.folder' || file.mimeType === 'folder') {
      setFolderBreadcrumbs((prev) => [...prev, { id: file.id, name: file.name }])
      setSearchQuery('')
    } else {
      setSelectedFile(file)
    }
  }

  // Determine which files to display based on folder navigation and tabs
  const displayedFiles = currentFolder ? subfolderFiles : rootFiles

  // Filter files by account, search query, and active tab
  const filteredFiles = displayedFiles
    .filter((file) => {
      // Account filter
      if (selectedAccountEmail && file.accountEmail !== selectedAccountEmail) {
        return false
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchesName = file.name.toLowerCase().includes(q)
        const matchesEmail = file.accountEmail.toLowerCase().includes(q)
        return matchesName || matchesEmail
      }

      // Active tab filter
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

  const sidebarItems: { key: SidebarTab; label: string; icon: React.ReactNode }[] = [
    { key: 'all', label: 'All files', icon: <FiGrid className="h-4 w-4" /> },
    { key: 'favorites', label: 'Favorites', icon: <FiStar className="h-4 w-4" /> },
    { key: 'recent', label: 'Recent', icon: <FiClock className="h-4 w-4" /> },
  ]

  /* ─── Sidebar Content (shared between desktop & mobile) ─── */
  const sidebarContent = (
    <>
      {/* Logo */}
      <Link to="/" className="flex items-center gap-3 px-6 py-6">
        <img src={logo} alt="UniDrive" className="h-8 w-8 object-contain" />
        <span className="text-lg font-bold tracking-widest">UniDrive</span>
      </Link>

      {/* Workspace Nav */}
      <div className="px-4">
        <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">
          Workspace
        </p>
        <nav className="flex flex-col gap-0.5">
          {sidebarItems.map((item) => (
            <button
              key={item.key}
              onClick={() => {
                setActiveTab(item.key)
                setFolderBreadcrumbs([])
                setSidebarOpen(false)
              }}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                activeTab === item.key && folderBreadcrumbs.length === 0
                  ? 'bg-white/10 text-white'
                  : 'text-white/40 hover:bg-white/5 hover:text-white/70'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Accounts */}
      <div className="mt-8 px-4">
        <div className="flex items-center justify-between mb-2 px-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">
            Accounts
          </p>
          <button
            type="button"
            onClick={() => setManageAccountsOpen(true)}
            className="text-xs text-white/40 hover:text-white transition-colors"
          >
            Manage
          </button>
        </div>

        {connectedAccounts.length > 0 && (
          <button
            type="button"
            onClick={() => setSelectedAccountEmail(null)}
            className={`mb-1 flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
              selectedAccountEmail === null
                ? 'bg-white/10 text-white'
                : 'text-white/40 hover:bg-white/5 hover:text-white/70'
            }`}
          >
            <span>All accounts combined</span>
            <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] text-white/60">
              {connectedAccounts.length}
            </span>
          </button>
        )}

        <div className="flex flex-col gap-1">
          {connectedAccounts.length > 0 ? (
            connectedAccounts.map((acc) => (
              <button
                type="button"
                key={acc.googleAccountId}
                onClick={() =>
                  setSelectedAccountEmail((prev) => (prev === acc.email ? null : acc.email))
                }
                className={`group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  selectedAccountEmail === acc.email
                    ? 'bg-accent/15 text-white ring-1 ring-accent/30'
                    : 'text-white/60 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden text-left">
                  <FaGoogleDrive className={`h-4 w-4 shrink-0 ${selectedAccountEmail === acc.email ? 'text-accent' : 'text-white/30'}`} />
                  <span className="truncate">{acc.email}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="h-2 w-2 rounded-full bg-green-400" />
                </div>
              </button>
            ))
          ) : (
            <p className="px-3 py-2 text-xs text-white/20">No accounts linked</p>
          )}
        </div>

        <button
          type="button"
          onClick={() => setManageAccountsOpen(true)}
          className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-accent transition-colors hover:bg-white/5"
        >
          <FiPlus className="h-4 w-4" />
          Add / Manage accounts
        </button>
      </div>

      {/* Bottom Section: Combined Storage & User Profile */}
      <div className="mt-auto flex flex-col">
        {/* Storage Overview */}
        <div className="px-4 pb-3">
          <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">Storage</span>
              <span className="text-xs font-semibold text-white/80">
                {storageInfo && storageInfo.totalLimit > 0
                  ? `${formatBytes(storageInfo.totalUsage)} / ${formatBytes(storageInfo.totalLimit)}`
                  : '—'}
              </span>
            </div>

            {/* Progress bar */}
            <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent to-[#4eaef5] transition-all duration-500"
                style={{
                  width: `${
                    storageInfo && storageInfo.totalLimit > 0
                      ? Math.min(Math.max(Math.round((storageInfo.totalUsage / storageInfo.totalLimit) * 100), 2), 100)
                      : 0
                  }%`,
                }}
              />
            </div>

            <div className="mt-2 flex items-center justify-between text-[11px] text-white/40">
              <span>
                {storageInfo && storageInfo.totalLimit > 0
                  ? `${((storageInfo.totalUsage / storageInfo.totalLimit) * 100).toFixed(1)}% used`
                  : 'Combined storage'}
              </span>
              <span>{connectedAccounts.length} {connectedAccounts.length === 1 ? 'account' : 'accounts'}</span>
            </div>
          </div>
        </div>

        {/* User Profile */}
        <div className="relative border-t border-white/5 px-4 py-4" ref={profileRef}>
        {/* Profile Popover */}
        <AnimatePresence>
          {showProfile && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-full left-4 right-4 mb-2 overflow-hidden rounded-xl border border-white/10 bg-[#1a1a1a] shadow-2xl shadow-black/50 z-50"
            >
              {/* Profile Header */}
              <div className="flex items-center gap-3 border-b border-white/5 px-4 py-4">
                {userPicture ? (
                  <img src={userPicture} alt={userName || 'User'} className="h-10 w-10 shrink-0 rounded-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent">
                    <FiUser className="h-5 w-5" />
                  </div>
                )}
                <div className="flex flex-col overflow-hidden">
                  <span className="truncate text-sm font-semibold text-white">
                    {userName || 'User'}
                  </span>
                  {userEmail && (
                    <span className="truncate text-xs text-white/40">{userEmail}</span>
                  )}
                </div>
              </div>

              {/* Details */}
              <div className="px-2 py-2">
                {userEmail && (
                  <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/50">
                    <FiMail className="h-4 w-4 shrink-0 text-white/30" />
                    <span className="truncate">{userEmail}</span>
                  </div>
                )}
                {userId && (
                  <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/30">
                    <FiUser className="h-4 w-4 shrink-0 text-white/20" />
                    <span className="truncate text-xs" title={userId}>ID: {userId}</span>
                  </div>
                )}
              </div>

              {/* Logout */}
              <div className="border-t border-white/5 px-2 py-2">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-400 transition-colors hover:bg-red-500/10"
                >
                  <FiLogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Profile Button */}
        <button
          onClick={() => setShowProfile(!showProfile)}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-white/5"
        >
          {userPicture ? (
            <img src={userPicture} alt={userName || 'User'} className="h-8 w-8 shrink-0 rounded-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent">
              <FiUser className="h-4 w-4" />
            </div>
          )}
          <div className="flex flex-1 flex-col overflow-hidden text-left">
            <span className="truncate text-sm font-medium text-white/80">
              {userName || (userId ? 'Loading...' : 'Not signed in')}
            </span>
            {userId && (
              <span className="truncate text-[11px] text-white/30">
                {userEmail || 'Logged in'}
              </span>
            )}
          </div>
          <FiChevronUp className={`h-4 w-4 text-white/30 transition-transform ${showProfile ? 'rotate-180' : ''}`} />
        </button>
      </div>
    </div>
    </>
  )

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white overflow-hidden">
      {/* File Preview Modal */}
      <FilePreviewModal
        fileId={selectedFile?.id}
        fileName={selectedFile?.name}
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
        userId={userId}
        onAccountRemoved={handleAccountRemoved}
      />

      {/* ─── Desktop Sidebar ─── */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-white/5 bg-[#0f0f0f]">
        {sidebarContent}
      </aside>

      {/* ─── Mobile Sidebar Overlay ─── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/60 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            {/* Drawer */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/5 bg-[#0f0f0f] md:hidden"
            >
              {/* Close button */}
              <button
                onClick={() => setSidebarOpen(false)}
                className="absolute right-3 top-5 rounded-lg p-2 text-white/40 transition-colors hover:bg-white/5 hover:text-white"
              >
                <FiX className="h-5 w-5" />
              </button>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ─── Main Content ─── */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 md:px-8 md:py-8">
          {/* Header Row */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="rounded-lg p-2 text-white/60 transition-colors hover:bg-white/5 hover:text-white md:hidden"
              >
                <FiMenu className="h-5 w-5" />
              </button>

              {/* Breadcrumbs Navigation */}
              {folderBreadcrumbs.length > 0 ? (
                <div className="flex items-center gap-2 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setFolderBreadcrumbs((prev) => prev.slice(0, -1))}
                    title="Back to parent folder"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <FiArrowLeft className="h-4 w-4" />
                  </button>
                  <div className="flex items-center gap-1.5 overflow-hidden text-sm sm:text-base">
                    <button
                      type="button"
                      onClick={() => setFolderBreadcrumbs([])}
                      className="truncate text-white/40 transition-colors hover:text-white"
                    >
                      All files
                    </button>
                    {folderBreadcrumbs.map((crumb, idx) => {
                      const isLast = idx === folderBreadcrumbs.length - 1
                      return (
                        <div key={crumb.id} className="flex items-center gap-1.5 overflow-hidden">
                          <FiChevronRight className="h-3.5 w-3.5 shrink-0 text-white/20" />
                          {isLast ? (
                            <span className="truncate font-semibold text-white">
                              {crumb.name}
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setFolderBreadcrumbs((prev) => prev.slice(0, idx + 1))}
                              className="truncate text-white/40 transition-colors hover:text-white"
                            >
                              {crumb.name}
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <motion.div
                  key={activeTab + (selectedAccountEmail || '')}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="flex items-center gap-2"
                >
                  <h1 className="text-xl font-semibold sm:text-2xl">
                    {activeTab === 'favorites' ? 'Favorites' : activeTab === 'recent' ? 'Recent' : 'All files'}
                  </h1>
                  {selectedAccountEmail && (
                    <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-white/60">
                      {selectedAccountEmail}
                    </span>
                  )}
                </motion.div>
              )}
            </div>

            {/* Controls: Search + View Switcher */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 sm:w-80">
                <FiSearch className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search across all drives"
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-11 pr-4 text-sm text-white placeholder:text-white/25 outline-none transition-colors focus:border-accent/50"
                />
              </div>

              {/* View Switcher Toggle */}
              <div className="flex items-center rounded-xl border border-white/10 bg-white/5 p-1">
                <button
                  type="button"
                  title="Mac Finder Grid View"
                  onClick={() => setViewMode('grid')}
                  className={`rounded-lg p-1.5 transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white/15 text-white shadow-sm'
                      : 'text-white/40 hover:text-white/80'
                  }`}
                >
                  <FiGrid className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  title="List View"
                  onClick={() => setViewMode('list')}
                  className={`rounded-lg p-1.5 transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white/15 text-white shadow-sm'
                      : 'text-white/40 hover:text-white/80'
                  }`}
                >
                  <FiList className="h-4 w-4" />
                </button>
              </div>

              {/* Filter by Account Dropdown */}
              <div className="relative" ref={filterRef}>
                <button
                  type="button"
                  onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                  title="Filter files by account"
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-all ${
                    selectedAccountEmail
                      ? 'border-accent/40 bg-accent/15 text-accent shadow-sm shadow-accent/10 ring-1 ring-accent/20'
                      : filterDropdownOpen
                      ? 'border-white/20 bg-white/10 text-white'
                      : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <FiFilter className={`h-3.5 w-3.5 ${selectedAccountEmail ? 'text-accent' : 'text-white/50'}`} />
                  <span className="hidden sm:inline">
                    {selectedAccountEmail ? selectedAccountEmail.split('@')[0] : 'All Accounts'}
                  </span>
                  {selectedAccountEmail && (
                    <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse sm:hidden" />
                  )}
                </button>

                <AnimatePresence>
                  {filterDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-64 origin-top-right overflow-hidden rounded-xl border border-white/10 bg-[#161616] p-1.5 shadow-2xl shadow-black/80 z-50 backdrop-blur-xl"
                    >
                      <div className="px-2.5 py-2 border-b border-white/5 mb-1 flex items-center justify-between">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                          Filter by Account
                        </span>
                        <span className="text-[10px] text-white/30">
                          {connectedAccounts.length} {connectedAccounts.length === 1 ? 'drive' : 'drives'}
                        </span>
                      </div>

                      {/* All Accounts Option */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAccountEmail(null)
                          setFilterDropdownOpen(false)
                        }}
                        className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs transition-colors ${
                          selectedAccountEmail === null
                            ? 'bg-white/10 font-semibold text-white'
                            : 'text-white/60 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <FiGrid className="h-3.5 w-3.5 text-white/40" />
                          <span>All accounts (Combined)</span>
                        </div>
                        {selectedAccountEmail === null && (
                          <FiCheck className="h-3.5 w-3.5 text-accent" />
                        )}
                      </button>

                      {/* Individual Accounts */}
                      <div className="mt-1 flex flex-col gap-0.5 max-h-56 overflow-y-auto">
                        {connectedAccounts.length > 0 ? (
                          connectedAccounts.map((acc) => {
                            const isSelected = selectedAccountEmail === acc.email
                            return (
                              <button
                                key={acc.googleAccountId}
                                type="button"
                                onClick={() => {
                                  setSelectedAccountEmail(isSelected ? null : acc.email)
                                  setFilterDropdownOpen(false)
                                }}
                                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs transition-colors ${
                                  isSelected
                                    ? 'bg-accent/15 font-medium text-white ring-1 ring-accent/30'
                                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                                }`}
                              >
                                <div className="flex items-center gap-2 overflow-hidden text-left">
                                  <FaGoogleDrive className={`h-3.5 w-3.5 shrink-0 ${isSelected ? 'text-accent' : 'text-white/40'}`} />
                                  <span className="truncate">{acc.email}</span>
                                </div>
                                {isSelected && (
                                  <FiCheck className="h-3.5 w-3.5 shrink-0 text-accent ml-2" />
                                )}
                              </button>
                            )
                          })
                        ) : (
                          <div className="px-2.5 py-2 text-[11px] text-white/30">
                            No accounts connected
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Sync Button */}
              <button
                type="button"
                onClick={handleSync}
                disabled={isSyncing || filesLoading}
                title="Sync and refresh latest files from Google Drive"
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-all ${
                  isSyncing
                    ? 'border-accent/40 bg-accent/15 text-accent shadow-sm'
                    : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-50'
                }`}
              >
                <FiRefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin text-accent' : 'text-white/60'}`} />
                <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync'}</span>
              </button>
            </div>
          </div>

          {/* Stats Cards (only shown on root / All files view) */}
          {folderBreadcrumbs.length === 0 && activeTab === 'all' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.1 }}
              className="mt-6 grid grid-cols-1 gap-3 sm:mt-8 sm:grid-cols-3 sm:gap-4"
            >
              <div className="rounded-2xl border border-white/5 bg-white/[0.03] px-5 py-4 transition-colors hover:border-white/10 sm:px-6 sm:py-5">
                <p className="text-xs font-medium text-white/40">Total files</p>
                <p className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                  {filesLoading ? '...' : (selectedAccountEmail ? filteredFiles.length : rootFiles.length).toLocaleString()}
                </p>
                <p className="mt-1 text-xs font-medium text-green-400">
                  {filesLoading ? 'loading' : 'synced just now'}
                </p>
              </div>
              <div className="rounded-2xl border border-white/5 bg-white/[0.03] px-5 py-4 transition-colors hover:border-white/10 sm:px-6 sm:py-5">
                <p className="text-xs font-medium text-white/40">Accounts linked</p>
                <p className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                  {connectedAccounts.length}
                </p>
                <p className="mt-1 text-xs font-medium text-white/40">All Google Drive</p>
              </div>
              <div className="rounded-2xl border border-white/5 bg-white/[0.03] px-5 py-4 transition-colors hover:border-white/10 sm:px-6 sm:py-5">
                <p className="text-xs font-medium text-white/40">Combined size</p>
                <p className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                  {filesLoading ? '...' : formatBytes((selectedAccountEmail ? filteredFiles : rootFiles).reduce((sum, f) => sum + (f.size || 0), 0))}
                </p>
                <p className="mt-1 text-xs font-medium text-green-400">across all accounts</p>
              </div>
            </motion.div>
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

            {/* Empty state */}
            {!filesLoading && filteredFiles.length === 0 && (
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

            {/* 1. macOS Finder Style Grid View */}
            {!filesLoading && viewMode === 'grid' && filteredFiles.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-2 gap-y-8 gap-x-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7"
              >
                {filteredFiles.map((file, i) => {
                  const subtitle = getFileSubtitle(file)
                  return (
                    <motion.div
                      key={file.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleItemClick(file)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleItemClick(file)
                        }
                      }}
                      title={`${file.name} (${file.accountEmail})`}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.25, delay: Math.min(i * 0.02, 0.6) }}
                      className="group flex cursor-pointer flex-col items-center rounded-xl p-2.5 transition-all hover:bg-white/[0.08] hover:shadow-lg hover:shadow-black/30 focus:outline-none focus:ring-1 focus:ring-accent"
                    >
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
            )}

            {/* 2. List / Table View */}
            {!filesLoading && viewMode === 'list' && filteredFiles.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {/* Desktop Table Header */}
                <div className="hidden sm:grid grid-cols-[1fr_180px_100px_100px] gap-4 border-b border-white/5 px-4 pb-3 text-xs font-medium uppercase tracking-wider text-white/30">
                  <span>name</span>
                  <span>account</span>
                  <span className="text-right">size</span>
                  <span className="text-right">modified</span>
                </div>

                {/* Table Rows */}
                {filteredFiles.map((file, i) => (
                  <motion.div
                    key={file.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleItemClick(file)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleItemClick(file)
                      }
                    }}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: Math.min(i * 0.02, 0.5) }}
                    className="group block cursor-pointer rounded-xl transition-colors hover:bg-white/[0.04] focus:outline-none focus:bg-white/[0.06]"
                  >
                    {/* Desktop row */}
                    <div className="hidden sm:grid grid-cols-[1fr_180px_100px_100px] gap-4 px-4 py-3">
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
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default Dashboard
