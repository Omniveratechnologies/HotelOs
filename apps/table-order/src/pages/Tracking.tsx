import { Check, Clock3 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../services/api";
import { PageHeader } from "../components/Layout";
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
  const { orderId = "" } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const poll = () =>
      api
        .getOrder(orderId)
        .then((value) => active && setOrder(value))
        .catch((err: Error) => active && setError(err.message));
    poll();
    const interval = window.setInterval(poll, 5000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [orderId]);
  if (error)
    return (
      <main className="page">
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
      <div className="reassurance">
        <span>♨</span>
        <strong>
          Freshly cooked
          <br />
          <small>Just for you!</small>
        </strong>
      </div>
      <Link className="button secondary full" to="../../assistance">
        Need help?
      </Link>
      <Link className="text-link" to={`../bill/${order.id}`}>
        View bill
      </Link>
    </main>
  );
}
