import React, { useState } from 'react'

export default function RoomModal({ room, onClose, updateRoomStatus }) {
  const [view, setView] = useState('info') // info | checkin | checkout | assign
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [guestId, setGuestId] = useState('')
  const [checkIn, setCheckIn] = useState(new Date().toISOString().split('T')[0])
  const [checkOut, setCheckOut] = useState('')
  const [idType, setIdType] = useState('Aadhaar')
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

  const handleCheckIn = () => {
    if (!guestName || !checkOut || saving) return
    runUpdate('occupied', { guest: guestName, checkIn, checkOut })
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

  const handleReserve = () => {
    if (!guestName || !checkIn || !checkOut || saving) return
    runUpdate('reserved', { guest: guestName, checkIn, checkOut })
  }

  return (
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
                  <div className="text-gray-500 text-sm mt-1">Check-in: {room.checkIn} · Check-out: {room.checkOut}</div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                {room.status === 'available' && (
                  <>
                    <button onClick={() => setView('checkin')} className="col-span-2 py-3 bg-[#0f1f3d] text-white rounded-xl font-semibold hover:bg-[#162847] transition-colors">
                      ✓ Check In Guest
                    </button>
                    <button onClick={() => setView('assign')} className="py-3 border-2 border-amber-400 text-amber-600 rounded-xl font-semibold hover:bg-amber-50 transition-colors text-sm">
                      📅 Reserve Room
                    </button>
                    <button onClick={handleMarkCleaning} disabled={saving} className="py-3 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold hover:bg-gray-50 transition-colors text-sm">
                      🧹 Mark Cleaning
                    </button>
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
                    <button onClick={() => setView('checkin')} className="col-span-2 py-3 bg-[#0f1f3d] text-white rounded-xl font-semibold hover:bg-[#162847] transition-colors">
                      ✓ Check In Guest
                    </button>
                    <button onClick={handleCancelReservation} disabled={saving} className="col-span-2 py-3 border-2 border-red-200 text-red-500 rounded-xl font-semibold hover:bg-red-50 transition-colors text-sm">
                      Cancel Reservation
                    </button>
                  </>
                )}
                {room.status === 'cleaning' && (
                  <button onClick={handleMarkClean} className="col-span-2 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors">
                    ✓ Mark as Clean & Available
                  </button>
                )}
              </div>
            </div>
          )}

          {(view === 'checkin' || view === 'assign') && (
            <div className="space-y-3">
              <h3 className="font-bold text-[#0f1f3d]">{view === 'checkin' ? 'Check In Guest' : 'Reserve Room'}</h3>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Guest Name *</label>
                <input value={guestName} onChange={e => setGuestName(e.target.value)} placeholder="Full name" className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c]"/>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</label>
                <input value={guestPhone} onChange={e => setGuestPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c]"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Check In *</label>
                  <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#c9a84c]"/>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Check Out *</label>
                  <input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#c9a84c]"/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">ID Type</label>
                  <select value={idType} onChange={e => setIdType(e.target.value)} className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#c9a84c]">
                    <option>Aadhaar</option><option>PAN</option><option>Passport</option><option>Voter ID</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">ID Number</label>
                  <input value={guestId} onChange={e => setGuestId(e.target.value)} placeholder="XXXX-XXXX-XXXX" className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#c9a84c]"/>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setView('info')} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Back</button>
                <button onClick={view === 'checkin' ? handleCheckIn : handleReserve} className="flex-1 py-2.5 bg-[#0f1f3d] text-white rounded-xl text-sm font-semibold hover:bg-[#162847] transition-colors">
                  {view === 'checkin' ? 'Confirm Check In' : 'Confirm Reservation'}
                </button>
              </div>
            </div>
          )}

          {view === 'checkout' && (
            <div>
              <h3 className="font-bold text-[#0f1f3d] mb-3">Confirm Check Out</h3>
              <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-gray-500">Guest</span><span className="font-semibold">{room.guest}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Room</span><span className="font-semibold">{room.id} · {room.type}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Check-in</span><span>{room.checkIn}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Check-out</span><span>{room.checkOut}</span></div>
                <div className="border-t pt-2 flex justify-between font-bold"><span>Total (est.)</span><span className="text-[#0f1f3d]">₹{room.rate * Math.max(1, Math.round((new Date(room.checkOut) - new Date(room.checkIn)) / 86400000))}</span></div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setView('info')} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Back</button>
                <button onClick={handleCheckOut} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors">
                  Confirm Check Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
