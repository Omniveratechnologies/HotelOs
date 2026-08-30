import React, { useState } from "react";
import { useHotelOS } from "../../app/providers.jsx";

const statusConfig = {
  preparing: { color: "bg-orange-100 text-orange-700", label: "Preparing" },
  "out-for-delivery": {
    color: "bg-blue-100 text-blue-700",
    label: "Out for Delivery",
  },
  delivered: { color: "bg-green-100 text-green-700", label: "Delivered" },
  cancelled: { color: "bg-red-100 text-red-700", label: "Cancelled" },
};

const menu = [
  { name: "Masala Chai", price: 60, category: "Beverages" },
  { name: "Cold Coffee", price: 180, category: "Beverages" },
  { name: "Fresh Lime Soda", price: 80, category: "Beverages" },
  { name: "Gulab Jamun", price: 120, category: "Desserts" },
  { name: "Rasgulla", price: 100, category: "Desserts" },
  { name: "Paneer Butter Masala", price: 280, category: "Main Course" },
  { name: "Dal Makhani", price: 220, category: "Main Course" },
  { name: "Roti (3 pcs)", price: 60, category: "Breads" },
  { name: "Samosa (2 pcs)", price: 80, category: "Snacks" },
  { name: "Veg Sandwich", price: 120, category: "Snacks" },
];

