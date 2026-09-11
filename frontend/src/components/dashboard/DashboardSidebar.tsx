import React, { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiGrid,
  FiStar,
  FiClock,
  FiPlus,
  FiUser,
  FiLogOut,
  FiMail,
  FiChevronUp,
} from 'react-icons/fi'
import { FaGoogleDrive } from 'react-icons/fa'
import logo from '../../assets/logo-drive.png'
import type { ConnectedAccount, SidebarTab, StorageInfo } from '../../types/drive'

interface DashboardSidebarProps {
  activeTab: SidebarTab
  onTabChange: (tab: SidebarTab) => void
  connectedAccounts: ConnectedAccount[]
  onOpenManageAccounts: () => void
  storageInfo: StorageInfo | null
  userName: string | null
  userEmail: string | null
  userPicture: string | null
  userId: string | null
  onLogout: () => void
  isSubfolderActive: boolean
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '—'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  activeTab,
  onTabChange,
  connectedAccounts,
  onOpenManageAccounts,
  storageInfo,
  userName,
  userEmail,
  userPicture,
  userId,
  onLogout,
  isSubfolderActive,
}) => {
  const [showProfile, setShowProfile] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const sidebarItems: { key: SidebarTab; label: string; icon: React.ReactNode }[] = [
    { key: 'all', label: 'All files', icon: <FiGrid className="h-4 w-4" /> },
    { key: 'favorites', label: 'Favorites', icon: <FiStar className="h-4 w-4" /> },
    { key: 'recent', label: 'Recent', icon: <FiClock className="h-4 w-4" /> },
  ]

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-3 px-6 py-6">
        <img src={logo} alt="UniDrive" className="h-8 w-8 object-contain" />
        <span className="text-lg font-bold tracking-widest text-white">UniDrive</span>
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
              type="button"
              onClick={() => onTabChange(item.key)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                activeTab === item.key && !isSubfolderActive
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
            onClick={onOpenManageAccounts}
            className="text-xs text-white/40 hover:text-white transition-colors cursor-pointer"
          >
            Manage
          </button>
        </div>

        <div className="flex flex-col gap-1">
          {connectedAccounts.length > 0 ? (
            connectedAccounts.map((acc) => (
              <div
                key={acc.googleAccountId}
                className="group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm text-white/60"
              >
                <div className="flex items-center gap-3 overflow-hidden text-left">
                  <FaGoogleDrive className="h-4 w-4 shrink-0 text-white/30" />
                  <span className="truncate">{acc.email}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="h-2 w-2 rounded-full bg-green-400" />
                </div>
              </div>
            ))
          ) : (
            <p className="px-3 py-2 text-xs text-white/20">No accounts linked</p>
          )}
        </div>

        <button
          type="button"
          onClick={onOpenManageAccounts}
          className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-accent transition-colors hover:bg-white/5 cursor-pointer"
        >
          <FiPlus className="h-4 w-4" />
          Add / Manage accounts
        </button>
      </div>

      {/* Bottom Section: Storage & User Profile */}
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
                  {(userName || userEmail) && (
                    <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/50">
                      <FiUser className="h-4 w-4 shrink-0 text-white/30" />
                      <span className="truncate text-xs" title={userName || userEmail?.split('@')[0]}>
                        Username: {userName || userEmail?.split('@')[0]}
                      </span>
                    </div>
                  )}
                </div>

                {/* Logout */}
                <div className="border-t border-white/5 px-2 py-2">
                  <button
                    type="button"
                    onClick={onLogout}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-400 transition-colors hover:bg-red-500/10 cursor-pointer"
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
            type="button"
            onClick={() => setShowProfile(!showProfile)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-white/5 cursor-pointer"
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
    </div>
  )
}
