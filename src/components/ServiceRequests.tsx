import type { ServiceRequest, ServiceRequestType } from '../types';
import styles from './ServiceRequests.module.css';

interface ServiceRequestsProps {
  requests: ServiceRequest[];
  onAcknowledge: (id: string) => void;
}

const TYPE_LABELS: Record<ServiceRequestType, string> = {
  amenity: 'Amenity request',
  housekeeping: 'Housekeeping request',
  restaurant: 'Call restaurant',
};

const STATUS_COLORS: Record<string, string> = {
  requested: styles.statusRequested,
  acknowledged: styles.statusAcknowledged,
  completed: styles.statusCompleted,
};

export function ServiceRequests({ requests, onAcknowledge }: ServiceRequestsProps) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <span className={styles.accent} />
        <span className={styles.title}>SERVICE REQUESTS</span>
      </div>

      <div className={styles.list}>
        {requests.length === 0 && (
          <p className={styles.empty}>No service requests at the moment.</p>
        )}
        {requests.map((req) => (
          <div key={req.id} className={styles.item}>
            <div className={styles.info}>
              <div className={styles.roomType}>
                Room {req.roomNumber} · {TYPE_LABELS[req.type]}
              </div>
              <div className={styles.details}>{req.details}</div>
            </div>
            <div className={styles.right}>
              <span className={`${styles.badge} ${STATUS_COLORS[req.status]}`}>
                ● {req.status.toUpperCase()}
              </span>
              {req.status === 'requested' && (
                <button
                  className={styles.ackBtn}
                  onClick={() => onAcknowledge(req.id)}
                >
                  Acknowledge
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
