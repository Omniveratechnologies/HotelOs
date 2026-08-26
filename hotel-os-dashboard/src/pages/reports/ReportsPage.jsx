import React, { useState } from 'react'
import { useHotelOS } from '../../app/providers.jsx'

export default function ReportsPage() {
  const { rooms, guests, foodOrders, serviceRequests } = useHotelOS()
  const occupied = rooms.filter(r=>r.status==='occupied').length
  const available = rooms.filter(r=>r.status==='available').length
  const reserved = rooms.filter(r=>r.status==='reserved').length
  const cleaning = rooms.filter(r=>r.status==='cleaning').length
  const total = rooms.length
  const occupancyRate = Math.round((occupied/total)*100)

  const revenueByType = [
    { type: 'Standard', rooms: rooms.filter(r=>r.type==='Standard' && r.status==='occupied'), rate: 2500 },
    { type: 'Deluxe', rooms: rooms.filter(r=>r.type==='Deluxe' && r.status==='occupied'), rate: 3500 },
    { type: 'Suite', rooms: rooms.filter(r=>r.type==='Suite' && r.status==='occupied'), rate: 6000 },
  ]
  const totalRevenue = revenueByType.reduce((s,r) => s + r.rooms.length * r.rate, 0)
  const foodRevenue = foodOrders.filter(o=>o.status==='delivered').reduce((s,o)=>s+o.amount,0)

  const weekDays = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
  const occupancyData = [62, 71, 68, 80, 75, 88, 72]
  const maxOcc = Math.max(...occupancyData)

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0f1f3d] font-display">Reports & Analytics</h1>
          <p className="text-gray-500 text-sm">Performance overview · August 2026</p>
        </div>
        <button className="px-4 py-2 border border-gray-200 text-gray-700 text-sm rounded-xl font-medium hover:bg-gray-50 transition-colors">Export PDF</button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Occupancy Rate', value: `${occupancyRate}%`, sub: `${occupied}/${total} rooms`, color: 'text-blue-600', bg: 'bg-blue-50', icon: '🏨' },
          { label: 'Room Revenue', value: `₹${totalRevenue.toLocaleString()}`, sub: 'Today', color: 'text-green-600', bg: 'bg-green-50', icon: '💰' },
          { label: 'F&B Revenue', value: `₹${foodRevenue.toLocaleString()}`, sub: `${foodOrders.filter(o=>o.status==='delivered').length} orders`, color: 'text-purple-600', bg: 'bg-purple-50', icon: '🍽️' },
          { label: 'Avg Daily Rate', value: `₹${occupied > 0 ? Math.round(totalRevenue/occupied) : 0}`, sub: 'Per occupied room', color: 'text-[#c9a84c]', bg: 'bg-amber-50', icon: '📊' },
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
        {/* Occupancy Bar Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-[#0f1f3d] mb-4">Weekly Occupancy %</h3>
          <div className="flex items-end gap-3 h-40">
            {weekDays.map((day, i) => (
              <div key={day} className="flex-1 flex flex-col items-center gap-1">
                <div className="text-xs font-bold text-gray-500">{occupancyData[i]}%</div>
                <div className="w-full rounded-t-lg bg-gradient-to-t from-[#0f1f3d] to-[#1e3a5f] transition-all duration-500"
                  style={{ height: `${(occupancyData[i]/maxOcc)*100}px`, opacity: i === 3 ? 1 : 0.7 }}/>
                <div className={`text-xs font-medium ${i === 3 ? 'text-[#c9a84c] font-bold' : 'text-gray-400'}`}>{day}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Room Status Donut */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-[#0f1f3d] mb-4">Current Room Status</h3>
          <div className="flex items-center gap-6">
            <div className="relative w-36 h-36 flex-shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="3.5"/>
                {/* Available */}
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#22c55e" strokeWidth="3.5"
                  strokeDasharray={`${(available/total)*100} ${100-(available/total)*100}`}
                  strokeDashoffset="0"/>
                {/* Occupied */}
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#3b82f6" strokeWidth="3.5"
                  strokeDasharray={`${(occupied/total)*100} ${100-(occupied/total)*100}`}
                  strokeDashoffset={`${-(available/total)*100}`}/>
                {/* Reserved */}
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f59e0b" strokeWidth="3.5"
                  strokeDasharray={`${(reserved/total)*100} ${100-(reserved/total)*100}`}
                  strokeDashoffset={`${-((available+occupied)/total)*100}`}/>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#0f1f3d]">{occupancyRate}%</div>
                  <div className="text-gray-400 text-xs">Occupied</div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {[['bg-green-500','Available',available],['bg-blue-500','Occupied',occupied],['bg-amber-500','Reserved',reserved],['bg-gray-400','Cleaning',cleaning]].map(([c,l,n]) => (
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
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
        <h3 className="font-bold text-[#0f1f3d] mb-4">Revenue by Room Type</h3>
        <div className="space-y-4">
          {revenueByType.map(rt => {
            const rev = rt.rooms.length * rt.rate
            const pct = totalRevenue > 0 ? (rev/totalRevenue)*100 : 0
            return (
              <div key={rt.type}>
                <div className="flex justify-between mb-1.5">
                  <span className="text-sm font-medium text-[#0f1f3d]">{rt.type} <span className="text-gray-400 font-normal">({rt.rooms.length} rooms · ₹{rt.rate}/night)</span></span>
                  <span className="text-sm font-bold text-[#0f1f3d]">₹{rev.toLocaleString()}</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#0f1f3d] to-[#1e3a5f] rounded-full transition-all duration-700" style={{width:`${pct}%`}}/>
                </div>
                <div className="text-xs text-gray-400 mt-0.5">{Math.round(pct)}% of room revenue</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Service Metrics */}
      <div className="bg-[#0f1f3d] rounded-2xl p-5">
        <h3 className="font-bold text-white mb-4">Service Performance</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[['Total Requests',serviceRequests.length,'text-white'],['Pending',serviceRequests.filter(r=>r.status==='requested').length,'text-orange-400'],['In Progress',serviceRequests.filter(r=>r.status==='acknowledged').length,'text-blue-400'],['Completed',serviceRequests.filter(r=>r.status==='completed').length,'text-green-400']].map(([l,v,c]) => (
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
