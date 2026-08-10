import type { Room, RoomStatus } from '../types';
import styles from './RoomGrid.module.css';

interface RoomGridProps {
  rooms: Room[];
  onRoomClick: (room: Room) => void;
}

const STATUS_LABELS: Record<RoomStatus, string> = {
  available: 'AVAILABLE',
  occupied: 'OCCUPIED',
  reserved: 'RESERVED',
  cleaning: 'NEEDS CLEANING',
};

export function RoomGrid({ rooms, onRoomClick }: RoomGridProps) {
  const floors = [...new Set(rooms.map((r) => r.floor))].sort();

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <span className={styles.accent} />
        <span className={styles.title}>ROOM GRID — TAP A ROOM TO ASSIGN, CHECK IN OR CHECK OUT</span>
      </div>

      <div className={styles.grid}>
        {rooms.map((room) => (
          <button
            key={room.id}
            className={`${styles.roomCard} ${styles[room.status]}`}
            onClick={() => onRoomClick(room)}
          >
            <div className={styles.roomIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="7" width="20" height="14" rx="2" />
                <path d="M2 12h20" />
                <path d="M7 12V7" />
              </svg>
            </div>
            <div className={styles.roomNumber}>{room.number}</div>
            <div className={styles.roomStatus}>{room.status === 'occupied' && room.guestName ? room.guestName.split(' ')[0].toUpperCase() : STATUS_LABELS[room.status]}</div>
            <div className={`${styles.statusBar} ${styles[`bar_${room.status}`]}`} />
          </button>
        ))}
      </div>

      <div className={styles.legend}>
        <span className={`${styles.dot} ${styles.dot_available}`} /> Available
        <span className={`${styles.dot} ${styles.dot_occupied}`} /> Occupied
        <span className={`${styles.dot} ${styles.dot_reserved}`} /> Reserved
        <span className={`${styles.dot} ${styles.dot_cleaning}`} /> Needs cleaning
      </div>
    </div>
  );
}