export default function FoodOrdersPage() {
  const { foodOrders, setFoodOrders, updateOrderStatus, rooms } = useHotelOS();
  const [showNew, setShowNew] = useState(false);
  const [filter, setFilter] = useState("all");
  const [newOrder, setNewOrder] = useState({
    room: "",
    items: [],
    payment: "COD",
  });
  const [cart, setCart] = useState([]);

  const filtered =
    filter === "all"
      ? foodOrders
      : foodOrders.filter((o) => o.status === filter);
  const totalRevenue = foodOrders
    .filter((o) => o.status === "delivered")
    .reduce((s, o) => s + o.amount, 0);

  const addToCart = (item) => {
    setCart((prev) => {
      const ex = prev.find((c) => c.name === item.name);
      if (ex)
        return prev.map((c) =>
          c.name === item.name ? { ...c, qty: c.qty + 1 } : c,
        );
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const placeOrder = () => {
    if (!newOrder.room || cart.length === 0) return;
    const itemStr = cart.map((c) => `${c.qty}× ${c.name}`).join(", ");
    const amount = cart.reduce((s, c) => s + c.price * c.qty, 0);
    setFoodOrders((prev) => [
      {
        id: Date.now(),
        room: newOrder.room,
        items: itemStr,
        payment: newOrder.payment,
        status: "preparing",
        time: new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        amount,
      },
      ...prev,
    ]);
    setShowNew(false);
    setCart([]);
    setNewOrder({ room: "", items: [], payment: "COD" });
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-navy-900 text-2xl font-bold">
            Food Orders
          </h1>
          <p className="text-sm text-gray-500">
            Total Revenue Today:{" "}
            <span className="font-semibold text-green-600">
              ₹{totalRevenue.toLocaleString()}
            </span>
          </p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="bg-navy-900 hover:bg-navy-800 rounded-xl px-4 py-2 text-sm font-medium text-white transition-colors"
        >
          + New Order
        </button>
      </div>

      {/* Quick Stats */}
      <div className="mb-6 grid grid-cols-4 gap-3">
        {[
          ["Preparing", "preparing", "bg-orange-50 text-orange-600", "👨‍🍳"],
          [
            "Out for Delivery",
            "out-for-delivery",
            "bg-blue-50 text-blue-600",
            "🛵",
          ],
          ["Delivered", "delivered", "bg-green-50 text-green-600", "✅"],
          ["Total Orders", "all", "bg-purple-50 text-purple-600", "📋"],
        ].map(([label, key, cls, icon]) => (
          <div key={label} className={`rounded-2xl p-4 ${cls.split(" ")[0]}`}>
            <div className="mb-1 text-2xl">{icon}</div>
            <div className={`text-2xl font-bold ${cls.split(" ")[1]}`}>
              {key === "all"
                ? foodOrders.length
                : foodOrders.filter((o) => o.status === key).length}
            </div>
            <div className="mt-0.5 text-xs text-gray-500">{label}</div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="mb-4 flex w-fit gap-1 rounded-xl bg-gray-100 p-1">
        {["all", "preparing", "out-for-delivery", "delivered"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all ${filter === s ? "text-navy-900 bg-white shadow-xs" : "text-gray-500 hover:text-gray-700"}`}
          >
            {s.replace("-", " ")}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-500 uppercase">
                Room
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-500 uppercase">
                Items
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-500 uppercase">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-500 uppercase">
                Payment
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-500 uppercase">
                Time
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-500 uppercase">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((order) => (
              <tr key={order.id} className="transition-colors hover:bg-gray-50">
                <td className="text-navy-900 px-4 py-3 font-bold">
                  {order.room}
                </td>
                <td className="max-w-xs truncate px-4 py-3 text-sm text-gray-700">
                  {order.items}
                </td>
                <td className="text-navy-900 px-4 py-3 font-semibold">
                  ₹{order.amount}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {order.payment}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {order.time}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusConfig[order.status]?.color}`}
                  >
                    {statusConfig[order.status]?.label}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={order.status}
                    onChange={(e) =>
                      updateOrderStatus(order.id, e.target.value)
                    }
                    className="focus:border-gold-400 rounded-lg border border-gray-200 px-2 py-1 text-xs focus:outline-hidden"
                  >
                    <option value="preparing">Preparing</option>
                    <option value="out-for-delivery">Out for Delivery</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-gray-400">No orders found</div>
        )}
      </div>

      {/* New Order Modal */}
      {showNew && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowNew(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-navy-900 rounded-t-2xl p-5">
              <h3 className="text-lg font-bold text-white">New Food Order</h3>
            </div>
            <div className="grid grid-cols-2 gap-5 p-5">
              <div>
                <div className="mb-3">
                  <label className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                    Room *
                  </label>
                  <select
                    value={newOrder.room}
                    onChange={(e) =>
                      setNewOrder((p) => ({ ...p, room: e.target.value }))
                    }
                    className="focus:border-gold-400 mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-hidden"
                  >
                    <option value="">Select Room</option>
                    {rooms
                      .filter((r) => r.status === "occupied")
                      .map((r) => (
                        <option key={r.id} value={r.id}>
                          Room {r.id} – {r.guest}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                    Payment
                  </label>
                  <select
                    value={newOrder.payment}
                    onChange={(e) =>
                      setNewOrder((p) => ({ ...p, payment: e.target.value }))
                    }
                    className="focus:border-gold-400 mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-hidden"
                  >
                    <option>COD</option>
                    <option>UPI</option>
                    <option>Room Charge</option>
                    <option>Card</option>
                  </select>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <div className="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                    Cart
                  </div>
                  {cart.length === 0 ? (
                    <div className="text-xs text-gray-400">No items yet</div>
                  ) : (
                    cart.map((c) => (
                      <div
                        key={c.name}
                        className="flex justify-between border-b border-gray-100 py-1 text-sm last:border-0"
                      >
                        <span>
                          {c.qty}× {c.name}
                        </span>
                        <span className="font-semibold">
                          ₹{c.price * c.qty}
                        </span>
                      </div>
                    ))
                  )}
                  {cart.length > 0 && (
                    <div className="mt-1 flex justify-between pt-2 text-sm font-bold">
                      <span>Total</span>
                      <span className="text-navy-900">
                        ₹{cart.reduce((s, c) => s + c.price * c.qty, 0)}
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={placeOrder}
                  className="bg-navy-900 hover:bg-navy-800 mt-3 w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-colors"
                >
                  Place Order
                </button>
              </div>
              <div>
                <div className="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                  Menu
                </div>
                <div className="max-h-80 scrollbar-thin space-y-1 overflow-y-auto">
                  {menu.map((item) => (
                    <button
                      key={item.name}
                      onClick={() => addToCart(item)}
                      className="flex w-full items-center justify-between rounded-xl border border-gray-100 px-3 py-2.5 text-left transition-colors hover:bg-gray-50"
                    >
                      <div>
                        <div className="text-navy-900 text-sm font-medium">
                          {item.name}
                        </div>
                        <div className="text-xs text-gray-400">
                          {item.category}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gold-400 text-sm font-semibold">
                          ₹{item.price}
                        </span>
                        <span className="text-navy-900 text-lg leading-none">
                          +
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
