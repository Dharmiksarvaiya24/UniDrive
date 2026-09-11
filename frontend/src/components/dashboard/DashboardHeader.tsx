import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiGrid,
  FiList,
  FiSearch,
  FiMenu,
  FiChevronRight,
  FiArrowLeft,
  FiFilter,
  FiCheck,
  FiRefreshCw,
} from 'react-icons/fi'
import { FaGoogleDrive } from 'react-icons/fa'
import type { BreadcrumbItem, ConnectedAccount, SidebarTab, ViewMode } from '../../types/drive'

interface DashboardHeaderProps {
  folderBreadcrumbs: BreadcrumbItem[]
  onNavigateBreadcrumb: (targetIndex: number) => void
  onNavigateHome: () => void
  onNavigateParent: () => void
  activeTab: SidebarTab
  selectedAccountEmail: string | null
  onSelectAccountEmail: (email: string | null) => void
  connectedAccounts: ConnectedAccount[]
  searchQuery: string
  onSearchChange: (query: string) => void
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  isSyncing: boolean
  filesLoading: boolean
  onSync: () => void
  onOpenMobileSidebar: () => void
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  folderBreadcrumbs,
  onNavigateBreadcrumb,
  onNavigateHome,
  onNavigateParent,
  activeTab,
  selectedAccountEmail,
  onSelectAccountEmail,
  connectedAccounts,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  isSyncing,
  filesLoading,
  onSync,
  onOpenMobileSidebar,
}) => {
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false)
  const filterRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3 overflow-hidden">
        {/* Mobile menu button */}
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          aria-label="Open sidebar menu"
          className="rounded-lg p-2 text-white/60 transition-colors hover:bg-white/5 hover:text-white md:hidden"
        >
          <FiMenu className="h-5 w-5" />
        </button>

        {/* Breadcrumbs Navigation */}
        {folderBreadcrumbs.length > 0 ? (
          <div className="flex items-center gap-2 overflow-hidden">
            <button
              type="button"
              onClick={onNavigateParent}
              title="Back to parent folder"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/70 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
            >
              <FiArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-1.5 overflow-hidden text-sm sm:text-base">
              <button
                type="button"
                onClick={onNavigateHome}
                className="truncate text-white/40 transition-colors hover:text-white cursor-pointer"
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
                        onClick={() => onNavigateBreadcrumb(idx)}
                        className="truncate text-white/40 transition-colors hover:text-white cursor-pointer"
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

      {/* Controls: Search + View Switcher + Filter + Sync */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 sm:w-80">
          <FiSearch className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search across all drives"
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-11 pr-4 text-sm text-white placeholder:text-white/25 outline-none transition-colors focus:border-accent/50"
          />
        </div>

        {/* View Switcher Toggle */}
        <div className="flex items-center rounded-xl border border-white/10 bg-white/5 p-1">
          <button
            type="button"
            title="Mac Finder Grid View"
            onClick={() => onViewModeChange('grid')}
            className={`rounded-lg p-1.5 transition-colors cursor-pointer ${
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
            onClick={() => onViewModeChange('list')}
            className={`rounded-lg p-1.5 transition-colors cursor-pointer ${
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
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-all cursor-pointer ${
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
                    onSelectAccountEmail(null)
                    setFilterDropdownOpen(false)
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs transition-colors cursor-pointer ${
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
                            onSelectAccountEmail(isSelected ? null : acc.email)
                            setFilterDropdownOpen(false)
                          }}
                          className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs transition-colors cursor-pointer ${
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
          onClick={onSync}
          disabled={isSyncing || filesLoading}
          title="Sync and refresh latest files from Google Drive"
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-all cursor-pointer ${
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
  )
}
