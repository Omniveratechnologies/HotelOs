import React, { useState } from 'react'
import { useHotelOS } from '../../app/providers.jsx'
import AddGuestModal from './_components/AddGuestModal.jsx'
import GuestDetailsModal from './_components/GuestDetailsModal.jsx'
import EditGuestModal from './_components/EditGuestModal.jsx'

export default function GuestsPage() {
  const { guests, guestsLoading, guestsError, removeGuest, refreshData } = useHotelOS()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [showAdd, setShowAdd] = useState(false)
  const [viewing, setViewing] = useState(null)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [pageError, setPageError] = useState('')

  // Keep the viewed/edited guest fresh after data refreshes
  const liveGuest = viewing ? (guests.find(g => g.id === viewing.id) || viewing) : null

  const filtered = guests.filter(g => {
    if (filter !== 'all' && g.status !== filter) return false
    if (search && !g.name.toLowerCase().includes(search.toLowerCase()) && !(g.room && g.room.includes(search))) return false
    return true
  })

  const handleDelete = async () => {
    if (!deleting) return
    setPageError('')
    setDeleteBusy(true)
    try {
      await removeGuest(deleting.id)
      if (viewing?.id === deleting.id) setViewing(null)
      if (editing?.id === deleting.id) setEditing(null)
      setDeleting(null)
    } catch (err) {
      console.error('Failed to delete guest:', err)
      setPageError(err.message || 'Failed to delete the guest.')
    } finally {
      setDeleteBusy(false)
    }
  }

  const statusBadge = { 'checked-in': 'bg-blue-100 text-blue-700', reserved: 'bg-amber-100 text-amber-700', 'checked-out': 'bg-gray-100 text-gray-600' }

  const avatarLetter = name => name ? name[0].toUpperCase() : '?'
  const avatarColors = ['bg-purple-500', 'bg-blue-500', 'bg-green-500', 'bg-red-500', 'bg-orange-500', 'bg-pink-500']

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0f1f3d] font-display">Guest Directory</h1>
          <p className="text-gray-500 text-sm">{guests.filter(g=>g.status==='checked-in').length} checked in · {guests.filter(g=>g.status==='reserved').length} upcoming</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="px-4 py-2 bg-[#0f1f3d] text-white text-sm rounded-xl font-medium hover:bg-[#162847] transition-colors">+ Add Guest</button>
      </div>

      <div className="flex gap-3 mb-6">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search guests..." className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#c9a84c] w-64"/>
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
          {['all','checked-in','reserved','checked-out'].map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${filter === s ? 'bg-white text-[#0f1f3d] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{s.replace('-',' ')}</button>
          ))}
        </div>
      </div>

      {/* Loading / errors */}
      {guestsLoading && (
        <div className="py-16 text-center text-gray-400 text-sm">Loading guests...</div>
      )}
      {!guestsLoading && guestsError && (
        <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600 mb-4">{guestsError}</div>
      )}
      {pageError && (
        <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600 mb-4">{pageError}</div>
      )}

      {!guestsLoading && !guestsError && (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Guest</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Room</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Check In</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Check Out</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nights</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">ID</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Docs</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((g, idx) => {
              return (
                <tr key={g.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl ${avatarColors[idx % avatarColors.length]} flex items-center justify-center text-white font-bold text-sm`}>
                        {avatarLetter(g.name)}
                      </div>
                      <div>
                        <div className="font-semibold text-[#0f1f3d] text-sm">{g.name}</div>
                        <div className="text-gray-400 text-xs">{g.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4"><span className="font-bold text-[#0f1f3d]">{g.room}</span></td>
                  <td className="py-3 px-4 text-sm text-gray-600">{g.checkIn || '—'}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{g.checkOut || '—'}</td>
                  <td className="py-3 px-4 text-sm font-medium text-[#0f1f3d]">{g.nights ? `${g.nights}n` : '—'}</td>
                  <td className="py-3 px-4"><span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{g.idType}</span></td>
                  <td className="py-3 px-4 text-sm text-gray-600">{g.documents?.length > 0 ? `📄 ${g.documents.length}` : '—'}</td>
                  <td className="py-3 px-4"><span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusBadge[g.status]}`}>{(g.status || '').replace('-',' ').toUpperCase()}</span></td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1">
                      <button onClick={() => setViewing(g)} className="text-xs text-[#0f1f3d] border border-gray-200 px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors">View</button>
                      <button onClick={() => setEditing(g)} className="text-xs text-[#c9a84c] border border-gray-200 px-2 py-1 rounded-lg hover:bg-amber-50 transition-colors">Edit</button>
                      <button onClick={() => setDeleting(g)} disabled={g.status !== 'checked-out'} title={g.status !== 'checked-out' ? 'Check the guest out before deleting their account' : ''} className="text-xs text-red-500 border border-gray-200 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">Delete</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">No guests found. Register your first guest with “+ Add Guest”.</div>
        )}
      </div>
      )}

      {/* Modals */}
      {showAdd && (
        <AddGuestModal
          onClose={() => setShowAdd(false)}
          onRegistered={() => refreshData()}
        />
      )}

      {liveGuest && !editing && (
        <GuestDetailsModal
          guest={liveGuest}
          onClose={() => setViewing(null)}
          onEdit={() => setEditing(liveGuest)}
        />
      )}

      {editing && (
        <EditGuestModal
          guest={editing}
          onClose={() => setEditing(null)}
          onSaved={() => setEditing(null)}
        />
      )}

      {deleting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => !deleteBusy && setDeleting(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-[#0f1f3d] text-lg mb-2">Delete Guest Account?</h3>
            <p className="text-sm text-gray-500 mb-1">
              This permanently removes <strong>{deleting.name}</strong>, their login account and uploaded documents.
            </p>
            <p className="text-xs text-gray-400 mb-5">The room will be freed for new check-ins.</p>

            {pageError && (
              <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600 mb-4">{pageError}</div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setDeleting(null)} disabled={deleteBusy} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleDelete} disabled={deleteBusy} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 disabled:opacity-60">
                {deleteBusy ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
