import { Download, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { jsPDF } from "jspdf";
import { api } from "../services/api";
import { formatMoney, PageHeader } from "../components/Layout";
import { useCart } from "../context/CartContext";
export default function Bill() {
  const { orderId: routeOrderId } = useParams();
  const { hotelId, tableId } = useCart();
  const [order, setOrder] = useState<Awaited<
    ReturnType<typeof api.getOrder>
  > | null>(null);
  const [rating, setRating] = useState(0);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const orderId =
    routeOrderId ||
    window.sessionStorage.getItem(
      `table-order:last-order:${hotelId}:${tableId}`,
    ) ||
    "";
  useEffect(() => {
    if (!orderId) return;
    api
      .getOrder(orderId)
      .then(setOrder)
      .catch((requestError: Error) => setError(requestError.message));
  }, [orderId]);
  if (error)
    return (
      <main className="page">
        <section className="empty">
          <h2>Bill unavailable</h2>
          <p>{error}</p>
        </section>
      </main>
    );
  if (!orderId)
    return (
      <main className="page">
        <section className="empty">
          <h2>No current order</h2>
          <p>Place an order first to view its bill and payment details.</p>
        </section>
      </main>
    );
  if (!order)
    return <main className="page loading">Preparing your bill...</main>;
  const currentOrder = order;
  const shareText = `Order ${currentOrder.id}\nTotal: ${formatMoney(currentOrder.totalAmount)}\nThank you for dining with us!`;
  function download() {
    const pdf = new jsPDF();
    pdf.setFontSize(20);
    pdf.text("Restaurant Bill", 20, 25);
    pdf.setFontSize(11);
    pdf.text(`Order #${currentOrder.id}`, 20, 36);
    let y = 52;
    currentOrder.items.forEach((item) => {
      pdf.text(
        `${item.name} x ${item.quantity}  ${formatMoney(item.price * item.quantity)}`,
        20,
        y,
      );
      y += 8;
    });
    y += 8;
    pdf.text(`Discount: ${formatMoney(currentOrder.discount)}`, 20, y);
    y += 8;
    pdf.text(`GST: ${formatMoney(currentOrder.gst)}`, 20, y);
    y += 10;
    pdf.setFontSize(14);
    pdf.text(`Total: ${formatMoney(currentOrder.totalAmount)}`, 20, y);
    pdf.save(`order-${currentOrder.id}.pdf`);
  }
  async function rate(value: number) {
    setRating(value);
    try {
      await api.createServiceRequest({
        hotelId,
        tableId,
        type: "FEEDBACK",
        description: `${value}/5 stars`,
      });
      setSent(true);
    } catch {
      setSent(false);
    }
  }
  return (
    <main className="page bill-page">
      <PageHeader title="Billing & Payment" />
      <section className="bill-card">
        <h2>Order Summary</h2>
        <div className="bill-lines">
          {order.items.map((item) => (
            <div key={`${item.foodItemId}-${item.name}`}>
              <span>
                {item.name} × {item.quantity}
              </span>
              <strong>{formatMoney(item.price * item.quantity)}</strong>
            </div>
          ))}
          <div>
            <span>Subtotal</span>
            <strong>{formatMoney(order.subtotal)}</strong>
          </div>
          <div>
            <span>GST</span>
            <strong>{formatMoney(order.gst)}</strong>
          </div>
          <div>
            <span>Service Charge</span>
            <strong>{formatMoney(order.serviceCharge ?? 0)}</strong>
          </div>
          <div>
            <span>Discount</span>
            <strong>
              {order.discount > 0 ? `-${formatMoney(order.discount)}` : "—"}
            </strong>
          </div>
          <div className="bill-total">
            <span>Grand Total</span>
            <strong>{formatMoney(order.totalAmount)}</strong>
          </div>
          <div>
            <span>Payment method</span>
            <strong>{order.paymentMethod || "Not selected"}</strong>
          </div>
        </div>
      </section>
      <div className="bill-actions">
        <button className="button secondary" onClick={download}>
          <Download size={17} /> Download Bill (PDF)
        </button>
        <a
          className="button secondary"
          href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
          target="_blank"
          rel="noreferrer"
        >
          <MessageCircle size={17} /> Share on WhatsApp
        </a>
      </div>
      <section className="rating">
        <h2>Rate Your Experience</h2>
        <div>
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              className={value <= rating ? "rated" : ""}
              onClick={() => rate(value)}
              aria-label={`${value} stars`}
            >
              ★
            </button>
          ))}
        </div>
        {sent && <p>Thanks for sharing your feedback.</p>}
        <strong>
          Visit Again Soon! <span>⌁</span>
        </strong>
      </section>
    </main>
  );
}
