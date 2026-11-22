import { Check, Clock3, Utensils } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../services/api";
import { formatMoney, PageHeader } from "../components/Layout";
import { useOrders } from "../context/OrdersContext";
import type { Order } from "../types";

const stages = [
  ["NEW", "Order Placed"],
  ["CONFIRMED", "Confirmed"],
  ["PREPARING", "Preparing"],
  ["READY", "Ready"],
  ["DELIVERED", "Served"],
] as const;

function stageIndex(status: string) {
  if (status === "OUT_FOR_DELIVERY") return 4;
  const index = stages.findIndex(([value]) => value === status);
  return index < 0 ? 0 : index;
}

export default function Tracking() {
  const { orderId: routeOrderId = "" } = useParams();
  const { orders, latestOrder } = useOrders();
  const effectiveOrderId = routeOrderId || latestOrder?.id || "";

  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!effectiveOrderId) return;
    let active = true;
    const poll = () =>
      api
        .getOrder(effectiveOrderId)
        .then((value) => active && setOrder(value))
        .catch((err: Error) => active && setError(err.message));
    poll();
    const interval = window.setInterval(poll, 5000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [effectiveOrderId]);

  if (!effectiveOrderId) {
    return (
      <main className="page">
        <PageHeader title="Order Tracking" />
        <section className="empty">
          <Utensils
            size={40}
            style={{ margin: "0 auto 16px", color: "var(--accent)" }}
          />
          <h2>No orders yet</h2>
          <p>You haven't placed any food orders in this session yet.</p>
          <Link
            className="button primary"
            to="../menu"
            style={{ marginTop: 16 }}
          >
            Browse Menu
          </Link>
        </section>
      </main>
    );
  }

  if (error)
    return (
      <main className="page">
        <PageHeader title="Order Tracking" />
        <section className="empty">
          <h2>Order unavailable</h2>
          <p>{error}</p>
        </section>
      </main>
    );

  if (!order)
    return <main className="page loading">Loading your order...</main>;

  const current = stageIndex(order.status);
  const statusLabel = stages[current]?.[1] ?? order.status;

  return (
    <main className="page tracking-page">
      <PageHeader title={`Order #${order.id.slice(-6).toUpperCase()}`} />

      {/* Multi-Order Switcher Bar */}
      {orders.length > 1 && (
        <div className="order-switcher-bar">
          {orders.map((o, idx) => (
            <Link
              key={o.id}
              to={`../order/${o.id}`}
              className={`order-switch-chip ${o.id === order.id ? "active" : ""}`}
            >
              <span className="chip-title">Round {orders.length - idx}</span>
              <span className="chip-badge">
                #{o.id.slice(-4).toUpperCase()} ·{" "}
                {stages[stageIndex(o.status)]?.[1] || o.status}
              </span>
            </Link>
          ))}
        </div>
      )}

      <section className="tracking-hero">
        <span className="status-pill">{statusLabel}</span>
        <p>Estimated time: 15–20 minutes</p>
      </section>
      <div className="timeline">
        {stages.map(([value, label], index) => (
          <div
            className={`timeline-step ${index < current ? "complete" : ""} ${index === current ? "current" : ""}`}
            key={value}
          >
            <span>
              {index < current ? (
                <Check size={15} />
              ) : index === current ? (
                <Clock3 size={15} />
              ) : (
                ""
              )}
            </span>
            <div>
              <strong>{label}</strong>
              {index <= current && (
                <small>
                  {index === current
                    ? "Your food is being prepared"
                    : order.createdAt
                      ? new Date(order.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Completed"}
                </small>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Ordered items breakdown */}
      {Array.isArray(order.items) && order.items.length > 0 && (
        <section className="tracking-items-card">
          <h3>
            Items in this order (
            {order.items.reduce((s, it) => s + (it.quantity || 1), 0)})
          </h3>
          <div className="tracking-items-list">
            {order.items.map((item, idx) => (
              <div key={idx} className="tracking-item-row">
                <span>
                  {item.name} × {item.quantity}
                </span>
                <strong>
                  {formatMoney((item.price || 0) * (item.quantity || 1))}
                </strong>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="reassurance">
        <span>♨</span>
        <strong>
          Freshly cooked
          <br />
          <small>Just for you!</small>
        </strong>
      </div>
      <Link className="button secondary full" to="../../assistance">
        Need help? Call Staff
      </Link>
      <Link className="text-link" to={`../bill/${order.id}`}>
        View bill for this order
      </Link>
    </main>
  );
}
