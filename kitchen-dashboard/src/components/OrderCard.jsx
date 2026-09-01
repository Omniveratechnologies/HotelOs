import { motion } from "framer-motion";
import Actions from "../utils/Actions";

const borderColors = {
  NEW: "border-l-yellow-600",
  PREPARING: "border-l-yellow-600",
  READY: "border-l-yellow-600",
  "OUT FOR DELIVERY": "border-l-yellow-600",
  REJECTED: "border-l-red-600",
};

const OrderCard = ({ order, updateStatus }) => {
  const actions = Actions[order.status];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      whileHover={{ scale: 1.01 }}
      className={`bg-[#232323] border border-[#3a3a3a] ${borderColors[order.status]} border-l-4 rounded-md shadow-md flex flex-col overflow-hidden h-[45vh] min-h-[320px] max-h-[500px]`}
    >
      <div
        className="h-px mb-4"
        style={{
          background:
            "repeating-linear-gradient(to right, #555 0 6px, transparent 6px 14px)",
        }}
      ></div>
      <div className="flex justify-between items-center px-3 py-2 border-b border-[#3a3a3a]">
        <div>
          <h2 className="text-lg font-bold tracking-wide text-white">
            ROOM {order.roomNumber}
          </h2>
        </div>

        <div className="text-right">
          <p className="text-xs text-gray-500">{order.age}</p>
        </div>
      </div>

      <div className="flex-1 px-3 py-3">
        <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">
          Items
        </p>

        <div className="space-y-1">
          {order.items.map((item) => (
  <p key={item._id} className="text-sm text-gray-200 truncate">
    • {item.name} × {item.quantity}
  </p>
))}

          <p className="text-[11px] uppercase tracking-widest text-gray-500">
            Payment : {order.paymentMethod}
          </p>
        </div>
      </div>

      {(actions?.buttons?.length > 0 || order.status === "REJECTED") && (
        <div className="border-t border-[#3a3a3a] p-2">
          {actions?.buttons?.length > 0 && (
            <div
              className={`grid gap-2 ${
                actions.buttons.length === 2 ? "grid-cols-2" : "grid-cols-1"
              }`}
            >
              {actions.buttons.map((button) => (
                <button
                  key={button.label}
                  onClick={() => updateStatus(order._id, button.nextStatus)}
                  className={`py-2 text-xs font-bold rounded transition ${button.className}`}
                >
                  {button.label}
                </button>
              ))}
            </div>
          )}

          {order.status === "REJECTED" && (
            <div className="text-center py-2 rounded text-sm font-bold bg-red-900 text-red-300">
              REJECTED
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default OrderCard;
