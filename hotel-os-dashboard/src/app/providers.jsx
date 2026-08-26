import React, { createContext, useContext, useEffect, useState } from 'react'

import {
  getRooms as fetchRoomsApi,
  createRoom as createRoomApi,
  updateRoom as updateRoomApi,
  deleteRoom as deleteRoomApi,
} from '../services/room.service.js'

const HotelOSContext = createContext(null)

// Map a backend room DTO onto the shape the UI expects
const normalizeRoom = (room) => ({
  id: room.id,
  roomNumber: room.roomNumber,
  floor: room.floor,
  type: room.type,
  status: room.status,
  rate: room.rate,
  guest: room.currentGuest || null,
  checkIn: room.checkIn ? String(room.checkIn).split('T')[0] : null,
  checkOut: room.checkOut ? String(room.checkOut).split('T')[0] : null,
})

const initialServiceRequests = [
  { id: 1, room: '204', type: 'Amenity request', detail: '1× Extra towels, 1× Extra pillows, 1× Toiletries kit', status: 'requested', time: '09:15 AM', priority: 'normal' },
  { id: 2, room: '204', type: 'Housekeeping request', detail: 'Request housekeeping', status: 'requested', time: '09:22 AM', priority: 'normal' },
  { id: 3, room: '204', type: 'Call restaurant', detail: 'Call restaurant', status: 'requested', time: '09:30 AM', priority: 'normal' },
  { id: 4, room: '106', type: 'Maintenance', detail: 'AC not cooling properly', status: 'in-progress', time: '08:45 AM', priority: 'high' },
  { id: 5, room: '205', type: 'Amenity request', detail: '2× Bath robes, 1× Extra blanket', status: 'completed', time: '07:30 AM', priority: 'normal' },
]

const initialFoodOrders = [
  { id: 1, room: '204', items: '1× Gulab Jamun', payment: 'COD', status: 'out-for-delivery', time: '09:10 AM', amount: 120 },
  { id: 2, room: '204', items: '1× Cold Coffee', payment: 'COD', status: 'delivered', time: '08:55 AM', amount: 180 },
  { id: 3, room: '106', items: '2× Paneer Butter Masala, 3× Roti', payment: 'UPI', status: 'preparing', time: '09:35 AM', amount: 640 },
  { id: 4, room: '205', items: '1× Masala Chai, 1× Samosa', payment: 'Room Charge', status: 'delivered', time: '08:20 AM', amount: 95 },
]

const initialGuests = [
  { id: 1, name: 'Rahul Mehta', room: '106', phone: '+91 98765 43210', email: 'rahul@email.com', checkIn: '2026-08-10', checkOut: '2026-08-15', idType: 'Aadhaar', nights: 5, status: 'checked-in' },
  { id: 2, name: 'Ansh Gupta', room: '204', phone: '+91 87654 32109', email: 'ansh@email.com', checkIn: '2026-08-12', checkOut: '2026-08-14', idType: 'PAN', nights: 2, status: 'checked-in' },
  { id: 3, name: 'Vikram Nair', room: '205', phone: '+91 76543 21098', email: 'vikram@email.com', checkIn: '2026-08-11', checkOut: '2026-08-16', idType: 'Passport', nights: 5, status: 'checked-in' },
  { id: 4, name: 'Arjun Kapoor', room: '304', phone: '+91 65432 10987', email: 'arjun@email.com', checkIn: '2026-08-13', checkOut: '2026-08-17', idType: 'Aadhaar', nights: 4, status: 'checked-in' },
  { id: 5, name: 'Priya Sharma', room: '202', phone: '+91 54321 09876', email: 'priya@email.com', checkIn: '2026-08-14', checkOut: '2026-08-16', idType: 'Aadhaar', nights: 2, status: 'reserved' },
  { id: 6, name: 'Meera Joshi', room: '303', phone: '+91 43210 98765', email: 'meera@email.com', checkIn: '2026-08-15', checkOut: '2026-08-18', idType: 'PAN', nights: 3, status: 'reserved' },
]

export function HotelOSProvider({ children }) {
  const [chatOpen, setChatOpen] = useState(false)
  const [rooms, setRooms] = useState([])
  const [roomsLoading, setRoomsLoading] = useState(true)
  const [roomsError, setRoomsError] = useState('')
  const [serviceRequests, setServiceRequests] = useState(initialServiceRequests)
  const [foodOrders, setFoodOrders] = useState(initialFoodOrders)
  const [guests, setGuests] = useState(initialGuests)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const data = await fetchRoomsApi()
        if (!cancelled) {
          setRooms(data.map(normalizeRoom))
          setRoomsError('')
        }
      } catch (err) {
        console.error('Failed to load rooms:', err)
        if (!cancelled) setRoomsError(err.message || 'Failed to load rooms')
      } finally {
        if (!cancelled) setRoomsLoading(false)
      }
    }

    load()

    return () => { cancelled = true }
  }, [])

  // Persist a status (and any occupancy display fields) to the backend
  const updateRoomStatus = async (roomId, newStatus, guestData = {}) => {
    const body = { status: newStatus }

    if ('guest' in guestData) body.currentGuest = guestData.guest || ''
    if ('checkIn' in guestData) body.checkIn = guestData.checkIn || null
    if ('checkOut' in guestData) body.checkOut = guestData.checkOut || null

    try {
      const updated = await updateRoomApi(roomId, body)
      setRooms(prev => prev.map(r => (r.id === roomId ? normalizeRoom(updated) : r)))
    } catch (err) {
      console.error('Failed to update room:', err)
      throw err
    }
  }

  const addRoom = async ({ roomNumber, type, rate, floor }) => {
    const created = await createRoomApi({ roomNumber, type, rate, floor })
    setRooms(prev => [...prev, normalizeRoom(created)])
    return normalizeRoom(created)
  }

  const removeRoom = async (roomId) => {
    await deleteRoomApi(roomId)
    setRooms(prev => prev.filter(r => r.id !== roomId))
  }

  const acknowledgeRequest = (id) => {
    setServiceRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'acknowledged' } : r))
  }

  const completeRequest = (id) => {
    setServiceRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'completed' } : r))
  }

  const updateOrderStatus = (id, status) => {
    setFoodOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
  }

  return (
    <HotelOSContext.Provider
      value={{
        chatOpen, setChatOpen,
        rooms, setRooms, roomsLoading, roomsError,
        serviceRequests, setServiceRequests,
        foodOrders, setFoodOrders,
        guests, setGuests,
        updateRoomStatus, addRoom, removeRoom,
        acknowledgeRequest, completeRequest, updateOrderStatus,
      }}
    >
      {children}
    </HotelOSContext.Provider>
  )
}

export function useHotelOS() {
  return useContext(HotelOSContext)
}
