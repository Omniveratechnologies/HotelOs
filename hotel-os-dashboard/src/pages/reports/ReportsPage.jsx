import React from 'react'
import { useHotelOS } from '../../app/providers.jsx'

const ROOM_TYPES = ['Standard', 'Deluxe', 'Suite']

export default function ReportsPage() {
  const { rooms, guests, foodOrders, serviceRequests, stats } = useHotelOS()

  const occupied = rooms.filter(r => r.status === 'occupied')
  const available = rooms.filter(r => r.status === 'available')
  const reserved = rooms.filter(r => r.status === 'reserved')
  const cleaning = rooms.filter(r => r.status === 'cleaning')
  const total = rooms.length
  const occupancyRate = total > 0 ? Math.round((occupied.length / total) * 100) : 0

  const roomRevenue = occupied.reduce((sum, r) => sum + r.rate, 0)
  const foodRevenue = foodOrders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + o.amount, 0)
  const avgDailyRate = occupied.length > 0 ? Math.round(roomRevenue / occupied.length) : 0

  const byType = ROOM_TYPES.map(type => {
    const occ = occupied.filter(r => r.type === type)
    const totalInType = rooms.filter(r => r.type === type).length
    return {
      type,
      total: totalInType,
      occupied: occ.length,
      avgRate: occ.length > 0 ? Math.round(occ.reduce((sum, r) => sum + r.rate, 0) / occ.length) : 0,
      revenue: occ.reduce((sum, r) => sum + r.rate, 0),
    }
  })

  const checkedInGuests = guests.filter(g => g.status === 'checked-in')
  const reservedGuests = guests.filter(g => g.status === 'reserved')
  const checkedOutGuests = guests.filter(g => g.status === 'checked-out')

  const hotelName = stats?.hotelName || 'your hotel'
  const reportDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0f1f3d] font-display">Reports & Analytics</h1>
          <p className="text-gray-500 text-sm">Live snapshot · {reportDate} · {hotelName}</p>
        </div>
        <button className="px-4 py-2 border border-gray-200 text-gray-700 text-sm rounded-xl font-medium hover:bg-gray-50 transition-colors">Export PDF</button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Occupancy Rate', value: `${occupancyRate}%`, sub: `${occupied.length}/${total} rooms`, color: 'text-blue-600', bg: 'bg-blue-50', icon: '🏨' },
          { label: 'Room Revenue', value: `₹${roomRevenue.toLocaleString()}`, sub: `${occupied.length} occupied rooms`, color: 'text-green-600', bg: 'bg-green-50', icon: '💰' },
          { label: 'F&B Revenue', value: `₹${foodRevenue.toLocaleString()}`, sub: `${foodOrders.filter(o=>o.status==='delivered').length} delivered orders`, color: 'text-purple-600', bg: 'bg-purple-50', icon: '🍽️' },
          { label: 'Avg Daily Rate', value: `₹${avgDailyRate.toLocaleString()}`, sub: 'Per occupied room', color: 'text-[#c9a84c]', bg: 'bg-amber-50', icon: '📊' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className={`w-10 h-10 ${k.bg} rounded-xl flex items-center justify-center text-xl mb-3`}>{k.icon}</div>
            <div className={`text-2xl font-bold ${k.color}`}>{k.value}</div>
            <div className="text-gray-700 text-sm font-medium mt-0.5">{k.label}</div>
            <div className="text-gray-400 text-xs mt-0.5">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Room Mix by Type */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-[#0f1f3d] mb-4">Current Room Mix</h3>
          <div className="space-y-4">
            {byType.map(t => (
              <div key={t.type}>
                <div className="flex justify-between mb-1.5">
                  <span className="text-sm font-semibold text-[#0f1f3d]">{t.type}</span>
                  <span className="text-sm text-gray-500">{t.occupied}/{t.total} occupied · ₹{t.avgRate}/night</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-700 ${t.occupied > 0 ? 'bg-gradient-to-r from-[#0f1f3d] to-[#1e3a5f]' : 'bg-gray-200'}`}
                    style={{ width: `${total > 0 ? (t.total / total) * 100 : 0}%` }}/>
                </div>
              </div>
            ))}
          </div>
          {rooms.length === 0 && (
            <div className="py-6 text-center text-sm text-gray-400">No rooms yet. Create rooms to see the mix.</div>
          )}
        </div>

        {/* Room Status Donut */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-[#0f1f3d] mb-4">Current Room Status</h3>
          {total === 0 ? (
            <div className="py-10 text-center text-sm text-gray-400">No rooms yet.</div>
          ) : (
          <div className="flex items-center gap-6">
            <div className="relative w-36 h-36 flex-shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="3.5"/>
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#22c55e" strokeWidth="3.5"
                  strokeDasharray={`${(available.length/total)*100} ${100-(available.length/total)*100}`}
                  strokeDashoffset="0"/>
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#3b82f6" strokeWidth="3.5"
                  strokeDasharray={`${(occupied.length/total)*100} ${100-(occupied.length/total)*100}`}
                  strokeDashoffset={`${-(available.length/total)*100}`}/>
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f59e0b" strokeWidth="3.5"
                  strokeDasharray={`${(reserved.length/total)*100} ${100-(reserved.length/total)*100}`}
                  strokeDashoffset={`${-((available.length+occupied.length)/total)*100}`}/>
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#9ca3af" strokeWidth="3.5"
                  strokeDasharray={`${(cleaning.length/total)*100} ${100-(cleaning.length/total)*100}`}
                  strokeDashoffset={`${-((available.length+occupied.length+reserved.length)/total)*100}`}/>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#0f1f3d]">{occupancyRate}%</div>
                  <div className="text-gray-400 text-xs">Occupied</div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {[['bg-green-500','Available',available.length],['bg-blue-500','Occupied',occupied.length],['bg-amber-500','Reserved',reserved.length],['bg-gray-400','Cleaning',cleaning.length]].map(([c,l,n]) => (
                <div key={l} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${c} flex-shrink-0`}/>
                  <div>
                    <div className="text-sm font-semibold text-[#0f1f3d]">{n} rooms</div>
                    <div className="text-xs text-gray-400">{l}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          )}
        </div>
      </div>

      {/* Guest Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">Checked In</div>
          <div className="text-3xl font-bold text-[#0f1f3d]">{checkedInGuests.length}</div>
          <div className="text-sm text-gray-400 mt-1">{checkedInGuests.slice(0, 3).map(g => g.name).join(' · ') || 'No guests in-house'}</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2">Upcoming Reservations</div>
          <div className="text-3xl font-bold text-[#0f1f3d]">{reservedGuests.length}</div>
          <div className="text-sm text-gray-400 mt-1">{reservedGuests.slice(0, 3).map(g => g.name).join(' · ') || 'No upcoming reservations'}</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Total Guests Registered</div>
          <div className="text-3xl font-bold text-[#0f1f3d]">{guests.length}</div>
          <div className="text-sm text-gray-400 mt-1">{checkedOutGuests.length} checked out so far</div>
        </div>
      </div>

      {/* Revenue by Room Type */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
        <h3 className="font-bold text-[#0f1f3d] mb-4">Revenue by Room Type</h3>
        {total === 0 ? (
          <div className="py-6 text-center text-sm text-gray-400">No rooms yet.</div>
        ) : (
        <div className="space-y-4">
          {byType.map(t => {
            const rev = t.revenue
            const pct = roomRevenue > 0 ? (rev / roomRevenue) * 100 : 0
            return (
              <div key={t.type}>
                <div className="flex justify-between mb-1.5">
                  <span className="text-sm font-medium text-[#0f1f3d]">{t.type} <span className="text-gray-400 font-normal">({t.occupied} rooms · ₹{t.avgRate}/night avg)</span></span>
                  <span className="text-sm font-bold text-[#0f1f3d]">₹{rev.toLocaleString()}</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#0f1f3d] to-[#1e3a5f] rounded-full transition-all duration-700" style={{ width: `${pct}%` }}/>
                </div>
                <div className="text-xs text-gray-400 mt-0.5">{Math.round(pct)}% of room revenue</div>
              </div>
            )
          })}
        </div>
        )}
      </div>

      {/* Service Metrics */}
      <div className="bg-[#0f1f3d] rounded-2xl p-5">
        <h3 className="font-bold text-white mb-4">Service Performance</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[['Total Requests', serviceRequests.length, 'text-white'], ['Pending', serviceRequests.filter(r=>r.status==='requested').length, 'text-orange-400'], ['Acknowledged', serviceRequests.filter(r=>r.status==='acknowledged').length, 'text-yellow-400'], ['In Progress', serviceRequests.filter(r=>r.status==='in-progress').length, 'text-blue-400'], ['Completed', serviceRequests.filter(r=>r.status==='completed').length, 'text-green-400']].map(([l,v,c]) => (
            <div key={l} className="bg-white/5 rounded-xl p-3 text-center">
              <div className={`text-3xl font-bold ${c}`}>{v}</div>
              <div className="text-white/50 text-xs mt-1 uppercase tracking-wide">{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}