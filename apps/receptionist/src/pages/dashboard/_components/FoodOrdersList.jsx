import React from "react";

export default function FoodOrdersList({ foodOrders }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
      <h2 className="text-navy-900 mb-3 flex items-center gap-2 font-bold">
        <span className="bg-gold-400 inline-block h-5 w-1 rounded-full" />
        Live Food Orders
      </h2>
      <div className="max-h-44 scrollbar-thin space-y-2 overflow-y-auto">
        {foodOrders.map((order) => (
          <div
            key={order.id}
            className="flex items-center gap-3 border-b border-gray-50 py-2 last:border-0"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-sm">
              🍽
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-navy-900 text-xs font-semibold">
                Room {order.room}
              </div>
              <div className="truncate text-[10px] text-gray-500">
                {order.items}
              </div>
            </div>
            <span
              className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-bold ${
                order.status === "delivered"
                  ? "bg-green-100 text-green-600"
                  : order.status === "out-for-delivery"
                    ? "bg-blue-100 text-blue-600"
                    : "bg-orange-100 text-orange-600"
              }`}
            >
              {order.status === "out-for-delivery"
                ? "OUT FOR DELIVERY"
                : order.status.toUpperCase()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
