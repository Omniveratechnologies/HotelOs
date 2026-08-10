import type { FoodOrder, OrderStatus } from '../types';
import styles from './FoodOrders.module.css';

interface FoodOrdersProps {
  orders: FoodOrder[];
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; className: string }> = {
  new: { label: 'NEW', className: styles.statusNew },
  preparing: { label: 'PREPARING', className: styles.statusPreparing },
  ready: { label: 'READY', className: styles.statusReady },
  out_for_delivery: { label: 'OUT FOR DELIVERY', className: styles.statusDelivery },
  delivered: { label: 'DELIVERED', className: styles.statusDelivered },
};

export function FoodOrders({ orders }: FoodOrdersProps) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <span className={styles.accent} />
        <span className={styles.title}>LIVE FOOD ORDERS</span>
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>ROOM</th>
            <th className={styles.th}>ITEMS</th>
            <th className={styles.th}>PAYMENT</th>
            <th className={styles.th}>STATUS</th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 && (
            <tr>
              <td colSpan={4} className={styles.empty}>No active food orders.</td>
            </tr>
          )}
          {orders.map((order) => {
            const sc = STATUS_CONFIG[order.status];
            return (
              <tr key={order.id} className={styles.row}>
                <td className={styles.td}>{order.roomNumber}</td>
                <td className={styles.td}>{order.items.join(', ')}</td>
                <td className={styles.td}>{order.payment}</td>
                <td className={styles.td}>
                  <span className={`${styles.badge} ${sc.className}`}>
                    ● {sc.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
