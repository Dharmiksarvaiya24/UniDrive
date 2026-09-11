import React from 'react'
import { motion } from 'framer-motion'

interface DashboardStatsProps {
  filesLoading: boolean
  filesCount: number
  accountsCount: number
  totalBytes: number
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '—'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  filesLoading,
  filesCount,
  accountsCount,
  totalBytes,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.1 }}
      className="mt-6 grid grid-cols-1 gap-3 sm:mt-8 sm:grid-cols-3 sm:gap-4"
    >
      <div className="rounded-2xl border border-white/5 bg-white/[0.03] px-5 py-4 transition-colors hover:border-white/10 sm:px-6 sm:py-5">
        <p className="text-xs font-medium text-white/40">Total files</p>
        <p className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
          {filesLoading ? '...' : filesCount.toLocaleString()}
        </p>
        <p className="mt-1 text-xs font-medium text-green-400">
          {filesLoading ? 'loading' : 'synced just now'}
        </p>
      </div>

      <div className="rounded-2xl border border-white/5 bg-white/[0.03] px-5 py-4 transition-colors hover:border-white/10 sm:px-6 sm:py-5">
        <p className="text-xs font-medium text-white/40">Accounts linked</p>
        <p className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
          {accountsCount}
        </p>
        <p className="mt-1 text-xs font-medium text-white/40">All Google Drive</p>
      </div>

      <div className="rounded-2xl border border-white/5 bg-white/[0.03] px-5 py-4 transition-colors hover:border-white/10 sm:px-6 sm:py-5">
        <p className="text-xs font-medium text-white/40">Combined size</p>
        <p className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
          {filesLoading ? '...' : formatBytes(totalBytes)}
        </p>
        <p className="mt-1 text-xs font-medium text-green-400">across all accounts</p>
      </div>
    </motion.div>
  )
}
