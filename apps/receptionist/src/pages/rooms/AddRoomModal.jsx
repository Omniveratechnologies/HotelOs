import React, { useState } from 'react'

export default function AddRoomModal({ onClose, onAdd }) {
  const [roomNumber, setRoomNumber] = useState('')
  const [floor, setFloor] = useState(1)
  const [type, setType] = useState('Standard')
  const [rate, setRate] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!roomNumber.trim()) {
      setError('Room number is required.')
      return
    }

    if (!rate || Number(rate) <= 0) {
      setError('Please enter a valid rate.')
      return
    }

    try {
      setSaving(true)
      await onAdd({ roomNumber: roomNumber.trim(), type, rate: Number(rate), floor: Number(floor) })
      onClose()
    } catch (err) {
      console.error('Failed to create room:', err)
      setError(err.message || 'Failed to create room.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-[#0f1f3d] rounded-t-2xl p-5 flex items-center justify-between">
          <div>
            <div className="text-[#c9a84c] text-xs font-semibold uppercase tracking-widest">Add Room</div>
            <div className="text-white font-bold text-lg mt-0.5">Create a New Room</div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Room Number *</label>
            <input
              value={roomNumber}
              onChange={e => setRoomNumber(e.target.value)}
              placeholder="e.g. 101"
              autoFocus
              disabled={saving}
              className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#c9a84c]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Floor *</label>
            <input
              type="number"
              min="0"
              value={floor}
              onChange={e => setFloor(e.target.value)}
              disabled={saving}
              className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#c9a84c]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Type *</label>
              <select
                value={type}
                onChange={e => setType(e.target.value)}
                disabled={saving}
                className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#c9a84c]"
              >
                <option>Standard</option><option>Deluxe</option><option>Suite</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Rate / Night *</label>
              <input
                type="number"
                min="0"
                value={rate}
                onChange={e => setRate(e.target.value)}
                placeholder="₹2500"
                disabled={saving}
                className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#c9a84c]"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">{error}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={saving} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-[#0f1f3d] text-white rounded-xl text-sm font-semibold hover:bg-[#162847] transition-colors">
              {saving ? 'Creating...' : 'Create Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
