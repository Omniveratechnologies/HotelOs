import React, { useState } from 'react'
import { useHotelOS } from '../../app/providers.jsx'

export default function GuestsPage() {
  const { guests, setGuests, rooms } = useHotelOS()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '', room: '', checkIn: '', checkOut: '', idType: 'Aadhaar', idNum: '' })

  const filtered = guests.filter(g => {
    if (filter !== 'all' && g.status !== filter) return false
    if (search && !g.name.toLowerCase().includes(search.toLowerCase()) && !g.room.includes(search)) return false
    return true
  })

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
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((g, idx) => {
              const room = rooms.find(r => r.id === g.room)
              const amount = room ? room.rate * g.nights : 0
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
                  <td className="py-3 px-4 text-sm text-gray-600">{g.checkIn}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{g.checkOut}</td>
                  <td className="py-3 px-4 text-sm font-medium text-[#0f1f3d]">{g.nights}n</td>
                  <td className="py-3 px-4"><span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{g.idType}</span></td>
                  <td className="py-3 px-4"><span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusBadge[g.status]}`}>{g.status.replace('-',' ').toUpperCase()}</span></td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1">
                      <button className="text-xs text-[#0f1f3d] border border-gray-200 px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors">View</button>
                      <button className="text-xs text-gray-500 border border-gray-200 px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors">Bill: ₹{amount.toLocaleString()}</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">No guests found</div>
        )}
      </div>

      {/* Add Guest Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-[#0f1f3d] text-lg mb-4">Add New Guest</h3>
            <div className="space-y-3">
              {[['name','Guest Name'],['phone','Phone'],['email','Email']].map(([k,l]) => (
                <div key={k}>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{l}</label>
                  <input value={form[k]} onChange={e => setForm(p => ({...p,[k]:e.target.value}))} className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#c9a84c]"/>
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Room</label>
                  <select value={form.room} onChange={e => setForm(p => ({...p,room:e.target.value}))} className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#c9a84c]">
                    <option value="">Select</option>
                    {rooms.filter(r=>r.status==='available').map(r => <option key={r.id} value={r.id}>Room {r.id} ({r.type})</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">ID Type</label>
                  <select value={form.idType} onChange={e => setForm(p => ({...p,idType:e.target.value}))} className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#c9a84c]">
                    <option>Aadhaar</option><option>PAN</option><option>Passport</option><option>Voter ID</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Check In</label>
                  <input type="date" value={form.checkIn} onChange={e => setForm(p => ({...p,checkIn:e.target.value}))} className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#c9a84c]"/>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Check Out</label>
                  <input type="date" value={form.checkOut} onChange={e => setForm(p => ({...p,checkOut:e.target.value}))} className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#c9a84c]"/>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={() => {
                if (!form.name || !form.room) return
                const nights = form.checkIn && form.checkOut ? Math.max(1, Math.round((new Date(form.checkOut)-new Date(form.checkIn))/86400000)) : 1
                setGuests(p => [...p, { id: Date.now(), ...form, nights, status: 'checked-in' }])
                setShowAdd(false)
                setForm({ name:'', phone:'', email:'', room:'', checkIn:'', checkOut:'', idType:'Aadhaar', idNum:'' })
              }} className="flex-1 py-2.5 bg-[#0f1f3d] text-white rounded-xl text-sm font-semibold hover:bg-[#162847] transition-colors">
                Add Guest
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
