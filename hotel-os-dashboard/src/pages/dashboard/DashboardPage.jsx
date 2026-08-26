import React, { useState } from 'react'
import RoomModal from '../../components/RoomModal.jsx'
import { useHotelOS } from '../../app/providers.jsx'

const statusColor = {
  available: 'border-green-500 text-green-600',
  occupied: 'border-blue-500 text-blue-600',
  reserved: 'border-amber-500 text-amber-600',
  cleaning: 'border-gray-400 text-gray-500',
}

const statusBg = {
  available: 'bg-green-50',
  occupied: 'bg-blue-50',
  reserved: 'bg-amber-50',
  cleaning: 'bg-gray-50',
}

const statCards = (rooms, serviceRequests, foodOrders) => {
  const occupied = rooms.filter(r => r.status === 'occupied').length
  const available = rooms.filter(r => r.status === 'available').length
  const reserved = rooms.filter(r => r.status === 'reserved').length
  const pending = serviceRequests.filter(r => r.status === 'requested').length
  const activeOrders = foodOrders.filter(o => o.status !== 'delivered').length
  const todayRevenue = rooms.filter(r => r.status === 'occupied').reduce((sum, r) => sum + r.rate, 0)
  return [
    { label: 'Occupied Rooms', value: occupied, icon: '🏨', color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Available Rooms', value: available, icon: '🔑', color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Reserved', value: reserved, icon: '📅', color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Pending Requests', value: pending, icon: '🔔', color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Active Food Orders', value: activeOrders, icon: '🍽️', color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: "Today's Revenue", value: `₹${todayRevenue.toLocaleString()}`, icon: '💰', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ]
}

export default function Dashboard() {
  const { rooms, serviceRequests, foodOrders, updateRoomStatus, acknowledgeRequest, completeRequest, updateOrderStatus, guests } = useHotelOS()
  const [selectedRoom, setSelectedRoom] = useState(null)
  const floors = [1, 2, 3]

  const recentActivity = [
    ...serviceRequests.slice(0, 3).map(r => ({ type: 'service', text: `Room ${r.room} – ${r.type}`, time: r.time, color: 'text-amber-600' })),
    ...foodOrders.slice(0, 2).map(o => ({ type: 'food', text: `Room ${o.room} – ${o.items}`, time: o.time, color: 'text-purple-600' })),
  ].sort(() => Math.random() - 0.5).slice(0, 5)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0f1f3d] font-display">Good Morning, Receptionist 👋</h1>
          <p className="text-gray-500 text-sm mt-0.5">Thursday, 13 August 2026 · Grand Residency Hotel</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-[#0f1f3d] text-white text-sm rounded-xl font-medium hover:bg-[#162847] transition-colors">
            + New Booking
          </button>
          <button className="px-4 py-2 border border-gray-200 text-gray-700 text-sm rounded-xl font-medium hover:bg-gray-50 transition-colors">
            Export Report
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {statCards(rooms, serviceRequests, foodOrders).map(card => (
          <div key={card.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className={`w-9 h-9 ${card.bg} rounded-xl flex items-center justify-center text-lg mb-3`}>{card.icon}</div>
            <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
            <div className="text-gray-500 text-xs mt-0.5 uppercase tracking-wide">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Room Grid */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[#0f1f3d] flex items-center gap-2">
              <span className="w-1 h-5 bg-[#c9a84c] rounded-full inline-block"/>
              Room Grid — Tap a room to manage
            </h2>
          </div>
          <div className="space-y-4">
            {floors.map(floor => (
              <div key={floor}>
                <div className="text-xs text-gray-400 font-semibold uppercase tracking-widest mb-2">Floor {floor}</div>
                <div className="grid grid-cols-6 gap-2">
                  {rooms.filter(r => r.floor === floor).map(room => (
                    <button
                      key={room.id}
                      onClick={() => setSelectedRoom(room)}
                      className={`rounded-xl border-2 p-2.5 text-center cursor-pointer transition-all hover:scale-105 hover:shadow-md ${statusColor[room.status]} ${statusBg[room.status]}`}
                    >
                      <div className="text-[10px] mb-1">🛏</div>
                      <div className="font-bold text-sm">{room.id}</div>
                      <div className="text-[9px] font-semibold uppercase tracking-wide mt-0.5">{room.status}</div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-100">
            {[['available','bg-green-500','Available'],['occupied','bg-blue-500','Occupied'],['reserved','bg-amber-500','Reserved'],['cleaning','bg-gray-400','Needs Cleaning']].map(([k,c,l]) => (
              <div key={k} className="flex items-center gap-1.5 text-xs text-gray-600">
                <span className={`w-3 h-3 rounded-sm ${c}`}/>
                {l}
              </div>
            ))}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Service Requests */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-[#0f1f3d] flex items-center gap-2 mb-3">
              <span className="w-1 h-5 bg-[#c9a84c] rounded-full inline-block"/>
              Service Requests
            </h2>
            <div className="space-y-3 max-h-52 overflow-y-auto scrollbar-thin">
              {serviceRequests.filter(r => r.status !== 'completed').map(req => (
                <div key={req.id} className="border border-gray-100 rounded-xl p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-xs text-[#0f1f3d]">Room {req.room} · {req.type}</div>
                      <div className="text-gray-500 text-xs truncate mt-0.5">{req.detail}</div>
                    </div>
                    {req.priority === 'high' && <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">URGENT</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${req.status === 'requested' ? 'bg-orange-100 text-orange-600' : req.status === 'acknowledged' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                      ● {req.status.toUpperCase()}
                    </span>
                    {req.status === 'requested' && (
                      <button onClick={() => acknowledgeRequest(req.id)} className="text-[9px] bg-[#0f1f3d] text-white px-2 py-0.5 rounded-full hover:bg-[#162847] transition-colors">
                        Acknowledge
                      </button>
                    )}
                    {req.status === 'acknowledged' && (
                      <button onClick={() => completeRequest(req.id)} className="text-[9px] bg-green-600 text-white px-2 py-0.5 rounded-full hover:bg-green-700 transition-colors">
                        Complete
                      </button>
                    )}
                    <span className="text-gray-400 text-[9px] ml-auto">{req.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Food Orders */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-[#0f1f3d] flex items-center gap-2 mb-3">
              <span className="w-1 h-5 bg-[#c9a84c] rounded-full inline-block"/>
              Live Food Orders
            </h2>
            <div className="space-y-2 max-h-44 overflow-y-auto scrollbar-thin">
              {foodOrders.map(order => (
                <div key={order.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-sm flex-shrink-0">🍽</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-[#0f1f3d]">Room {order.room}</div>
                    <div className="text-gray-500 text-[10px] truncate">{order.items}</div>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-1 rounded-full flex-shrink-0 ${
                    order.status === 'delivered' ? 'bg-green-100 text-green-600' :
                    order.status === 'out-for-delivery' ? 'bg-blue-100 text-blue-600' :
                    'bg-orange-100 text-orange-600'
                  }`}>
                    {order.status === 'out-for-delivery' ? 'OUT FOR DELIVERY' : order.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Activity */}
          <div className="bg-[#0f1f3d] rounded-2xl p-5">
            <h2 className="font-bold text-white flex items-center gap-2 mb-3">
              <span className="w-1 h-5 bg-[#c9a84c] rounded-full inline-block"/>
              Recent Activity
            </h2>
            <div className="space-y-2">
              {recentActivity.map((a, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] mt-1.5 flex-shrink-0"/>
                  <div className="flex-1 min-w-0">
                    <div className="text-white/80 text-xs truncate">{a.text}</div>
                    <div className="text-white/30 text-[10px]">{a.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {selectedRoom && (
        <RoomModal room={selectedRoom} onClose={() => setSelectedRoom(null)} updateRoomStatus={updateRoomStatus} guests={guests} />
      )}
    </div>
  )
}
