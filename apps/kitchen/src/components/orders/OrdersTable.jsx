import { FiEdit2, FiEye, FiTrash2 } from "react-icons/fi";
import Table from "../ui/Table";
import StatusBadge from "../ui/StatusBadge";

const OrdersTable = ({
  orders = [],
  onEdit,
  onDelete,
  onView,
  showActions = true,
}) => {
  const columns = [
    {
      key: "orderNumber",
      label: "#",
      render: (order) => (
        <span className="font-medium text-white">
          {order.orderNumber || "-"}
        </span>
      ),
    },

    {
      key: "createdAt",
      label: "Date & Time",
      render: (order) => {
        if (!order.createdAt) return "-";

        return (
          <span className="text-gray-400">
            {new Date(order.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        );
      },
    },

    {
      key: "roomNumber",
      label: "Room",
      render: (order) => (
        <span className="text-gray-300">{order.roomNumber || "-"}</span>
      ),
    },

    {
      key: "guestId",
      label: "Guest Name",
      render: (order) => (
        <span className="text-gray-300">{order.guestName || "-"}</span>
      ),
    },

    {
      key: "items",
      label: "Menu Items",
      render: (order) => (
        <div>
          <p className="font-medium text-white">{order.foodItem || "-"}</p>

          <p className="mt-0.5 text-[10px] text-gray-500">
            Qty: {order.quantity || 0}
          </p>
        </div>
      ),
    },

    {
      key: "totalAmount",
      label: "Total Amount",
      render: (order) => (
        <span className="font-medium text-emerald-400">
          ₹{order.totalAmount ?? 0}
        </span>
      ),
    },

    {
      key: "paymentStatus",
      label: "Payment Method",
      render: (order) => (
        <span
          className={`text-xs font-medium ${
            order.paymentStatus === "PAID"
              ? "text-emerald-400"
              : "text-yellow-400"
          }`}
        >
          {order.paymentStatus || "-"}
        </span>
      ),
    },

    {
      key: "status",
      label: "Status",
      render: (order) => <StatusBadge status={order.status} />,
    },

    ...(showActions
      ? [
          {
            key: "actions",
            label: "Actions",
            render: (order) => (
              <div className="flex items-center gap-2">
                {onView && (
                  <button
                    type="button"
                    onClick={() => onView(order)}
                    className="rounded-md text-gray-400 transition hover:bg-gray-800 hover:text-blue-400"
                    title="View"
                  >
                    <FiEye size={15} />
                  </button>
                )}
                {onEdit && (
                  <button
                    type="button"
                    onClick={() => onEdit(order)}
                    className="rounded-md text-gray-400 transition hover:bg-blue-400/10"
                    title="Edit"
                  >
                    <FiEdit2 size={15} />
                  </button>
                )}

                {onDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(order._id)}
                    className="rounded-md text-gray-400 transition hover:bg-gray-800 hover:text-red-400"
                    title="Delete"
                  >
                    <FiTrash2 size={15} />
                  </button>
                )}
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <Table columns={columns} data={orders} emptyMessage="No orders found" />
  );
};

export default OrdersTable;
