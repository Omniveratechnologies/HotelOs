import React, { createContext, useContext, useState } from 'react'

const HotelOSContext = createContext(null)

const initialRooms = [
  { id: '101', floor: 1, status: 'available', type: 'Standard', rate: 2500, guest: null, checkIn: null, checkOut: null },
  { id: '102', floor: 1, status: 'available', type: 'Standard', rate: 2500, guest: null, checkIn: null, checkOut: null },
  { id: '103', floor: 1, status: 'available', type: 'Standard', rate: 2500, guest: null, checkIn: null, checkOut: null },
  { id: '104', floor: 1, status: 'available', type: 'Deluxe', rate: 3500, guest: null, checkIn: null, checkOut: null },
  { id: '105', floor: 1, status: 'available', type: 'Deluxe', rate: 3500, guest: null, checkIn: null, checkOut: null },
  { id: '106', floor: 1, status: 'occupied', type: 'Suite', rate: 6000, guest: 'Rahul Mehta', checkIn: '2026-08-10', checkOut: '2026-08-15' },
  { id: '201', floor: 2, status: 'available', type: 'Standard', rate: 2500, guest: null, checkIn: null, checkOut: null },
  { id: '202', floor: 2, status: 'reserved', type: 'Standard', rate: 2500, guest: 'Priya Sharma', checkIn: '2026-08-14', checkOut: '2026-08-16' },
  { id: '203', floor: 2, status: 'available', type: 'Deluxe', rate: 3500, guest: null, checkIn: null, checkOut: null },
  { id: '204', floor: 2, status: 'occupied', type: 'Deluxe', rate: 3500, guest: 'Ansh Gupta', checkIn: '2026-08-12', checkOut: '2026-08-14' },
  { id: '205', floor: 2, status: 'occupied', type: 'Suite', rate: 6000, guest: 'Vikram Nair', checkIn: '2026-08-11', checkOut: '2026-08-16' },
  { id: '206', floor: 2, status: 'available', type: 'Suite', rate: 6000, guest: null, checkIn: null, checkOut: null },
  { id: '301', floor: 3, status: 'available', type: 'Standard', rate: 2500, guest: null, checkIn: null, checkOut: null },
  { id: '302', floor: 3, status: 'available', type: 'Standard', rate: 2500, guest: null, checkIn: null, checkOut: null },
  { id: '303', floor: 3, status: 'reserved', type: 'Deluxe', rate: 3500, guest: 'Meera Joshi', checkIn: '2026-08-15', checkOut: '2026-08-18' },
  { id: '304', floor: 3, status: 'occupied', type: 'Deluxe', rate: 3500, guest: 'Arjun Kapoor', checkIn: '2026-08-13', checkOut: '2026-08-17' },
  { id: '305', floor: 3, status: 'available', type: 'Suite', rate: 6000, guest: null, checkIn: null, checkOut: null },
  { id: '306', floor: 3, status: 'available', type: 'Suite', rate: 6000, guest: null, checkIn: null, checkOut: null },
]

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
  const [rooms, setRooms] = useState(initialRooms)
  const [serviceRequests, setServiceRequests] = useState(initialServiceRequests)
  const [foodOrders, setFoodOrders] = useState(initialFoodOrders)
  const [guests, setGuests] = useState(initialGuests)

  const updateRoomStatus = (roomId, newStatus, guestData = {}) => {
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, status: newStatus, ...guestData } : r))
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
        rooms, setRooms,
        serviceRequests, setServiceRequests,
        foodOrders, setFoodOrders,
        guests, setGuests,
        updateRoomStatus, acknowledgeRequest, completeRequest, updateOrderStatus,
      }}
    >
      {children}
    </HotelOSContext.Provider>
  )
}

export function useHotelOS() {
  return useContext(HotelOSContext)
}
