import { useEffect, useState } from "react";

import API_BASE_URL from "../../config/api.js";

import Sidebar from "../../components/Hamburger/SideBar.jsx";
import Navbar from "../../components/ui/Navbar.jsx";

import OrderStatusCards from "../../components/orders/OrderStatusCard.jsx";
import AllOrdersSection from "../../components/orders/AllOrdersSection.jsx";

const AllOrders = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [navbarSearchTerm, setNavbarSearchTerm] = useState("");
  const [orderSearchTerm, setOrderSearchTerm] = useState("");

  const [orders, setOrders] = useState([]);

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

  return (
    <div className="relative h-screen overflow-hidden bg-[#0f0f0f] text-white">
      <Sidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

      <div
        className={`h-full overflow-y-auto transition-transform duration-300 ease-in-out ${
          isMenuOpen ? "translate-x-64" : "translate-x-0"
        }`}
      >
        <Navbar
          title="Orders"
          subtitle="View and manage all room service orders from the hotel."
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          searchTerm={navbarSearchTerm}
          setSearchTerm={setNavbarSearchTerm}
        />

        <main className="mt-3 px-4">
          <OrderStatusCards orders={orders} />

          <AllOrdersSection
            orders={orders}
            setOrders={setOrders}
            searchTerm={orderSearchTerm}
            setSearchTerm={setOrderSearchTerm}
          />
        </main>
      </div>
    </div>
  );
};

export default AllOrders;
