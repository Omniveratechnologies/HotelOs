import { useEffect, useState } from "react";

import API_BASE_URL from "../../config/api.js";

import Sidebar from "../../components/Hamburger/SideBar.jsx";
import Navbar from "../../components/ui/Navbar.jsx";

import OrdersTable from "../../components/orders/OrdersTable.jsx";
import ViewOrderModal from "../../components/ui/ViewOrderModal.jsx";

const InProgress = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [navbarSearchTerm, setNavbarSearchTerm] = useState("");

  const [orders, setOrders] = useState([]);
  const [viewingOrder, setViewingOrder] = useState(null);

  const ORDERS_API = `${API_BASE_URL}/kitchen/orders`;

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch(ORDERS_API);

        if (!response.ok) {
          throw new Error(`Failed to fetch orders: ${response.status}`);
        }

        const data = await response.json();

        setOrders(data);
      } catch (error) {
        console.error("Error fetching orders:", error);
      }
    };

    fetchOrders();
  }, [ORDERS_API]);

  const inProgress = orders.filter((order) => order.status === "PREPARING");

  return (
    <div className="relative h-screen overflow-hidden bg-[#0f0f0f] text-white">
      <Sidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

      <div
        className={`h-full overflow-y-auto transition-transform duration-300 ease-in-out ${
          isMenuOpen ? "translate-x-64" : "translate-x-0"
        }`}
      >
        <Navbar
          title="In Progress"
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          searchTerm={navbarSearchTerm}
          setSearchTerm={setNavbarSearchTerm}
        />

        <section className="mx-4 mt-4 rounded-lg border border-gray-800 bg-[#111111]">
          <div className="border-b border-gray-800 px-4 py-3">
            <h3 className="text-base font-semibold text-white">New Orders</h3>
          </div>

          <OrdersTable
            orders={inProgress}
            onView={(order) => setViewingOrder(order)}
            showActions={true}
          />
        </section>
        <ViewOrderModal
          isOpen={!!viewingOrder}
          onClose={() => setViewingOrder(null)}
          order={viewingOrder}
        />
      </div>
    </div>
  );
};

export default InProgress;
