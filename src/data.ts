import type { Room, ServiceRequest, FoodOrder } from './types';

export const initialRooms: Room[] = [
  { id: 'r101', number: '101', floor: 1, status: 'available', ratePerNight: 3200 },
  { id: 'r102', number: '102', floor: 1, status: 'available', ratePerNight: 3200 },
  { id: 'r103', number: '103', floor: 1, status: 'available', ratePerNight: 3200 },
  { id: 'r104', number: '104', floor: 1, status: 'available', ratePerNight: 3200 },
  { id: 'r105', number: '105', floor: 1, status: 'available', ratePerNight: 3200 },
  { id: 'r106', number: '106', floor: 1, status: 'occupied', guestName: 'Ansh', guestPhone: '9876543210', guestCount: 2, nights: 1, idProof: 'AADHAAR-1234', checkInTime: '10:30 AM', ratePerNight: 4200 },
  { id: 'r201', number: '201', floor: 2, status: 'available', ratePerNight: 3800 },
  { id: 'r202', number: '202', floor: 2, status: 'reserved', ratePerNight: 3800 },
  { id: 'r203', number: '203', floor: 2, status: 'available', ratePerNight: 3800 },
  { id: 'r204', number: '204', floor: 2, status: 'occupied', guestName: 'Ansh', guestPhone: '9876543210', guestCount: 2, nights: 2, idProof: 'PASSPORT-AB1234', checkInTime: '09:15 AM', ratePerNight: 4200 },
  { id: 'r205', number: '205', floor: 2, status: 'occupied', guestName: 'Priya Sharma', guestPhone: '9812345678', guestCount: 1, nights: 3, idProof: 'AADHAAR-5678', checkInTime: '02:00 PM', ratePerNight: 3800 },
  { id: 'r206', number: '206', floor: 2, status: 'available', ratePerNight: 3800 },
  { id: 'r301', number: '301', floor: 3, status: 'available', ratePerNight: 5000 },
  { id: 'r302', number: '302', floor: 3, status: 'available', ratePerNight: 5000 },
  { id: 'r303', number: '303', floor: 3, status: 'reserved', ratePerNight: 5000 },
  { id: 'r304', number: '304', floor: 3, status: 'occupied', guestName: 'Rahul Mehta', guestPhone: '9900112233', guestCount: 3, nights: 2, idProof: 'AADHAAR-9900', checkInTime: '11:45 AM', ratePerNight: 5000 },
  { id: 'r305', number: '305', floor: 3, status: 'available', ratePerNight: 5000 },
  { id: 'r306', number: '306', floor: 3, status: 'available', ratePerNight: 5000 },
];

export const initialServiceRequests: ServiceRequest[] = [
  {
    id: 'sr1',
    roomNumber: '204',
    type: 'amenity',
    details: '1× Extra towels, 1× Extra pillows, 1× Toiletries kit',
    status: 'requested',
    timestamp: '10:05 AM',
  },
  {
    id: 'sr2',
    roomNumber: '204',
    type: 'housekeeping',
    details: 'Request housekeeping',
    status: 'requested',
    timestamp: '10:12 AM',
  },
  {
    id: 'sr3',
    roomNumber: '204',
    type: 'restaurant',
    details: 'Call restaurant',
    status: 'requested',
    timestamp: '10:20 AM',
  },
];

export const initialFoodOrders: FoodOrder[] = [
  {
    id: 'fo1',
    roomNumber: '204',
    items: ['1× Gulab Jamun'],
    payment: 'COD',
    status: 'out_for_delivery',
    timestamp: '10:30 AM',
  },
  {
    id: 'fo2',
    roomNumber: '204',
    items: ['1× Cold Coffee'],
    payment: 'COD',
    status: 'delivered',
    timestamp: '09:50 AM',
  },
];
