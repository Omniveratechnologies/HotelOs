import type { Room } from '../types';
import styles from './CheckOutModal.module.css';

interface CheckOutModalProps {
  room: Room;
  onCheckOut: () => void;
  onClose: () => void;
}

export function CheckOutModal({ room, onCheckOut, onClose }: CheckOutModalProps) {
  const roomCharges = (room.ratePerNight ?? 0) * (room.nights ?? 1);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.topBar} />
        <div className={styles.header}>
          <h2 className={styles.title}>
            Room {room.number} — {room.guestName}
          </h2>
          <button className={styles.close} onClick={onClose}>×</button>
        </div>

        <div className={styles.body}>
          <div className={styles.billRow}>
            <span className={styles.billItem}>
              Room charges ({room.nights} {(room.nights ?? 1) > 1 ? 'nights' : 'night'})
            </span>
            <span className={styles.billAmount}>₹{roomCharges.toLocaleString('en-IN')}</span>
          </div>

          <div className={styles.divider} />

          <div className={`${styles.billRow} ${styles.totalRow}`}>
            <span className={styles.totalLabel}>Total due</span>
            <span className={styles.totalAmount}>₹{roomCharges.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.closeBtn} onClick={onClose}>CLOSE</button>
          <button className={styles.checkoutBtn} onClick={onCheckOut}>CHECK OUT & SETTLE</button>
        </div>
      </div>
    </div>
  );
}
