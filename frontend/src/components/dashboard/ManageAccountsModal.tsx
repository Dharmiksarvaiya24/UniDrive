import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiTrash2, FiPlus, FiAlertCircle, FiLoader, FiCheck } from 'react-icons/fi'
import { FaGoogleDrive } from 'react-icons/fa'
import { API_BASE_URL } from '../../config/api'

interface ConnectedAccount {
  googleAccountId: string
  email: string
  name: string
  storage?: {
    limit: number
    usage: number
  } | null
}

interface ManageAccountsModalProps {
  isOpen: boolean
  onClose: () => void
  accounts: ConnectedAccount[]
  onAccountRemoved: (accountId: string) => void
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`
}

export const ManageAccountsModal: React.FC<ManageAccountsModalProps> = ({
  isOpen,
  onClose,
  accounts,
  onAccountRemoved,
}) => {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  if (!isOpen) return null

  const handleRemove = async (accountId: string) => {
    setDeletingId(accountId)
    setStatusMessage(null)

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/accounts/${accountId}`,
        { method: 'DELETE', credentials: 'include' }
      )
      const data = await res.json()

      if (data.success) {
        onAccountRemoved(accountId)
        setConfirmId(null)
        setStatusMessage('Account disconnected successfully')
        setTimeout(() => setStatusMessage(null), 3000)
      } else {
        alert(data.error || 'Failed to remove account')
      }
    } catch (err) {
      console.error('Error removing account:', err)
      alert('Network error while disconnecting account')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 320 }}
          className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#141416] shadow-2xl shadow-black/80"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
            <div>
              <h2 className="text-lg font-semibold text-white">Manage Connected Drives</h2>
              <p className="text-xs text-white/40 mt-0.5">
                Add or disconnect Google Drive accounts connected to your workspace
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 hover:bg-white/10 hover:text-white transition-colors"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>

          {/* Status Alert */}
          {statusMessage && (
            <div className="mx-6 mt-4 flex items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-2.5 text-xs text-green-400">
              <FiCheck className="h-4 w-4" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Accounts List */}
          <div className="max-h-[50vh] overflow-y-auto px-6 py-4 space-y-3">
            {accounts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-white/30">
                <FaGoogleDrive className="h-10 w-10 mb-2 opacity-30" />
                <p className="text-sm">No Google accounts linked yet</p>
              </div>
            ) : (
              accounts.map((acc) => {
                const isConfirming = confirmId === acc.googleAccountId
                const isDeleting = deletingId === acc.googleAccountId

                return (
                  <div
                    key={acc.googleAccountId}
                    className="flex flex-col gap-2 rounded-xl border border-white/5 bg-white/[0.03] p-4 transition-colors hover:border-white/10"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-accent">
                          <FaGoogleDrive className="h-5 w-5 text-white/70" />
                        </div>
                        <div className="flex flex-col overflow-hidden">
                          <span className="truncate text-sm font-semibold text-white/90">
                            {acc.email}
                          </span>
                          <span className="truncate text-xs text-white/40">
                            {acc.name || 'Google Account'}
                            {acc.storage && acc.storage.limit > 0 && (
                              <> · {formatBytes(acc.storage.usage)} of {formatBytes(acc.storage.limit)}</>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Disconnect Action */}
                      <div>
                        {isConfirming ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={isDeleting}
                              onClick={() => handleRemove(acc.googleAccountId)}
                              className="flex items-center gap-1 rounded-lg bg-red-500/20 px-2.5 py-1 text-xs font-semibold text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                            >
                              {isDeleting ? (
                                <FiLoader className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                'Confirm'
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmId(null)}
                              className="rounded-lg bg-white/5 px-2 py-1 text-xs text-white/50 hover:bg-white/10 hover:text-white"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmId(acc.googleAccountId)}
                            title="Disconnect account"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/30 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {isConfirming && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-1 flex items-center gap-1.5 text-[11px] text-red-400/80"
                      >
                        <FiAlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>Disconnecting will remove all synced files for this account.</span>
                      </motion.div>
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between border-t border-white/10 bg-[#18181b] px-6 py-4">
            <span className="text-xs text-white/40">
              {accounts.length} connected {accounts.length === 1 ? 'account' : 'accounts'}
            </span>

            <div className="flex items-center gap-3">
              <a
                href={`${API_BASE_URL}/auth/google`}
                className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-xs font-semibold text-black transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <FiPlus className="h-4 w-4" />
                Add Google Account
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
