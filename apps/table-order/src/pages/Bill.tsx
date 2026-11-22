import { ClipboardList, Download, MessageCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { jsPDF } from "jspdf";
import { api } from "../services/api";
import { formatMoney, PageHeader } from "../components/Layout";
import { useCart } from "../context/CartContext";
import { useSession } from "../context/SessionContext";
import { useOrders } from "../context/OrdersContext";

export default function Bill() {
  const { orderId: routeOrderId } = useParams();
  const { hotelId, tableId, tableNumber } = useCart();
  const { ensureAuthenticatedSession } = useSession();
  const { orders, loading } = useOrders();

  const [selectedTab, setSelectedTab] = useState<string>(
    routeOrderId || (orders.length > 1 ? "ALL" : orders[0]?.id || "ALL"),
  );
  const [rating, setRating] = useState(0);
  const [sent, setSent] = useState(false);

  // If routeOrderId is passed in URL, switch to that order's tab
  useEffect(() => {
    if (routeOrderId) {
      setSelectedTab(routeOrderId);
    } else if (orders.length > 1) {
      setSelectedTab("ALL");
    } else if (orders.length === 1) {
      setSelectedTab(orders[0].id);
    }
  }, [routeOrderId, orders]);

  // Combined totals across all orders in current session
  const combinedSubtotal = useMemo(
    () =>
      orders.reduce(
        (sum, o) =>
          sum +
          (o.subtotal ??
            (Array.isArray(o.items)
              ? o.items.reduce(
                  (s, it) => s + (it.price || 0) * (it.quantity || 1),
                  0,
                )
              : o.totalAmount)),
        0,
      ),
    [orders],
  );

  const combinedDiscount = useMemo(
    () => orders.reduce((sum, o) => sum + (o.discount || 0), 0),
    [orders],
  );

  const combinedGst = useMemo(
    () => orders.reduce((sum, o) => sum + (o.gst || 0), 0),
    [orders],
  );

  const combinedTotal = useMemo(
    () => orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
    [orders],
  );

  const activeOrder = useMemo(
    () => orders.find((o) => o.id === selectedTab),
    [orders, selectedTab],
  );

  const isAllView =
    selectedTab === "ALL" || (!activeOrder && orders.length > 0);

  const shareText = isAllView
    ? `Table ${tableNumber || "Dining"} Bill\nTotal Orders: ${orders.length}\nGrand Total: ${formatMoney(combinedTotal)}\nThank you for dining with us!`
    : `Order #${activeOrder?.id.slice(-6).toUpperCase()}\nTotal: ${formatMoney(activeOrder?.totalAmount)}\nThank you for dining with us!`;

  function downloadPdf() {
    const pdf = new jsPDF();
    pdf.setFontSize(20);
    pdf.text(
      isAllView ? "Restaurant Table Bill" : "Restaurant Order Bill",
      20,
      25,
    );
    pdf.setFontSize(11);
    pdf.text(
      `Table: ${tableNumber || "Dining"} · ${isAllView ? `Consolidated Bill (${orders.length} orders)` : `Order #${activeOrder?.id}`}`,
      20,
      36,
    );
    let y = 50;

    if (isAllView) {
      orders.forEach((ord, ordIdx) => {
        pdf.setFontSize(12);
        pdf.text(
          `Round ${orders.length - ordIdx} (#${ord.id.slice(-6).toUpperCase()}):`,
          20,
          y,
        );
        y += 7;
        pdf.setFontSize(10);
        ord.items.forEach((item) => {
          pdf.text(
            `  ${item.name} x ${item.quantity}  ${formatMoney((item.price || 0) * (item.quantity || 1))}`,
            20,
            y,
          );
          y += 6;
        });
        y += 4;
      });
      y += 4;
      pdf.setFontSize(11);
      pdf.text(`Subtotal: ${formatMoney(combinedSubtotal)}`, 20, y);
      y += 7;
      pdf.text(`Total Discount: ${formatMoney(combinedDiscount)}`, 20, y);
      y += 7;
      pdf.text(`Total GST: ${formatMoney(combinedGst)}`, 20, y);
      y += 9;
      pdf.setFontSize(14);
      pdf.text(`Grand Total: ${formatMoney(combinedTotal)}`, 20, y);
      pdf.save(`table-${tableNumber || "session"}-bill.pdf`);
    } else if (activeOrder) {
      activeOrder.items.forEach((item) => {
        pdf.text(
          `${item.name} x ${item.quantity}  ${formatMoney((item.price || 0) * (item.quantity || 1))}`,
          20,
          y,
        );
        y += 8;
      });
      y += 8;
      pdf.text(`Discount: ${formatMoney(activeOrder.discount)}`, 20, y);
      y += 8;
      pdf.text(`GST: ${formatMoney(activeOrder.gst)}`, 20, y);
      y += 10;
      pdf.setFontSize(14);
      pdf.text(`Total: ${formatMoney(activeOrder.totalAmount)}`, 20, y);
      pdf.save(`order-${activeOrder.id}.pdf`);
    }
  }

  async function rate(value: number) {
    setRating(value);
    try {
      await ensureAuthenticatedSession();
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

  if (loading && orders.length === 0) {
    return <main className="page loading">Preparing your bill...</main>;
  }

  if (orders.length === 0) {
    return (
      <main className="page">
        <PageHeader title="Billing & Payment" />
        <section className="empty">
          <ClipboardList
            size={40}
            style={{ margin: "0 auto 16px", color: "var(--accent)" }}
          />
          <h2>No current bill</h2>
          <p>Place an order first to view its bill and payment details.</p>
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

  return (
    <main className="page bill-page">
      <PageHeader title="Billing & Payment" />

      {/* Multi-Order Tabs Switcher */}
      {orders.length > 1 && (
        <div className="bill-tabs-bar">
          <button
            className={`bill-tab-btn ${isAllView ? "active" : ""}`}
            onClick={() => setSelectedTab("ALL")}
          >
            <span>Table Total</span>
            <small>All {orders.length} orders</small>
          </button>
          {orders.map((o, idx) => (
            <button
              key={o.id}
              className={`bill-tab-btn ${selectedTab === o.id ? "active" : ""}`}
              onClick={() => setSelectedTab(o.id)}
            >
              <span>Round {orders.length - idx}</span>
              <small>#{o.id.slice(-4).toUpperCase()}</small>
            </button>
          ))}
        </div>
      )}

      {/* Bill Summary Card */}
      <section className="bill-card">
        <h2>
          {isAllView
            ? `Table Summary (${orders.length} Orders)`
            : `Order #${activeOrder?.id.slice(-6).toUpperCase()} Summary`}
        </h2>

        {isAllView ? (
          <div className="bill-lines">
            {orders.map((ord, ordIdx) => (
              <div key={ord.id} className="bill-order-group">
                <div className="bill-order-group-header">
                  <strong>Round {orders.length - ordIdx}</strong>
                  <span>#{ord.id.slice(-6).toUpperCase()}</span>
                </div>
                {ord.items.map((item, itemIdx) => (
                  <div
                    key={`${item.foodItemId || item.name}-${itemIdx}`}
                    className="bill-item-subline"
                  >
                    <span>
                      {item.name} × {item.quantity}
                    </span>
                    <strong>
                      {formatMoney((item.price || 0) * (item.quantity || 1))}
                    </strong>
                  </div>
                ))}
              </div>
            ))}
            <div className="bill-divider" />
            <div>
              <span>Subtotal</span>
              <strong>{formatMoney(combinedSubtotal)}</strong>
            </div>
            <div>
              <span>Discount</span>
              <strong>
                {combinedDiscount > 0
                  ? `-${formatMoney(combinedDiscount)}`
                  : "—"}
              </strong>
            </div>
            <div>
              <span>GST</span>
              <strong>{formatMoney(combinedGst)}</strong>
            </div>
            <div className="bill-total">
              <span>Grand Total</span>
              <strong>{formatMoney(combinedTotal)}</strong>
            </div>
            <div>
              <span>Payment Status</span>
              <strong>
                {orders.every((o) => o.paymentStatus === "PAID")
                  ? "PAID"
                  : "Pay After Billing (Settle with staff)"}
              </strong>
            </div>
          </div>
        ) : activeOrder ? (
          <div className="bill-lines">
            {activeOrder.items.map((item, itemIdx) => (
              <div key={`${item.foodItemId || item.name}-${itemIdx}`}>
                <span>
                  {item.name} × {item.quantity}
                </span>
                <strong>
                  {formatMoney((item.price || 0) * (item.quantity || 1))}
                </strong>
              </div>
            ))}
            <div>
              <span>Subtotal</span>
              <strong>
                {formatMoney(activeOrder.subtotal || activeOrder.totalAmount)}
              </strong>
            </div>
            <div>
              <span>GST</span>
              <strong>{formatMoney(activeOrder.gst || 0)}</strong>
            </div>
            <div>
              <span>Discount</span>
              <strong>
                {(activeOrder.discount || 0) > 0
                  ? `-${formatMoney(activeOrder.discount)}`
                  : "—"}
              </strong>
            </div>
            <div className="bill-total">
              <span>Grand Total</span>
              <strong>{formatMoney(activeOrder.totalAmount)}</strong>
            </div>
            <div>
              <span>Payment method</span>
              <strong>
                {activeOrder.paymentMethod || "Pay After Billing"}
              </strong>
            </div>
            <div>
              <span>Payment status</span>
              <strong>{activeOrder.paymentStatus || "PENDING"}</strong>
            </div>
          </div>
        ) : null}
      </section>

      <div className="bill-actions">
        <button className="button secondary" onClick={downloadPdf}>
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
