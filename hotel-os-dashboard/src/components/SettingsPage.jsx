import React, { useState } from 'react'

export default function SettingsPage() {
  const [hotel, setHotel] = useState({ name: 'Grand Residency Hotel', address: 'Park Street, Kolkata, WB 700016', phone: '+91 33 4000 5000', email: 'info@grandresidency.in', gst: '19AAAAA0000A1Z5', checkIn: '14:00', checkOut: '12:00' })
  const [notifs, setNotifs] = useState({ newBooking: true, checkIn: true, checkOut: true, foodOrder: true, serviceRequest: true, lowOccupancy: false })
  const [saved, setSaved] = useState(false)

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  const sections = [
    {
      title: 'Hotel Information',
      icon: '🏨',
      content: (
        <div className="grid grid-cols-2 gap-4">
          {[['name','Hotel Name'],['address','Address'],['phone','Phone'],['email','Email'],['gst','GST Number'],['checkIn','Check-in Time'],['checkOut','Check-out Time']].map(([k,l]) => (
            <div key={k} className={k === 'address' ? 'col-span-2' : ''}>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{l}</label>
              <input value={hotel[k]} onChange={e => setHotel(p=>({...p,[k]:e.target.value}))}
                className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c]"/>
            </div>
          ))}
        </div>
      )
    },
    {
      title: 'Notifications',
      icon: '🔔',
      content: (
        <div className="space-y-3">
          {Object.entries(notifs).map(([k, v]) => (
            <div key={k} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div>
                <div className="font-medium text-[#0f1f3d] text-sm capitalize">{k.replace(/([A-Z])/g,' $1').trim()}</div>
                <div className="text-gray-400 text-xs">Receive alerts for this event</div>
              </div>
              <button onClick={() => setNotifs(p=>({...p,[k]:!v}))}
                className={`w-12 h-6 rounded-full transition-all duration-200 relative ${v ? 'bg-[#0f1f3d]' : 'bg-gray-200'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow absolute top-0.5 transition-all duration-200 ${v ? 'left-6' : 'left-0.5'}`}/>
              </button>
            </div>
          ))}
        </div>
      )
    },
    {
      title: 'Staff Accounts',
      icon: '👥',
      content: (
        <div>
          <div className="space-y-3 mb-4">
            {[{name:'Receptionist A',role:'Front Desk',email:'recep@hotel.in'},
              {name:'Manager',role:'General Manager',email:'manager@hotel.in'},
              {name:'Housekeeping Lead',role:'Housekeeping',email:'hk@hotel.in'}
            ].map(s => (
              <div key={s.name} className="flex items-center justify-between py-3 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#0f1f3d] flex items-center justify-center text-white font-bold text-sm">{s.name[0]}</div>
                  <div>
                    <div className="font-medium text-[#0f1f3d] text-sm">{s.name}</div>
                    <div className="text-gray-400 text-xs">{s.role} · {s.email}</div>
                  </div>
                </div>
                <button className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">Edit</button>
              </div>
            ))}
          </div>
          <button className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-[#c9a84c] hover:text-[#c9a84c] transition-colors">+ Add Staff Member</button>
        </div>
      )
    },
    {
      title: 'Room Rates',
      icon: '💰',
      content: (
        <div className="space-y-3">
          {[['Standard','2500'],['Deluxe','3500'],['Suite','6000']].map(([type, rate]) => (
            <div key={type} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
              <span className="font-semibold text-[#0f1f3d]">{type}</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm">₹</span>
                <input defaultValue={rate} className="w-24 text-right px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-bold text-[#0f1f3d] focus:outline-none focus:border-[#c9a84c]"/>
                <span className="text-gray-400 text-sm">/night</span>
              </div>
            </div>
          ))}
        </div>
      )
    },
  ]

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0f1f3d] font-display">Settings</h1>
          <p className="text-gray-500 text-sm">Configure your HotelOS</p>
        </div>
        <button onClick={save} className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${saved ? 'bg-green-600 text-white' : 'bg-[#0f1f3d] text-white hover:bg-[#162847]'}`}>
          {saved ? '✓ Saved!' : 'Save Changes'}
        </button>
      </div>
      <div className="space-y-5">
        {sections.map(s => (
          <div key={s.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-[#0f1f3d] flex items-center gap-2 mb-4">
              <span>{s.icon}</span> {s.title}
            </h3>
            {s.content}
          </div>
        ))}
      </div>
    </div>
  )
}
