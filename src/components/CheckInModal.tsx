import { useState } from 'react';
import type { CheckInFormData } from '../types';
import styles from './CheckInModal.module.css';

interface CheckInModalProps {
  roomNumber: string;
  onConfirm: (data: CheckInFormData) => void;
  onClose: () => void;
}

export function CheckInModal({ roomNumber, onConfirm, onClose }: CheckInModalProps) {
  const [form, setForm] = useState<CheckInFormData>({
    guestName: '',
    phone: '',
    guests: 1,
    nights: 1,
    idProof: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.guestName.trim() || !form.phone.trim() || !form.idProof.trim()) return;
    onConfirm(form);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.topBar} />
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Check in — Room {roomNumber}</h2>
            <p className={styles.subtitle}>ENTER GUEST DETAILS TO OCCUPY THIS ROOM</p>
          </div>
          <button className={styles.close} onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>GUEST NAME</label>
              <input
                className={styles.input}
                placeholder="Full name"
                value={form.guestName}
                onChange={(e) => setForm({ ...form, guestName: e.target.value })}
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>PHONE</label>
              <input
                className={styles.input}
                placeholder="10-digit number"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                maxLength={10}
                required
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>GUESTS</label>
              <input
                className={styles.input}
                type="number"
                min={1}
                max={10}
                value={form.guests}
                onChange={(e) => setForm({ ...form, guests: Number(e.target.value) })}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>NIGHTS</label>
              <input
                className={styles.input}
                type="number"
                min={1}
                max={365}
                value={form.nights}
                onChange={(e) => setForm({ ...form, nights: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>ID PROOF</label>
            <input
              className={styles.input}
              placeholder="Aadhaar / Passport no."
              value={form.idProof}
              onChange={(e) => setForm({ ...form, idProof: e.target.value })}
              required
            />
          </div>

          <button type="submit" className={styles.confirmBtn}>CONFIRM CHECK-IN</button>
        </form>
      </div>
    </div>
  );
}
