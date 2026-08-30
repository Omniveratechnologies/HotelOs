import React, { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { clearAuth, getStoredUser } from '../services/auth.service.js'
import { useHotelOS } from '../app/providers.jsx'

const icons = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  rooms: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  guests: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
    </svg>
  ),
  food: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3"/>
    </svg>
  ),
  housekeeping: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
      <polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
  reports: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.07 4.93l-1.42 1.42M4.93 19.07l1.42-1.42M20 12h2M2 12h2M19.07 19.07l-1.42-1.42M4.93 4.93l1.42 1.42M12 20v2M12 2v2"/>
    </svg>
  ),
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', path: '/' },
  { id: 'rooms', label: 'Rooms', path: '/rooms' },
  { id: 'guests', label: 'Guests', path: '/guests' },
  { id: 'food', label: 'Food Orders', path: '/food' },
  { id: 'housekeeping', label: 'Housekeeping', path: '/housekeeping' },
  { id: 'reports', label: 'Reports', path: '/reports' },
  { id: 'settings', label: 'Settings', path: '/settings' },
]

export default function Sidebar({ rooms, serviceRequests }) {
  const [collapsed, setCollapsed] = useState(false)
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { stats } = useHotelOS()

  const user = useMemo(() => getStoredUser() || {}, [])
  const hotelName = stats?.hotelName || 'Grand Residency'
  const displayName = user.name || 'Receptionist'
  const initials = displayName.trim()[0]?.toUpperCase() || 'R'

  const handleLogout = () => {
    clearAuth()
    navigate('/login', { replace: true })
  }
  const pendingRequests = serviceRequests.filter(r => r.status === 'requested').length
  const occupiedRooms = rooms.filter(r => r.status === 'occupied').length

  return (
    <aside className={`${collapsed ? 'w-16' : 'w-56'} transition-all duration-300 bg-[#0f1f3d] flex flex-col h-full relative`}>
      {/* Logo */}
      <div className="px-4 py-5 border-b border-white/10 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#c9a84c] flex items-center justify-center flex-shrink-0">
          <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
          </svg>
        </div>
        {!collapsed && (
          <div>
            <div className="text-white font-bold text-sm font-display tracking-wide">HotelOS</div>
            <div className="text-[#c9a84c] text-xs truncate">{hotelName}</div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto text-white/40 hover:text-white transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            {collapsed ? <polyline points="9 18 15 12 9 6"/> : <polyline points="15 18 9 12 15 6"/>}
          </svg>
        </button>
      </div>

      {/* Stats Strip */}
      {!collapsed && (
        <div className="mx-3 mt-3 bg-white/5 rounded-xl p-3 flex gap-3">
          <div className="text-center flex-1">
            <div className="text-[#c9a84c] font-bold text-lg leading-none">{occupiedRooms}</div>
            <div className="text-white/40 text-[10px] mt-0.5">Occupied</div>
          </div>
          <div className="w-px bg-white/10"/>
          <div className="text-center flex-1">
            <div className="text-[#c9a84c] font-bold text-lg leading-none">{pendingRequests}</div>
            <div className="text-white/40 text-[10px] mt-0.5">Pending</div>
          </div>
          <div className="w-px bg-white/10"/>
          <div className="text-center flex-1">
            <div className="text-green-400 font-bold text-lg leading-none">{rooms.filter(r=>r.status==='available').length}</div>
            <div className="text-white/40 text-[10px] mt-0.5">Free</div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navItems.map(item => (
          <Link
            key={item.id}
            to={item.path}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 relative group
              ${pathname === item.path
                ? 'bg-[#c9a84c] text-[#0f1f3d]'
                : 'text-white/60 hover:text-white hover:bg-white/8'
              }`}
          >
            <span className="flex-shrink-0">{icons[item.id]}</span>
            {!collapsed && <span>{item.label}</span>}
            {item.id === 'housekeeping' && pendingRequests > 0 && (
              <span className={`ml-auto text-xs font-bold px-1.5 py-0.5 rounded-full ${pathname === item.path ? 'bg-[#0f1f3d] text-[#c9a84c]' : 'bg-red-500 text-white'}`}>
                {pendingRequests}
              </span>
            )}
            {collapsed && (
              <span className="absolute left-full ml-2 px-2 py-1 bg-[#1e3a5f] text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                {item.label}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#c9a84c] flex items-center justify-center text-[#0f1f3d] font-bold text-sm flex-shrink-0">{initials}</div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-white text-xs font-medium truncate">{displayName}</div>
              <div className="text-white/40 text-[10px]">Receptionist</div>
            </div>
          )}
          <button
            onClick={handleLogout}
            title="Log out"
            className={`text-white/40 hover:text-white transition-colors ${collapsed ? 'mx-auto' : ''}`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
            {!collapsed && <span className="sr-only">Log out</span>}
          </button>
        </div>
      </div>
    </aside>
  )
}
