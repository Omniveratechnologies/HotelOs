import type { FoodOrder, OrderStatus } from "../types";

interface FoodOrdersProps {
   orders: FoodOrder[];
}

const STATUS_LABEL: Record<OrderStatus, string> = {
   new: "NEW",
   preparing: "PREPARING",
   ready: "READY",
   out_for_delivery: "OUT FOR DELIVERY",
   delivered: "DELIVERED",
};

export function FoodOrders({ orders }: FoodOrdersProps) {
   return (
      <div className="card" style={{ padding: 20 }}>
         <div className="section-title">
            <span className="section-title-bar" />
            <span className="section-title-text">LIVE FOOD ORDERS</span>
         </div>

         {/* Desktop table */}
         <div className="food-table-wrap">
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
               <thead>
                  <tr style={{ borderBottom: "1px solid #e5e0d8" }}>
                     {["ROOM", "ITEMS", "PAYMENT", "STATUS"].map((h) => (
                        <th
                           key={h}
                           className="label-sm"
                           style={{
                              textAlign: "left",
                              paddingBottom: 10,
                              paddingRight: 12,
                              whiteSpace: "nowrap",
                           }}
                        >
                           {h}
                        </th>
                     ))}
                  </tr>
               </thead>
               <tbody>
                  {orders.length === 0 && (
                     <tr>
                        <td
                           colSpan={4}
                           style={{
                              textAlign: "center",
                              padding: "24px 0",
                              fontSize: 13,
                              color: "#9ca3af",
                           }}
                        >
                           No active food orders.
                        </td>
                     </tr>
                  )}
                  {orders.map((order, i) => (
                     <tr
                        key={order.id}
                        style={{
                           borderBottom:
                              i < orders.length - 1
                                 ? "1px solid #f0ebe3"
                                 : "none",
                        }}
                     >
                        <td
                           style={{
                              padding: "12px 12px 12px 0",
                              fontSize: 13.5,
                              color: "#1a2744",
                              whiteSpace: "nowrap",
                           }}
                        >
                           {order.roomNumber}
                        </td>
                        <td
                           style={{
                              padding: "12px 12px 12px 0",
                              fontSize: 13.5,
                              color: "#1a2744",
                           }}
                        >
                           {order.items.join(", ")}
                        </td>
                        <td
                           style={{
                              padding: "12px 12px 12px 0",
                              fontSize: 13.5,
                              color: "#1a2744",
                              whiteSpace: "nowrap",
                           }}
                        >
                           {order.payment}
                        </td>
                        <td style={{ padding: "12px 0", whiteSpace: "nowrap" }}>
                           <span className={`order-pill ${order.status}`}>
                              ● {STATUS_LABEL[order.status]}
                           </span>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>

         {/* Mobile card list */}
         <div className="food-card-list">
            {orders.length === 0 && (
               <p
                  style={{
                     textAlign: "center",
                     padding: "24px 0",
                     fontSize: 13,
                     color: "#9ca3af",
                  }}
               >
                  No active food orders.
               </p>
            )}
            {orders.map((order, i) => (
               <div
                  key={order.id}
                  style={{
                     padding: "12px 0",
                     borderBottom:
                        i < orders.length - 1 ? "1px solid #f0ebe3" : "none",
                     display: "flex",
                     flexDirection: "column",
                     gap: 6,
                  }}
               >
                  <div
                     style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                     }}
                  >
                     <span
                        style={{
                           fontSize: 13.5,
                           fontWeight: 700,
                           color: "#1a2744",
                        }}
                     >
                        Room {order.roomNumber}
                     </span>
                     <span className={`order-pill ${order.status}`}>
                        ● {STATUS_LABEL[order.status]}
                     </span>
                  </div>
                  <div style={{ fontSize: 13, color: "#374151" }}>
                     {order.items.join(", ")}
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                     {order.payment} · {order.timestamp}
                  </div>
               </div>
            ))}
         </div>
      </div>
   );
}
