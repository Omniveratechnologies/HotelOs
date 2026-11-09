import { useEffect } from "react";
import { formatCurrency, formatDate } from "@hotelos/utils";

/**
 * 80mm POS Thermal Receipt preview modal with browser print support (@media print).
 *
 * @param {Object} props
 * @param {string} [props.title='Receipt'] - Modal title
 * @param {Object} props.data - Receipt data object (guestName, invoiceNo, items, subtotal, tax, grandTotal, etc.)
 * @param {() => void} props.onClose - Modal close handler
 * @returns {React.ReactElement | null}
 */
export function ReceiptModal({ title = "Receipt", data = {}, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!data) return null;
  const items = data.items || data.charges || [];
  const handlePrint = () => {
    window.print();
  };

  const receiptNo =
    data.invoiceNo || data.billNo || data.folioNo || "RC-RECEIPT";
  const dateStr =
    data.date || data.createdAt
      ? formatDate(data.date || data.createdAt)
      : "Today";
  const guestName = data.guestName || data.billTo || "Walk-in Guest";
  const subTotal = Number(
    data.subTotal || data.subtotal || data.totalCharges || 0,
  );
  const taxTotal = Number(data.taxes || data.tax || data.gst || 0);
  const totalAmount = Number(
    data.grandTotal ||
      data.totalAmount ||
      data.amount ||
      subTotal + taxTotal ||
      0,
  );

  return (
    <div
      className="backdrop-blur-2xs fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="max-h-[92vh] w-full max-w-[360px] overflow-y-auto rounded-2xl border border-gray-100 bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3 text-sm">
          <span className="font-display text-brand-900 font-semibold">
            {title}
          </span>
          <button
            onClick={onClose}
            className="text-surface-400 hover:text-brand-900 rounded-lg p-1 transition-colors hover:bg-gray-100"
            aria-label="Close"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 80mm POS Printable Slip Area */}
        <div
          id="printable-receipt"
          className="border border-dashed border-gray-300 bg-amber-50/20 p-3.5 font-mono text-[11px] leading-tight text-gray-800"
        >
          <div className="text-center">
            <span className="block text-sm font-bold tracking-wider text-gray-900">
              HOTELOS RESORT &amp; SPA
            </span>
            <p className="mt-0.5 text-[10px] text-gray-500">
              123 Shapesea Dev Street, Kolkata - 700001
              <br />
              GSTIN: 19ABCDE1234F1Z5 | Ph: +91 33 2244 5566
            </p>
          </div>

          <div className="my-2 border-b border-dashed border-gray-400" />

          <div className="flex justify-between text-[10px]">
            <span>RCPT: {receiptNo}</span>
            <span>{dateStr}</span>
          </div>

          <div className="mt-1 text-[10px]">
            <span>
              Guest: <b>{guestName}</b>
            </span>
            {data.roomNumber && (
              <span className="block">Room: {data.roomNumber}</span>
            )}
            {data.bookingNo && (
              <span className="block">Booking: {data.bookingNo}</span>
            )}
          </div>

          <div className="my-2 border-b border-dashed border-gray-400" />

          <table className="w-full text-left text-[10px]">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="py-1">Item</th>
                <th className="py-1 text-center">Qty</th>
                <th className="py-1 text-right">Amt</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={idx} className="border-b border-gray-100">
                  <td className="py-1">{it.name || it.description}</td>
                  <td className="py-1 text-center">
                    {it.quantity || it.qty || 1}
                  </td>
                  <td className="py-1 text-right">
                    {formatCurrency(
                      it.amount ||
                        Number(it.price || it.rate || 0) *
                          Number(it.quantity || it.qty || 1),
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="my-2 border-b border-dashed border-gray-400" />

          <div className="space-y-1 text-[10px]">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatCurrency(subTotal)}</span>
            </div>
            {taxTotal > 0 && (
              <div className="flex justify-between">
                <span>Tax (GST):</span>
                <span>{formatCurrency(taxTotal)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-dashed border-gray-300 pt-1 font-bold text-gray-900">
              <span>Grand Total:</span>
              <span>{formatCurrency(totalAmount)}</span>
            </div>
          </div>

          <div className="my-2 border-b border-dashed border-gray-400" />

          <div className="text-center text-[9px] text-gray-500">
            <p>Thank you for choosing HotelOS!</p>
            <p>Computer generated invoice, no signature required.</p>
            {data.irn && (
              <p className="mt-1 font-bold text-gray-700">
                IRN: {data.irn.substring(0, 20)}...
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={handlePrint}
            className="bg-brand-900 hover:bg-brand-800 flex-1 cursor-pointer rounded-xl py-2 text-xs font-semibold text-white transition-colors"
          >
            Print 80mm Slip
          </button>
          <button
            onClick={onClose}
            className="text-brand-900 cursor-pointer rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold transition-colors hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReceiptModal;
