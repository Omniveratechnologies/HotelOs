import React, { useState } from 'react'
import RoomModal from '../../components/RoomModal.jsx'
import AddRoomModal from './AddRoomModal.jsx'
import { useHotelOS } from '../../app/providers.jsx'

export default function RoomsPage() {
  const { rooms, updateRoomStatus, addRoom, roomsLoading, roomsError } = useHotelOS()
  const [selected, setSelected] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [filter, setFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [search, setSearch] = useState('')

  const filtered = rooms.filter(r => {
    if (filter !== 'all' && r.status !== filter) return false
    if (typeFilter !== 'all' && r.type !== typeFilter) return false
    if (search && !r.roomNumber.includes(search) && !(r.guest && r.guest.toLowerCase().includes(search.toLowerCase()))) return false
    return true
  })

  const statusColor = { available: 'bg-green-100 text-green-700', occupied: 'bg-blue-100 text-blue-700', reserved: 'bg-amber-100 text-amber-700', cleaning: 'bg-gray-100 text-gray-600' }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0f1f3d] font-display">Room Management</h1>
          <p className="text-gray-500 text-sm">{rooms.length} total rooms · {rooms.filter(r=>r.status==='available').length} available</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="px-4 py-2 bg-[#0f1f3d] text-white text-sm rounded-xl font-medium hover:bg-[#162847] transition-colors">+ Add Room</button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search room or guest..." className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#c9a84c] w-56"/>
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
          {['all','available','occupied','reserved','cleaning'].map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${filter === s ? 'bg-white text-[#0f1f3d] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{s}</button>
          ))}
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#c9a84c]">
          <option value="all">All Types</option>
          <option>Standard</option><option>Deluxe</option><option>Suite</option>
        </select>
      </div>

      {/* Loading / Error */}
      {roomsLoading && (
        <div className="py-16 text-center text-gray-400 text-sm">Loading rooms...</div>
      )}
      {!roomsLoading && roomsError && (
        <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600 mb-4">{roomsError}</div>
      )}

      {/* Empty state */}
      {!roomsLoading && !roomsError && filtered.length === 0 && (
        <div className="py-16 text-center text-gray-400 text-sm">
          No rooms found. Create your first room with “+ Add Room”.
        </div>
      )}

      {/* Room Cards */}
      {!roomsLoading && filtered.length > 0 && (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {filtered.map(room => (
          <button key={room.id} onClick={() => setSelected(room)} className="bg-white rounded-2xl border border-gray-100 p-4 text-left hover:shadow-md hover:scale-105 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold text-[#0f1f3d]">{room.roomNumber}</span>
              <span className="text-xl">🛏</span>
            </div>
            <div className="text-xs text-gray-500 mb-2">{room.type}</div>
            <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${statusColor[room.status]}`}>{room.status.toUpperCase()}</div>
            {room.guest && <div className="text-xs text-gray-600 mt-2 font-medium truncate">{room.guest}</div>}
            {room.checkOut && <div className="text-[10px] text-gray-400 mt-0.5">Out: {room.checkOut}</div>}
            <div className="text-[#c9a84c] text-xs font-semibold mt-2">₹{room.rate}/night</div>
          </button>
        ))}
      </div>
      )}

      {selected && <RoomModal room={selected} onClose={() => setSelected(null)} updateRoomStatus={updateRoomStatus} />}
      {showAdd && <AddRoomModal onClose={() => setShowAdd(false)} onAdd={addRoom} />}
    </div>
  )
}
