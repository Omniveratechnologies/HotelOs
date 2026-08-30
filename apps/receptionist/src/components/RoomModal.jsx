import React, { useState } from 'react'
import AddGuestModal from '../pages/guests/_components/AddGuestModal.jsx'

export default function RoomModal({ room, onClose, updateRoomStatus }) {
  const [view, setView] = useState('info') // info | checkout
  const [registerOpen, setRegisterOpen] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const runUpdate = async (newStatus, guestData) => {
    setError('')
    setSaving(true)
    try {
      await updateRoomStatus(room.id, newStatus, guestData)
      onClose()
    } catch (err) {
      console.error('Room update failed:', err)
      setError(err.message || 'Failed to update the room.')
    } finally {
      setSaving(false)
    }
  }

  const handleCheckOut = () => {
    if (saving) return
    runUpdate('cleaning', { guest: null, checkIn: null, checkOut: null })
  }

  const handleMarkClean = () => {
    if (saving) return
    runUpdate('available', {})
  }

  const handleCancelReservation = () => {
    if (saving) return
    runUpdate('available', { guest: null })
  }

  const handleMarkCleaning = () => {
    if (saving) return
    runUpdate('cleaning', {})
  }

  // Real guest creation - opens the shared registration form
  const openRegister = () => setRegisterOpen(true)

  const totalEstimate = room.checkIn && room.checkOut
    ? room.rate * Math.max(1, Math.round((new Date(room.checkOut) - new Date(room.checkIn)) / 86400000))
    : null

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="bg-[#0f1f3d] rounded-t-2xl p-5 flex items-center justify-between">
            <div>
              <div className="text-[#c9a84c] text-xs font-semibold uppercase tracking-widest">Room {room.roomNumber}</div>
              <div className="text-white font-bold text-lg mt-0.5">{room.type} Room</div>
              <div className="text-white/60 text-sm">₹{room.rate}/night</div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                room.status === 'available' ? 'bg-green-500 text-white' :
                room.status === 'occupied' ? 'bg-blue-500 text-white' :
                room.status === 'reserved' ? 'bg-amber-500 text-white' :
                'bg-gray-400 text-white'
              }`}>
                {room.status.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-5">
            {error && (
              <div className="mb-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">{error}</div>
            )}
            {view === 'info' && (
              <div>
                {room.guest && (
                  <div className="bg-blue-50 rounded-xl p-4 mb-4">
                    <div className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-1">Current Guest</div>
                    <div className="font-bold text-[#0f1f3d] text-lg">{room.guest}</div>
                    <div className="text-gray-500 text-sm mt-1">Check-in: {room.checkIn || '—'} · Check-out: {room.checkOut || '—'}</div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  {(room.status === 'available' || room.status === 'cleaning') && (
                    <>
                      <button onClick={openRegister} disabled={saving} className="col-span-2 py-3 bg-[#0f1f3d] text-white rounded-xl font-semibold hover:bg-[#162847] transition-colors disabled:opacity-60">
                        ✓ Check In Guest
                      </button>
                      <button onClick={openRegister} disabled={saving} className="py-3 border-2 border-amber-400 text-amber-600 rounded-xl font-semibold hover:bg-amber-50 transition-colors text-sm disabled:opacity-60">
                        📅 Reserve Room
                      </button>
                      {room.status === 'available' && (
                        <button onClick={handleMarkCleaning} disabled={saving} className="py-3 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold hover:bg-gray-50 transition-colors text-sm disabled:opacity-60">
                          🧹 Mark Cleaning
                        </button>
                      )}
                    </>
                  )}
                  {room.status === 'occupied' && (
                    <>
                      <button onClick={() => setView('checkout')} className="col-span-2 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors">
                        ← Check Out Guest
                      </button>
                      <button className="py-3 border-2 border-amber-400 text-amber-600 rounded-xl font-semibold hover:bg-amber-50 transition-colors text-sm">
                        🔔 Add Request
                      </button>
                      <button className="py-3 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold hover:bg-gray-50 transition-colors text-sm">
                        🍽 Food Order
                      </button>
                    </>
                  )}
                  {room.status === 'reserved' && (
                    <>
                      <button onClick={openRegister} disabled={saving} className="col-span-2 py-3 bg-[#0f1f3d] text-white rounded-xl font-semibold hover:bg-[#162847] transition-colors disabled:opacity-60">
                        ✓ Check In Guest
                      </button>
                      <button onClick={handleCancelReservation} disabled={saving} className="col-span-2 py-3 border-2 border-red-200 text-red-500 rounded-xl font-semibold hover:bg-red-50 transition-colors text-sm disabled:opacity-60">
                        Cancel Reservation
                      </button>
                    </>
                  )}
                  {room.status === 'cleaning' && (
                    <button onClick={handleMarkClean} disabled={saving} className="col-span-2 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-60">
                      ✓ Mark as Clean & Available
                    </button>
                  )}
                </div>
              </div>
            )}

            {view === 'checkout' && (
              <div>
                <h3 className="font-bold text-[#0f1f3d] mb-3">Confirm Check Out</h3>
                <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Guest</span><span className="font-semibold">{room.guest}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Room</span><span className="font-semibold">{room.roomNumber} · {room.type}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Check-in</span><span>{room.checkIn || '—'}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Check-out</span><span>{room.checkOut || '—'}</span></div>
                  {totalEstimate !== null && (
                    <div className="border-t pt-2 flex justify-between font-bold"><span>Total (est.)</span><span className="text-[#0f1f3d]">₹{totalEstimate.toLocaleString()}</span></div>
                  )}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setView('info')} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Back</button>
                  <button onClick={handleCheckOut} disabled={saving} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-60">
                    {saving ? 'Checking Out...' : 'Confirm Check Out'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Real guest registration prefilled with this room */}
      {registerOpen && (
        <AddGuestModal
          initial={{
            roomId: room.id,
            roomNumber: room.roomNumber,
          }}
          onClose={() => setRegisterOpen(false)}
          onRegistered={() => {
            setRegisterOpen(false)
            onClose()
          }}
        />
      )}
    </>
  )
}
