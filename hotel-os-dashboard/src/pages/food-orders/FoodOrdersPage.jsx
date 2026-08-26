import React, { useState } from 'react'
import { useHotelOS } from '../../app/providers.jsx'

const statusConfig = {
  'preparing': { color: 'bg-orange-100 text-orange-700', label: 'Preparing' },
  'out-for-delivery': { color: 'bg-blue-100 text-blue-700', label: 'Out for Delivery' },
  'delivered': { color: 'bg-green-100 text-green-700', label: 'Delivered' },
  'cancelled': { color: 'bg-red-100 text-red-700', label: 'Cancelled' },
}

const menu = [
  { name: 'Masala Chai', price: 60, category: 'Beverages' },
  { name: 'Cold Coffee', price: 180, category: 'Beverages' },
  { name: 'Fresh Lime Soda', price: 80, category: 'Beverages' },
  { name: 'Gulab Jamun', price: 120, category: 'Desserts' },
  { name: 'Rasgulla', price: 100, category: 'Desserts' },
  { name: 'Paneer Butter Masala', price: 280, category: 'Main Course' },
  { name: 'Dal Makhani', price: 220, category: 'Main Course' },
  { name: 'Roti (3 pcs)', price: 60, category: 'Breads' },
  { name: 'Samosa (2 pcs)', price: 80, category: 'Snacks' },
  { name: 'Veg Sandwich', price: 120, category: 'Snacks' },
]

export default function FoodOrdersPage() {
  const { foodOrders, setFoodOrders, updateOrderStatus, rooms } = useHotelOS()
  const [showNew, setShowNew] = useState(false)
  const [filter, setFilter] = useState('all')
  const [newOrder, setNewOrder] = useState({ room: '', items: [], payment: 'COD' })
  const [cart, setCart] = useState([])

  const filtered = filter === 'all' ? foodOrders : foodOrders.filter(o => o.status === filter)
  const totalRevenue = foodOrders.filter(o=>o.status==='delivered').reduce((s,o) => s + o.amount, 0)

  const addToCart = (item) => {
    setCart(prev => {
      const ex = prev.find(c => c.name === item.name)
      if (ex) return prev.map(c => c.name === item.name ? {...c, qty: c.qty+1} : c)
      return [...prev, {...item, qty: 1}]
    })
  }

  const placeOrder = () => {
    if (!newOrder.room || cart.length === 0) return
    const itemStr = cart.map(c => `${c.qty}× ${c.name}`).join(', ')
    const amount = cart.reduce((s,c) => s + c.price*c.qty, 0)
    setFoodOrders(prev => [{
      id: Date.now(), room: newOrder.room, items: itemStr,
      payment: newOrder.payment, status: 'preparing',
      time: new Date().toLocaleTimeString('en-IN', {hour:'2-digit',minute:'2-digit'}),
      amount
    }, ...prev])
    setShowNew(false)
    setCart([])
    setNewOrder({ room:'', items:[], payment:'COD' })
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0f1f3d] font-display">Food Orders</h1>
          <p className="text-gray-500 text-sm">Total Revenue Today: <span className="font-semibold text-green-600">₹{totalRevenue.toLocaleString()}</span></p>
        </div>
        <button onClick={() => setShowNew(true)} className="px-4 py-2 bg-[#0f1f3d] text-white text-sm rounded-xl font-medium hover:bg-[#162847] transition-colors">+ New Order</button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[['Preparing', 'preparing', 'bg-orange-50 text-orange-600', '👨‍🍳'],
          ['Out for Delivery', 'out-for-delivery', 'bg-blue-50 text-blue-600', '🛵'],
          ['Delivered', 'delivered', 'bg-green-50 text-green-600', '✅'],
          ['Total Orders', 'all', 'bg-purple-50 text-purple-600', '📋']
        ].map(([label, key, cls, icon]) => (
          <div key={label} className={`rounded-2xl p-4 ${cls.split(' ')[0]}`}>
            <div className="text-2xl mb-1">{icon}</div>
            <div className={`text-2xl font-bold ${cls.split(' ')[1]}`}>{key === 'all' ? foodOrders.length : foodOrders.filter(o=>o.status===key).length}</div>
            <div className="text-gray-500 text-xs mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1 gap-1 w-fit mb-4">
        {['all','preparing','out-for-delivery','delivered'].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${filter === s ? 'bg-white text-[#0f1f3d] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {s.replace('-',' ')}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Room</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Items</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Payment</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Time</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(order => (
              <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4 font-bold text-[#0f1f3d]">{order.room}</td>
                <td className="py-3 px-4 text-sm text-gray-700 max-w-xs truncate">{order.items}</td>
                <td className="py-3 px-4 font-semibold text-[#0f1f3d]">₹{order.amount}</td>
                <td className="py-3 px-4 text-sm text-gray-600">{order.payment}</td>
                <td className="py-3 px-4 text-sm text-gray-500">{order.time}</td>
                <td className="py-3 px-4">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${statusConfig[order.status]?.color}`}>
                    {statusConfig[order.status]?.label}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <select value={order.status} onChange={e => updateOrderStatus(order.id, e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-[#c9a84c]">
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
        {filtered.length === 0 && <div className="text-center py-12 text-gray-400">No orders found</div>}
      </div>

      {/* New Order Modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowNew(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="bg-[#0f1f3d] rounded-t-2xl p-5">
              <h3 className="font-bold text-white text-lg">New Food Order</h3>
            </div>
            <div className="p-5 grid grid-cols-2 gap-5">
              <div>
                <div className="mb-3">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Room *</label>
                  <select value={newOrder.room} onChange={e => setNewOrder(p=>({...p,room:e.target.value}))} className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#c9a84c]">
                    <option value="">Select Room</option>
                    {rooms.filter(r=>r.status==='occupied').map(r => <option key={r.id} value={r.id}>Room {r.id} – {r.guest}</option>)}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Payment</label>
                  <select value={newOrder.payment} onChange={e => setNewOrder(p=>({...p,payment:e.target.value}))} className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#c9a84c]">
                    <option>COD</option><option>UPI</option><option>Room Charge</option><option>Card</option>
                  </select>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Cart</div>
                  {cart.length === 0 ? <div className="text-gray-400 text-xs">No items yet</div> : cart.map(c => (
                    <div key={c.name} className="flex justify-between text-sm py-1 border-b border-gray-100 last:border-0">
                      <span>{c.qty}× {c.name}</span>
                      <span className="font-semibold">₹{c.price*c.qty}</span>
                    </div>
                  ))}
                  {cart.length > 0 && (
                    <div className="flex justify-between font-bold text-sm pt-2 mt-1">
                      <span>Total</span>
                      <span className="text-[#0f1f3d]">₹{cart.reduce((s,c)=>s+c.price*c.qty,0)}</span>
                    </div>
                  )}
                </div>
                <button onClick={placeOrder} className="w-full mt-3 py-2.5 bg-[#0f1f3d] text-white rounded-xl text-sm font-semibold hover:bg-[#162847] transition-colors">
                  Place Order
                </button>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Menu</div>
                <div className="space-y-1 max-h-80 overflow-y-auto scrollbar-thin">
                  {menu.map(item => (
                    <button key={item.name} onClick={() => addToCart(item)} className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-50 border border-gray-100 transition-colors text-left">
                      <div>
                        <div className="text-sm font-medium text-[#0f1f3d]">{item.name}</div>
                        <div className="text-xs text-gray-400">{item.category}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[#c9a84c] font-semibold text-sm">₹{item.price}</span>
                        <span className="text-[#0f1f3d] text-lg leading-none">+</span>
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
  )
}
