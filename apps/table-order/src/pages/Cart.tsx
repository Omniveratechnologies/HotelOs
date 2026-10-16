import { useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatMoney } from "../components/Layout";
import { useCart } from "../context/CartContext";
import { api } from "../services/api";
import { openRazorpayCheckout } from "../services/razorpayCheckout";
import type { PaymentMode } from "../types";

export default function Cart() {
  const {
    hotelId,
    tableId,
    orderType,
    items,
    tableNumber,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
  } = useCart();
  const navigate = useNavigate();
  const [notes, setNotes] = useState("");
  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");
  const [offers, setOffers] = useState<
    { id: string; name: string; type: string; value: number }[]
  >([]);
  const [paymentMode, setPaymentMode] = useState<PaymentMode | "">("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [paymentFailure, setPaymentFailure] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [menu, setMenu] = useState<any[]>([]);

  useEffect(() => {
    if (!items.length) {
      setMenu([]);
      setSuggestions([]);
      return;
    }
    api
      .getMenu(hotelId)
      .then(setMenu)
      .catch(() => setMenu([]));
    api
      .getUpsellSuggestions(
        hotelId,
        items.map((i) => i.foodItemId),
      )
      .then(setSuggestions)
      .catch(() => setSuggestions([]));
  }, [items, hotelId]);

  useEffect(() => {
    api
      .getDiscounts(hotelId)
      .then(setOffers)
      .catch(() => setOffers([]));
  }, [hotelId]);

  // Flattens the rule-based upsell suggestions into single-item cards —
  // this is what the "Frequently bought with your order" row in the
  // reference design shows (one dish, one price, one + button each).
  const frequentlyBought = useMemo(() => {
    const seen = new Map<
      string,
      { foodItemId: string; name: string; price: number; image?: string }
    >();
    suggestions.forEach((rule) => {
      rule.recommendedItems?.forEach((recommended: any) => {
        const foodItemId = String(
          recommended.foodItemId?._id || recommended.foodItemId,
        );
        if (items.some((item) => item.foodItemId === foodItemId)) return;
        if (seen.has(foodItemId)) return;
        const foodItem = menu.find((m) => String(m.id ?? m._id) === foodItemId);
        seen.set(foodItemId, {
          foodItemId,
          name: recommended.name || foodItem?.name || "Item",
          price: recommended.price ?? foodItem?.price ?? 0,
          image: foodItem?.image,
        });
      });
    });
    return Array.from(seen.values());
  }, [suggestions, menu, items]);

  function addFrequentItem(entry: { foodItemId: string }) {
    const foodItem = menu.find(
      (m) => String(m.id ?? m._id) === entry.foodItemId,
    );
    if (foodItem) addItem(foodItem, 1);
  }

  const gstEstimate = items.reduce(
    (sum, item) => sum + item.price * item.quantity * 0.05,
    0,
  ); // default 5% preview only

  async function applyCoupon() {
    setCouponError("");
    try {
      const result = await api.validateCoupon(hotelId, coupon);
      if (subtotal < (result.minOrder || 0)) {
        setCouponError(
          `Minimum order ₹${result.minOrder} required for this coupon.`,
        );
        return;
      }
      const amount =
        result.discountType === "percentage"
          ? subtotal * (result.value / 100)
          : result.value;
      setCouponApplied(result.code);
      setCouponDiscount(amount);
    } catch (err) {
      setCouponError((err as Error).message);
      setCouponDiscount(0);
      setCouponApplied("");
    }
  }

  function handleClearCart() {
    if (window.confirm("Clear all items from your cart?")) clearCart();
  }

  async function submit() {
    if (!paymentMode) return;
    setBusy(true);
    setError("");
    try {
      const order = await api.createOrder({
        hotelId,
        tableId,
        orderType,
        couponCode: couponApplied || undefined,
        notes: notes || undefined,
        paymentMode,
        items: items.map((item) => ({
          foodItemId: item.foodItemId,
          quantity: item.quantity,
          addons: item.addons ?? [],
          specialInstructions: item.specialInstructions,
        })),
      });
      window.sessionStorage.setItem(
        `table-order:last-order:${hotelId}:${tableId}`,
        order.id,
      );
      if (paymentMode === "PAY_NOW" && order.razorpay) {
        openRazorpayCheckout({
          keyId: order.razorpay.keyId,
          amount: order.razorpay.amount,
          currency: order.razorpay.currency,
          orderId: order.razorpay.orderId,
          onSuccess: async (response) => {
            await api.verifyTableOrderPayment({
              orderId: order.id,
              ...response,
            });
            clearCart();
            navigate(`../order/${order.id}`);
          },
          onDismiss: async () => {
            await api.markPaymentFailed({ orderId: order.id }).catch(() => {});
            setPaymentFailure(true);
          },
        });
      } else {
        clearCart();
        navigate(`../order/${order.id}`);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const modes: [PaymentMode, string, string][] = [
    ["PAY_NOW", "Pay Now", "Secure online payment"],
    ["COD", "Cash on Delivery", "Pay at your table"],
    ["PAY_LATER", "Pay After Billing", "Settle when you ask for the bill"],
  ];

  return (
    <main className="cv2-page">
      <style>{`
        .cv2-page {
          background: #ffffff;
          color: #2d2a26;
          font-family: inherit;
          padding: 24px 28px 40px;
          max-width: 760px;
          margin: 0 auto;
        }
        .cv2-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 20px;
        }
        .cv2-topbar h1 {
          font-size: 22px;
          font-weight: 700;
          margin: 0;
        }
        .cv2-topbar-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .cv2-table-badge {
          font-size: 12px;
          font-weight: 600;
          color: #6b645a;
          background: #f6f3ec;
          border: 1px solid #ece7df;
          border-radius: 999px;
          padding: 5px 12px;
        }
        .cv2-clear-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
          color: #c0392b;
          background: #fff;
          border: 1px solid #f0d9d4;
          border-radius: 8px;
          padding: 7px 12px;
          cursor: pointer;
        }
        .cv2-clear-btn:hover { background: #fdf3f1; }

        .cv2-empty {
          text-align: center;
          padding: 60px 16px;
          color: #6b645a;
        }
        .cv2-empty h2 { margin: 0 0 6px; color: #2d2a26; }

        .cv2-items {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-bottom: 24px;
        }
        .cv2-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 10px 2px;
          border-bottom: 1px solid #f1ede4;
        }
        .cv2-thumb {
          width: 56px;
          height: 56px;
          flex-shrink: 0;
          border-radius: 12px;
          background: #f6f0e4;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: #b08d4f;
        }
        .cv2-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .cv2-item-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .cv2-item-info strong {
          font-size: 14.5px;
          font-weight: 600;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .cv2-item-price {
          font-size: 14px;
          font-weight: 700;
          color: #2d2a26;
          min-width: 56px;
          text-align: right;
        }
        .cv2-stepper {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #faf8f3;
          border: 1px solid #ece7df;
          border-radius: 8px;
          padding: 4px 8px;
        }
        .cv2-stepper button {
          width: 22px;
          height: 22px;
          border: none;
          background: transparent;
          font-size: 16px;
          line-height: 1;
          font-weight: 600;
          color: #2d2a26;
          cursor: pointer;
        }
        .cv2-stepper b { font-size: 13.5px; min-width: 14px; text-align: center; }
        .cv2-remove {
          border: none;
          background: transparent;
          color: #b7afa1;
          cursor: pointer;
          padding: 6px;
        }
        .cv2-remove:hover { color: #c0392b; }

        .cv2-section-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .cv2-section-head p {
          font-size: 14px;
          font-weight: 700;
          margin: 0;
        }
        .cv2-section-head span {
          font-size: 12.5px;
          font-weight: 600;
          color: #1f6b4d;
        }

        .cv2-fb-row {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          padding-bottom: 6px;
          margin-bottom: 24px;
          scroll-snap-type: x proximity;
        }
        .cv2-fb-card {
          flex: 0 0 auto;
          width: 128px;
          border: 1px solid #ece7df;
          border-radius: 14px;
          overflow: hidden;
          background: #fff;
          scroll-snap-align: start;
        }
        .cv2-fb-thumb {
          width: 100%;
          height: 88px;
          background: #f6f0e4;
          position: relative;
        }
        .cv2-fb-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .cv2-fb-add {
          position: absolute;
          right: 6px;
          bottom: -14px;
          width: 28px;
          height: 28px;
          border-radius: 999px;
          background: #f2994a;
          color: #fff;
          border: 3px solid #fff;
          font-size: 16px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .cv2-fb-info { padding: 18px 10px 10px; }
        .cv2-fb-info strong {
          display: block;
          font-size: 12.5px;
          font-weight: 600;
          line-height: 1.3;
          margin-bottom: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .cv2-fb-info small { font-size: 12px; font-weight: 700; color: #1f6b4d; }

        .cv2-notes {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #6b645a;
          margin-bottom: 20px;
        }
        .cv2-notes textarea {
          width: 100%;
          margin-top: 6px;
          border: 1px solid #ece7df;
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 13.5px;
          font-family: inherit;
          resize: vertical;
          min-height: 60px;
          box-sizing: border-box;
        }

        .cv2-offers {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 20px;
        }
        .cv2-offer-chip {
          border: 1px solid #ece7df;
          border-radius: 10px;
          padding: 8px 12px;
          background: #faf8f3;
        }
        .cv2-offer-chip strong { display: block; font-size: 12.5px; font-weight: 700; }
        .cv2-offer-chip small { font-size: 11.5px; color: #1f6b4d; font-weight: 600; }

        .cv2-coupon-row {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }
        .cv2-coupon-row input {
          flex: 1;
          border: 1px solid #ece7df;
          border-radius: 10px;
          padding: 11px 14px;
          font-size: 13.5px;
          box-sizing: border-box;
        }
        .cv2-coupon-row button {
          border: none;
          background: #1f6b4d;
          color: #fff;
          font-weight: 700;
          font-size: 13.5px;
          padding: 0 20px;
          border-radius: 10px;
          cursor: pointer;
        }
        .cv2-error-text { color: #c0392b; font-size: 12.5px; margin: -12px 0 16px; }
        .cv2-success-text { color: #1f6b4d; font-size: 12.5px; font-weight: 600; margin: -12px 0 16px; }

        .cv2-bill {
          border-top: 1px dashed #ece7df;
          padding-top: 14px;
          margin-bottom: 4px;
        }
        .cv2-bill-row {
          display: flex;
          justify-content: space-between;
          font-size: 13.5px;
          color: #6b645a;
          padding: 4px 0;
        }
        .cv2-bill-row strong { color: #2d2a26; font-weight: 600; }
        .cv2-bill-total {
          display: flex;
          justify-content: space-between;
          font-size: 16px;
          font-weight: 700;
          padding-top: 10px;
          margin-top: 6px;
          border-top: 1px solid #ece7df;
        }
        .cv2-bill-note {
          font-size: 11px;
          color: #a39c8e;
          margin: 4px 0 20px;
        }

        .cv2-payment {
          margin-bottom: 20px;
        }
        .cv2-payment-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #6b645a;
          margin-bottom: 10px;
        }
        .cv2-payment-option {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          text-align: left;
          gap: 2px;
          border: 1px solid #ece7df;
          border-radius: 12px;
          padding: 12px 14px;
          margin-bottom: 8px;
          background: #fff;
          cursor: pointer;
        }
        .cv2-payment-option strong { font-size: 13.5px; font-weight: 700; }
        .cv2-payment-option small { font-size: 12px; color: #8b8478; }
        .cv2-payment-option.active {
          border-color: #1f6b4d;
          background: #f1f8f4;
        }
        .cv2-payment-option.active strong { color: #1f6b4d; }

        .cv2-checkout-btn {
          width: 100%;
          border: none;
          background: #1f6b4d;
          color: #fff;
          font-size: 15px;
          font-weight: 700;
          padding: 15px 0;
          border-radius: 12px;
          cursor: pointer;
        }
        .cv2-checkout-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .cv2-checkout-btn:not(:disabled):hover { background: #163f30; }
        .cv2-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(20, 30, 25, 0.52);
        }
        .cv2-modal {
          width: min(100%, 380px);
          padding: 28px 24px 22px;
          border-radius: 16px;
          background: #fff;
          text-align: center;
          box-shadow: 0 18px 60px rgba(0, 0, 0, 0.22);
        }
        .cv2-modal h2 { margin: 0 0 10px; color: #a93226; font-size: 20px; }
        .cv2-modal p { margin: 0 0 22px; color: #5c5955; line-height: 1.5; }
        .cv2-modal button {
          width: 100%;
          border: 0;
          border-radius: 10px;
          padding: 12px 16px;
          background: #1c6b52;
          color: #fff;
          cursor: pointer;
          font: inherit;
          font-weight: 700;
        }

        @media (max-width: 1024px) {
          .cv2-page { padding: 20px 20px 36px; }
        }
        @media (max-width: 640px) {
          .cv2-page { padding: 16px 14px 32px; max-width: 100%; }
          .cv2-topbar h1 { font-size: 19px; }
          .cv2-item { gap: 10px; }
          .cv2-thumb { width: 48px; height: 48px; border-radius: 10px; }
          .cv2-item-info strong { font-size: 13.5px; }
          .cv2-fb-card { width: 112px; }
        }
      `}</style>

      {paymentFailure && (
        <div className="cv2-modal-backdrop" role="presentation">
          <section
            className="cv2-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="payment-failed-title"
          >
            <h2 id="payment-failed-title">Payment not completed</h2>
            <p>
              Your payment was cancelled, so your order was not placed. Your
              cart is still available if you want to try again.
            </p>
            <button onClick={() => setPaymentFailure(false)}>
              Try payment again
            </button>
          </section>
        </div>
      )}

      <div className="cv2-topbar">
        <h1>Your Cart</h1>
        <div className="cv2-topbar-right">
          <span className="cv2-table-badge">Table {tableNumber || "—"}</span>
          {items.length > 0 && (
            <button className="cv2-clear-btn" onClick={handleClearCart}>
              <Trash2 size={14} /> Clear Cart
            </button>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <section className="cv2-empty">
          <h2>Your cart is empty</h2>
          <p>Add dishes from the menu to get started.</p>
        </section>
      ) : (
        <>
          <div className="cv2-items">
            {items.map((item) => (
              <div
                className="cv2-item"
                key={item.foodItemId + (item.specialInstructions ?? "")}
              >
                <div className="cv2-thumb">
                  {item.image ? (
                    <img src={item.image} alt="" />
                  ) : (
                    <span>{item.name.charAt(0)}</span>
                  )}
                </div>
                <div className="cv2-item-info">
                  <strong>{item.name}</strong>
                </div>
                <div className="cv2-item-price">{formatMoney(item.price)}</div>
                <div className="cv2-stepper">
                  <button
                    onClick={() =>
                      updateQuantity(item.foodItemId, item.quantity - 1)
                    }
                  >
                    −
                  </button>
                  <b>{item.quantity}</b>
                  <button
                    onClick={() =>
                      updateQuantity(item.foodItemId, item.quantity + 1)
                    }
                  >
                    +
                  </button>
                </div>
                <button
                  className="cv2-remove"
                  onClick={() => removeItem(item.foodItemId)}
                  aria-label="Remove"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
          </div>

          {frequentlyBought.length > 0 && (
            <>
              <div className="cv2-section-head">
                <p>Frequently bought with your order</p>
                <span>View All</span>
              </div>
              <div className="cv2-fb-row">
                {frequentlyBought.map((entry) => (
                  <div className="cv2-fb-card" key={entry.foodItemId}>
                    <div className="cv2-fb-thumb">
                      {entry.image ? <img src={entry.image} alt="" /> : null}
                      <button
                        className="cv2-fb-add"
                        onClick={() => addFrequentItem(entry)}
                        aria-label={`Add ${entry.name}`}
                      >
                        +
                      </button>
                    </div>
                    <div className="cv2-fb-info">
                      <strong>{entry.name}</strong>
                      <small>{formatMoney(entry.price)}</small>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="cv2-coupon-row">
            <input
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              placeholder="Apply Coupon Code"
            />
            <button onClick={applyCoupon}>Apply</button>
          </div>
          {couponError && <p className="cv2-error-text">{couponError}</p>}
          {couponApplied && (
            <p className="cv2-success-text">✓ {couponApplied} applied</p>
          )}

          <label className="cv2-notes">
            Add a note
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special instructions?"
            />
          </label>

          {offers.length > 0 && (
            <div className="cv2-offers">
              {offers.map((o) => (
                <div key={o.id} className="cv2-offer-chip">
                  <strong>{o.name}</strong>
                  <small>
                    {o.type === "percentage"
                      ? `${o.value}% off`
                      : `₹${o.value} off`}
                  </small>
                </div>
              ))}
            </div>
          )}

          <div className="cv2-bill">
            <div className="cv2-bill-row">
              <span>Subtotal</span>
              <strong>{formatMoney(subtotal)}</strong>
            </div>
            <div className="cv2-bill-row">
              <span>Discount</span>
              <strong>
                {couponApplied ? `-${formatMoney(couponDiscount)}` : "—"}
              </strong>
            </div>
            <div className="cv2-bill-row">
              <span>GST (est. 5%)</span>
              <strong>{formatMoney(gstEstimate)}</strong>
            </div>
            <div className="cv2-bill-total">
              <span>Total (estimated)</span>
              <strong>
                {formatMoney(subtotal - couponDiscount + gstEstimate)}
              </strong>
            </div>
          </div>
          <p className="cv2-bill-note">
            Final tax and total confirmed after order is placed.
          </p>

          <div className="cv2-payment">
            <span className="cv2-payment-label">Choose payment</span>
            {modes.map(([value, label, note]) => (
              <button
                key={value}
                className={`cv2-payment-option ${paymentMode === value ? "active" : ""}`}
                onClick={() => setPaymentMode(value)}
              >
                <strong>{label}</strong>
                <small>{note}</small>
              </button>
            ))}
          </div>

          {error && <p className="cv2-error-text">{error}</p>}

          <button
            className="cv2-checkout-btn"
            disabled={!paymentMode || busy}
            onClick={submit}
          >
            {busy ? "Placing order…" : "Proceed to Billing →"}
          </button>
        </>
      )}
    </main>
  );
}
