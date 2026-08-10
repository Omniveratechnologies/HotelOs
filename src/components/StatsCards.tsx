import type { DashboardStats } from '../types';
import styles from './StatsCards.module.css';

interface StatsCardsProps {
  stats: DashboardStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    { icon: '🏠', value: stats.occupiedRooms, label: 'OCCUPIED ROOMS' },
    { icon: '🛎️', value: stats.availableRooms, label: 'AVAILABLE ROOMS' },
    { icon: '🏨', value: stats.totalRooms, label: 'TOTAL ROOMS' },
    { icon: '⏰', value: stats.pendingRequests, label: 'PENDING REQUESTS' },
    { icon: '🍽️', value: stats.activeFoodOrders, label: 'ACTIVE FOOD ORDERS' },
  ];

  return (
    <div className={styles.grid}>
      {cards.map((card) => (
        <div key={card.label} className={styles.card}>
          <div className={styles.icon}>{card.icon}</div>
          <div className={styles.value}>{card.value}</div>
          <div className={styles.label}>{card.label}</div>
        </div>
      ))}
    </div>
  );
}
