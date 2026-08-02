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
                           i < orders.length - 1 ? "1px solid #f0ebe3" : "none",
                     }}
                  >
                     <td
                        style={{
                           padding: "12px 12px 12px 0",
                           fontSize: 13.5,
                           color: "#1a2744",
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
                        }}
                     >
                        {order.payment}
                     </td>
                     <td style={{ padding: "12px 0" }}>
                        <span className={`order-pill ${order.status}`}>
                           ● {STATUS_LABEL[order.status]}
                        </span>
                     </td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>
   );
}
