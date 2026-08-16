import { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import logo from '../assets/logo-drive.png'
import {
  FiGrid,
  FiStar,
  FiClock,
  FiSearch,
  FiPlus,
  FiFolder,
  FiFile,
  FiImage,
  FiUser,
  FiLogOut,
  FiMail,
  FiChevronUp,
} from 'react-icons/fi'
import { FaGoogleDrive } from 'react-icons/fa'

/* ─── dummy data matching the reference ─── */
const stats = [
  { label: 'Combined storage', value: '4.2 TB', sub: '68% used', subColor: 'text-green-400' },
  { label: 'Accounts linked', value: '3', sub: 'All Google Drive', subColor: 'text-white/40' },
  { label: 'Files indexed', value: '18,204', sub: 'synced just now', subColor: 'text-green-400' },
]

const accounts = [
  { name: 'dharmik.work', connected: true },
  { name: 'dharmik.dev', connected: true },
  { name: 'groww.digit', connected: true },
]

interface FileItem {
  name: string
  type: 'folder' | 'pdf' | 'image'
  account: string
  size: string
  modified: string
}

const files: FileItem[] = [
  { name: 'Client projects', type: 'folder', account: 'dharmik.work', size: '12.4 GB', modified: '2h ago' },
  { name: 'GrowwDigit assets', type: 'folder', account: 'groww.digit', size: '3.1 GB', modified: '1d ago' },
  { name: 'resume-v2.pdf', type: 'pdf', account: 'dharmik.dev', size: '340 KB', modified: '3d ago' },
  { name: 'render-outputs', type: 'image', account: 'dharmik.work', size: '890 MB', modified: '5d ago' },
]

const fileIcon = (type: FileItem['type']) => {
  switch (type) {
    case 'folder':
      return <FiFolder className="h-4 w-4 text-accent" />
    case 'pdf':
      return <FiFile className="h-4 w-4 text-accent" />
    case 'image':
      return <FiImage className="h-4 w-4 text-accent" />
  }
}

type SidebarTab = 'all' | 'favorites' | 'recent'

function Dashboard() {
  const [activeTab, setActiveTab] = useState<SidebarTab>('all')
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const userId = searchParams.get('userId')
  const [userName, setUserName] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [showProfile, setShowProfile] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!userId) return
    fetch(`http://localhost:5001/api/user/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.name) setUserName(data.name)
        if (data.email) setUserEmail(data.email)
      })
      .catch((err) => console.error('Failed to fetch user:', err))
  }, [userId])

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    navigate('/login')
  }

  const sidebarItems: { key: SidebarTab; label: string; icon: React.ReactNode }[] = [
    { key: 'all', label: 'All files', icon: <FiGrid className="h-4 w-4" /> },
    { key: 'favorites', label: 'Favorites', icon: <FiStar className="h-4 w-4" /> },
    { key: 'recent', label: 'Recent', icon: <FiClock className="h-4 w-4" /> },
  ]

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white overflow-hidden">
      {/* ─── Sidebar ─── */}
      <aside className="flex w-64 flex-col border-r border-white/5 bg-[#0f0f0f]">
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
                onClick={() => setActiveTab(item.key)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === item.key
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
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">
            Accounts
          </p>
          <div className="flex flex-col gap-1">
            {accounts.map((acc) => (
              <div
                key={acc.name}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/60 transition-colors hover:bg-white/5"
              >
                <FaGoogleDrive className="h-4 w-4 text-white/30" />
                <span className="flex-1 truncate">{acc.name}</span>
                {acc.connected && (
                  <span className="h-2 w-2 rounded-full bg-green-400" />
                )}
              </div>
            ))}
          </div>

          <a
            href="http://localhost:5001/auth/google"
            className="mt-2 flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-accent transition-colors hover:bg-white/5"
          >
            <FiPlus className="h-4 w-4" />
            Add account
          </a>
        </div>

        {/* User Profile */}
        <div className="relative mt-auto border-t border-white/5 px-4 py-4" ref={profileRef}>
          {/* Profile Popover */}
          {showProfile && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-full left-4 right-4 mb-2 overflow-hidden rounded-xl border border-white/10 bg-[#1a1a1a] shadow-2xl shadow-black/50"
            >
              {/* Profile Header */}
              <div className="flex items-center gap-3 border-b border-white/5 px-4 py-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent">
                  <FiUser className="h-5 w-5" />
                </div>
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

          {/* Profile Button */}
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-white/5"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent">
              <FiUser className="h-4 w-4" />
            </div>
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
      </aside>

      {/* ─── Main Content ─── */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-8 py-8">
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-2xl font-semibold"
            >
              All files
            </motion.h1>

            {/* Search */}
            <div className="relative w-80">
              <FiSearch className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                placeholder="Search across all drives"
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-11 pr-4 text-sm text-white placeholder:text-white/25 outline-none transition-colors focus:border-accent/50"
              />
            </div>
          </div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="mt-8 grid grid-cols-3 gap-4"
          >
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-white/5 bg-white/[0.03] px-6 py-5 transition-colors hover:border-white/10"
              >
                <p className="text-xs font-medium text-white/40">{s.label}</p>
                <p className="mt-1 text-3xl font-bold tracking-tight">{s.value}</p>
                <p className={`mt-1 text-xs font-medium ${s.subColor}`}>{s.sub}</p>
              </div>
            ))}
          </motion.div>

          {/* Files Table */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.2 }}
            className="mt-10"
          >
            {/* Table Header */}
            <div className="grid grid-cols-[1fr_160px_100px_100px] gap-4 border-b border-white/5 px-4 pb-3 text-xs font-medium uppercase tracking-wider text-white/30">
              <span>name</span>
              <span>account</span>
              <span className="text-right">size</span>
              <span className="text-right">modified</span>
            </div>

            {/* Table Rows */}
            {files.map((file, i) => (
              <motion.div
                key={file.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.25 + i * 0.06 }}
                className="group grid cursor-pointer grid-cols-[1fr_160px_100px_100px] gap-4 rounded-xl px-4 py-4 transition-colors hover:bg-white/[0.04]"
              >
                <div className="flex items-center gap-3">
                  {fileIcon(file.type)}
                  <span className="text-sm font-medium text-white/90 group-hover:text-white">
                    {file.name}
                  </span>
                </div>
                <span className="self-center text-sm text-white/40">{file.account}</span>
                <span className="self-center text-right text-sm text-white/40">{file.size}</span>
                <span className="self-center text-right text-sm text-white/40">{file.modified}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </main>
    </div>
  )
}

export default Dashboard
