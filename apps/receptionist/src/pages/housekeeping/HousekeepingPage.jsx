import React, { useState } from 'react'
import { useHotelOS } from '../../app/providers.jsx'

export default function HousekeepingPage() {
  const { serviceRequests, setServiceRequests, rooms, acknowledgeRequest, completeRequest } = useHotelOS()
  const [filter, setFilter] = useState('all')
  const [showNew, setShowNew] = useState(false)
  const [newReq, setNewReq] = useState({ room: '', type: 'Housekeeping request', detail: '', priority: 'normal' })

  const filtered = filter === 'all' ? serviceRequests : serviceRequests.filter(r => r.status === filter)

  const statusBadge = {
    requested: 'bg-orange-100 text-orange-700',
    acknowledged: 'bg-blue-100 text-blue-700',
    'in-progress': 'bg-purple-100 text-purple-700',
    completed: 'bg-green-100 text-green-700',
  }

  const typeIcon = {
    'Housekeeping request': '🧹',
    'Amenity request': '🛁',
    'Maintenance': '🔧',
    'Call restaurant': '📞',
    'Laundry': '👕',
    'Other': '📝',
  }

  const addRequest = () => {
    if (!newReq.room || !newReq.detail) return
    setServiceRequests(prev => [{
      id: Date.now(), ...newReq, status: 'requested',
      time: new Date().toLocaleTimeString('en-IN', {hour:'2-digit',minute:'2-digit'})
    }, ...prev])
    setShowNew(false)
    setNewReq({ room: '', type: 'Housekeeping request', detail: '', priority: 'normal' })
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0f1f3d] font-display">Housekeeping & Requests</h1>
          <p className="text-gray-500 text-sm">{serviceRequests.filter(r=>r.status==='requested').length} pending · {serviceRequests.filter(r=>r.status==='completed').length} completed today</p>
        </div>
        <button onClick={() => setShowNew(true)} className="px-4 py-2 bg-[#0f1f3d] text-white text-sm rounded-xl font-medium hover:bg-[#162847] transition-colors">+ New Request</button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[['Pending','requested','bg-orange-50 border-orange-200 text-orange-600','🔔'],
          ['Acknowledged','acknowledged','bg-blue-50 border-blue-200 text-blue-600','👁'],
          ['In Progress','in-progress','bg-purple-50 border-purple-200 text-purple-600','⚡'],
          ['Completed','completed','bg-green-50 border-green-200 text-green-600','✅']
        ].map(([label, key, cls, icon]) => (
          <div key={label} className={`rounded-2xl p-4 border ${cls.split(' ')[0]} ${cls.split(' ')[1]}`}>
            <div className="text-2xl mb-1">{icon}</div>
            <div className={`text-2xl font-bold ${cls.split(' ')[2]}`}>{serviceRequests.filter(r=>r.status===key).length}</div>
            <div className="text-gray-500 text-xs mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Needs Cleaning Rooms */}
      {rooms.filter(r=>r.status==='cleaning').length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🧹</span>
            <h3 className="font-bold text-amber-700">Rooms Needing Cleaning</h3>
          </div>
          <div className="flex gap-2 flex-wrap">
            {rooms.filter(r=>r.status==='cleaning').map(r => (
              <span key={r.id} className="bg-amber-100 text-amber-700 text-sm font-bold px-3 py-1 rounded-full">Room {r.id}</span>
            ))}
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex bg-gray-100 rounded-xl p-1 gap-1 w-fit mb-4">
        {['all','requested','acknowledged','in-progress','completed'].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${filter === s ? 'bg-white text-[#0f1f3d] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {s.replace('-',' ')}
          </button>
        ))}
      </div>

      {/* Requests */}
      <div className="space-y-3">
        {filtered.map(req => (
          <div key={req.id} className={`bg-white rounded-2xl border shadow-sm p-4 ${req.priority === 'high' ? 'border-red-200' : 'border-gray-100'}`}>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-xl flex-shrink-0">
                {typeIcon[req.type] || '📝'}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#0f1f3d]">Room {req.room}</span>
                      <span className="text-gray-400">·</span>
                      <span className="font-semibold text-[#0f1f3d] text-sm">{req.type}</span>
                      {req.priority === 'high' && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">URGENT</span>}
                    </div>
                    <p className="text-gray-600 text-sm mt-1">{req.detail}</p>
                    <div className="text-gray-400 text-xs mt-1">{req.time}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${statusBadge[req.status]}`}>
                      {req.status.replace('-',' ').toUpperCase()}
                    </span>
                    {req.status === 'requested' && (
                      <button onClick={() => acknowledgeRequest(req.id)} className="text-xs bg-[#0f1f3d] text-white px-3 py-1.5 rounded-lg hover:bg-[#162847] transition-colors">
                        Acknowledge
                      </button>
                    )}
                    {req.status === 'acknowledged' && (
                      <button onClick={() => completeRequest(req.id)} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors">
                        Mark Complete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="text-center py-16 text-gray-400">No requests found</div>}
      </div>

      {showNew && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowNew(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-[#0f1f3d] text-lg mb-4">New Service Request</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Room</label>
                <select value={newReq.room} onChange={e => setNewReq(p=>({...p,room:e.target.value}))} className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#c9a84c]">
                  <option value="">Select Room</option>
                  {rooms.filter(r=>r.status==='occupied').map(r => <option key={r.id} value={r.id}>Room {r.id} – {r.guest}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</label>
                <select value={newReq.type} onChange={e => setNewReq(p=>({...p,type:e.target.value}))} className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#c9a84c]">
                  {Object.keys(typeIcon).map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Details</label>
                <textarea value={newReq.detail} onChange={e => setNewReq(p=>({...p,detail:e.target.value}))} rows={3} className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#c9a84c] resize-none" placeholder="Describe the request..."/>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Priority</label>
                <div className="flex gap-2 mt-1">
                  {['normal','high'].map(p => (
                    <button key={p} onClick={() => setNewReq(prev=>({...prev,priority:p}))} className={`flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${newReq.priority===p ? (p==='high' ? 'border-red-500 bg-red-50 text-red-600' : 'border-[#0f1f3d] bg-[#0f1f3d]/5 text-[#0f1f3d]') : 'border-gray-200 text-gray-500'}`}>
                      {p === 'high' ? '🚨 Urgent' : '📋 Normal'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowNew(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={addRequest} className="flex-1 py-2.5 bg-[#0f1f3d] text-white rounded-xl text-sm font-semibold hover:bg-[#162847] transition-colors">Create Request</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
