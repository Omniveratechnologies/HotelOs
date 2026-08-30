import React, { useState } from 'react'
import { useHotelOS } from '../../../app/providers.jsx'
import { updateGuest, updateGuestCredentials } from '../../../services/guest.service.js'
import { API_URL } from '../../../utils/apiFetch.js'

export default function GuestDetailsModal({ guest, onClose, onEdit }) {
  const { refreshData } = useHotelOS()

  const [error, setError] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [credentials, setCredentials] = useState(null)

  const handleCheckout = async () => {
    setError('')
    setBusy(true)
    try {
      await updateGuest(guest.id, { status: 'checked-out' })
      await refreshData()
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to check out the guest.')
    } finally {
      setBusy(false)
    }
  }

  const handleRegenerate = async () => {
    setError('')
    setBusy(true)
    try {
      const result = await updateGuestCredentials(guest.id, { action: 'regenerate' })
      setCredentials(result.data || null)
      setShowNewPassword(false)
    } catch (err) {
      setError(err.message || 'Failed to regenerate credentials.')
    } finally {
      setBusy(false)
    }
  }

  const handleSetPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setError('')
    setBusy(true)
    try {
      await updateGuestCredentials(guest.id, { password: newPassword })
      setNewPassword('')
      setShowNewPassword(false)
    } catch (err) {
      setError(err.message || 'Failed to update the password.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start sm:items-center justify-center z-50 p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl my-8" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-[#0f1f3d] rounded-t-2xl p-5 flex items-center justify-between">
          <div>
            <div className="text-[#c9a84c] text-xs font-semibold uppercase tracking-widest">Guest Details</div>
            <div className="text-white font-bold text-lg mt-0.5">{guest.name}</div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Credentials banner */}
          {credentials && (
            <div className="bg-amber-50 rounded-xl px-4 py-3 text-sm text-[#0f1f3d]">
              <span className="font-semibold">New credentials:</span>{' '}
              <span className="font-mono">{credentials.username}</span> / <span className="font-mono">{credentials.temporaryPassword}</span>
              {credentials.emailSent ? ' — emailed to guest.' : ' — email failed, share manually.'}
            </div>
          )}

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div><div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Room</div><div className="font-semibold text-[#0f1f3d]">{guest.room ? `Room ${guest.room.roomNumber} · ${guest.room.type}` : '—'}</div></div>
            <div><div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</div><div className="font-semibold capitalize text-[#0f1f3d]">{(guest.status || '').replace('-', ' ')}</div></div>
            <div><div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</div><div className="text-gray-600">{guest.email}</div></div>
            <div><div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</div><div className="text-gray-600">{guest.phone || '—'}</div></div>
            <div><div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Address</div><div className="text-gray-600">{guest.address || '—'}</div></div>
            <div><div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">ID</div><div className="text-gray-600">{guest.idType}{guest.idNumber ? ` · ${guest.idNumber}` : ''}</div></div>
            <div><div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Stay</div><div className="text-gray-600">{guest.checkIn || '—'} → {guest.checkOut || '—'}{guest.nights ? ` (${guest.nights}n)` : ''}</div></div>
          </div>

          {/* Documents */}
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Documents ({guest.documents?.length || 0})</div>
            {guest.documents?.length > 0 ? (
              <div className="space-y-2">
                {guest.documents.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-gray-400 uppercase">{doc.docType}</div>
                      <div className="text-sm text-[#0f1f3d] truncate">{doc.filename}</div>
                    </div>
                    {doc.url && (
                      <a
                        href={`${API_URL}${doc.url}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-[#c9a84c] font-semibold border border-[#c9a84c]/40 rounded-lg px-3 py-1.5 hover:bg-amber-50"
                      >
                        View
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-400">No documents uploaded.</div>
            )}
          </div>

          {/* Credential management */}
          <div className="border-t pt-4">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Login Credentials</div>
            {!showNewPassword ? (
              <div className="flex flex-wrap gap-2">
                <button onClick={handleRegenerate} disabled={busy} className="text-xs border border-amber-300 text-amber-700 rounded-lg px-3 py-2 hover:bg-amber-50 disabled:opacity-60">🔑 Regenerate & Email New Password</button>
                <button onClick={() => setShowNewPassword(true)} disabled={busy} className="text-xs border border-gray-200 text-gray-600 rounded-lg px-3 py-2 hover:bg-gray-50 disabled:opacity-60">Set Password Manually</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New password (min 8 chars)" className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#c9a84c]"/>
                <button onClick={() => { setShowNewPassword(false); setNewPassword('') }} className="text-xs border border-gray-200 rounded-xl px-3 hover:bg-gray-50">Cancel</button>
                <button onClick={handleSetPassword} disabled={busy} className="text-xs bg-[#0f1f3d] text-white rounded-xl px-3 hover:bg-[#162847] disabled:opacity-60">{busy ? '...' : 'Save'}</button>
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">{error}</div>
          )}

          {/* Actions */}
          <div className="flex gap-3 border-t pt-4">
            <button onClick={onEdit} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-[#0f1f3d] hover:bg-gray-50">✏️ Edit</button>

            {guest.status !== 'checked-out' && (
              <button onClick={handleCheckout} disabled={busy} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-60">← Check Out</button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
