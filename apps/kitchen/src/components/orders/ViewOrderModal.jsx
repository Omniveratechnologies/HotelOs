import { FiX } from "react-icons/fi";
import StatusBadge from "../ui/StatusBadge";

const ViewOrderModal = ({ isOpen, onClose, order }) => {
  if (!isOpen || !order) return null;

  const details = [
    {
      label: "Order ID",
      value: order.orderNumber || "-",
    },
    {
      label: "Guest Name",
      value: order.guestName || "-",
    },
    {
      label: "Room Number",
      value: order.roomNumber || "-",
    },
    {
      label: "Food Item",
      value: order.foodItem || "-",
    },
    {
      label: "Quantity",
      value: order.quantity || 0,
    },
    {
      label: "Payment",
      value: order.paymentStatus || "-",
    },
    {
      label: "Order Time",
      value: order.createdAt
        ? new Date(order.createdAt).toLocaleString([], {
            dateStyle: "medium",
            timeStyle: "short",
          })
        : "-",
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-gray-800 bg-[#111111] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-800 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-white">
              Order Details
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              View complete order information
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-800 hover:text-white"
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
          {details.map((detail) => (
            <div key={detail.label}>
              <p className="mb-1 text-[11px] font-medium tracking-wide text-gray-500 uppercase">
                {detail.label}
              </p>

              <p className="text-sm text-white">{detail.value}</p>
            </div>
          ))}

          <div>
            <p className="mb-1 text-[11px] font-medium tracking-wide text-gray-500 uppercase">
              Status
            </p>

            <StatusBadge status={order.status} />
          </div>
        </div>

        <div className="flex justify-end border-t border-gray-800 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-700 px-4 py-2 text-xs font-medium text-gray-300 transition hover:bg-gray-800 hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewOrderModal;
