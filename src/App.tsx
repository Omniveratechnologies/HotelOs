import { useState, useMemo } from 'react';
import './theme.css';
import './App.css';

import type { Room, ServiceRequest, CheckInFormData } from './types';
import { initialRooms, initialServiceRequests, initialFoodOrders } from './data';

import { Header } from './components/Header';
import { StatsCards } from './components/StatsCards';
import { RoomGrid } from './components/RoomGrid';
import { ServiceRequests } from './components/ServiceRequests';
import { FoodOrders } from './components/FoodOrders';
import { CheckInModal } from './components/CheckInModal';
import { CheckOutModal } from './components/CheckOutModal';

type ModalState =
  | { type: 'none' }
  | { type: 'checkin'; room: Room }
  | { type: 'checkout'; room: Room };

export default function App() {
  const [rooms, setRooms] = useState(initialRooms);
  const [serviceRequests, setServiceRequests] = useState(initialServiceRequests);
  const [foodOrders] = useState(initialFoodOrders);
  const [modal, setModal] = useState<ModalState>({ type: 'none' });

  const stats = useMemo(() => {
    const occupied = rooms.filter((r) => r.status === 'occupied').length;
    const available = rooms.filter((r) => r.status === 'available').length;
    const pending = serviceRequests.filter((r) => r.status === 'requested').length;
    const activeOrders = foodOrders.filter((o) => o.status !== 'delivered').length;
    return {
      occupiedRooms: occupied,
      availableRooms: available,
      totalRooms: rooms.length,
      pendingRequests: pending,
      activeFoodOrders: activeOrders,
    };
  }, [rooms, serviceRequests, foodOrders]);

  const handleRoomClick = (room: Room) => {
    if (room.status === 'available') {
      setModal({ type: 'checkin', room });
    } else if (room.status === 'occupied') {
      setModal({ type: 'checkout', room });
    }
  };

  const handleCheckIn = (data: CheckInFormData) => {
    if (modal.type !== 'checkin') return;
    const roomId = modal.room.id;
    setRooms((prev) =>
      prev.map((r) =>
        r.id === roomId
          ? {
              ...r,
              status: 'occupied',
              guestName: data.guestName,
              guestPhone: data.phone,
              guestCount: data.guests,
              nights: data.nights,
              idProof: data.idProof,
              checkInTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            }
          : r
      )
    );
    setModal({ type: 'none' });
  };

  const handleCheckOut = () => {
    if (modal.type !== 'checkout') return;
    const roomId = modal.room.id;
    setRooms((prev) =>
      prev.map((r) =>
        r.id === roomId
          ? {
              ...r,
              status: 'cleaning',
              guestName: undefined,
              guestPhone: undefined,
              guestCount: undefined,
              nights: undefined,
              idProof: undefined,
              checkInTime: undefined,
            }
          : r
      )
    );
    setModal({ type: 'none' });
  };

  const handleAcknowledge = (id: string) => {
    setServiceRequests((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: 'acknowledged' as const } : r
      )
    );
  };

  return (
    <div className="appRoot">
      <Header />

      <div className="goldBar" />

      <main className="main">
        <StatsCards stats={stats} />

        <div className="contentGrid">
          <div className="leftCol">
            <RoomGrid rooms={rooms} onRoomClick={handleRoomClick} />
            <FoodOrders orders={foodOrders} />
          </div>
          <div className="rightCol">
            <ServiceRequests requests={serviceRequests} onAcknowledge={handleAcknowledge} />
          </div>
        </div>
      </main>

      {modal.type === 'checkin' && (
        <CheckInModal
          roomNumber={modal.room.number}
          onConfirm={handleCheckIn}
          onClose={() => setModal({ type: 'none' })}
        />
      )}

      {modal.type === 'checkout' && (
        <CheckOutModal
          room={modal.room}
          onCheckOut={handleCheckOut}
          onClose={() => setModal({ type: 'none' })}
        />
      )}
    </div>
  );
}
