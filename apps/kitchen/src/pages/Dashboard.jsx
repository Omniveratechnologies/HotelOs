import { useEffect, useState } from "react";

import API_BASE_URL from "../config/api.js";

import Navbar from "../components/ui/Navbar.jsx";
import Sidebar from "../components/Hamburger/SideBar.jsx";
import DashboardStatus from "../components/dashboard/DashboardStatus.jsx";
import OrderBoard from "../components/dashboard/OrderBoard.jsx";

const Dashboard = () => {
  const [orders, setOrders] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [navbarSearchTerm, setNavbarSearchTerm] = useState("");

  const updateStatus = async (id, newStatus) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/kitchen/orders/${id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update order status");
      }

      const updatedOrder = await response.json();

      setOrders((prev) =>
        prev.map((order) => (order._id === id ? updatedOrder : order)),
      );
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/kitchen/orders`);

        if (!response.ok) {
          throw new Error("Failed to fetch orders");
        }

        const data = await response.json();

        setOrders(data);
      } catch (error) {
        console.error("Error fetching orders:", error);
      }
    };

    fetchOrders();
  }, []);

  const filteredOrders = orders.filter((order) => {
    if (!navbarSearchTerm.trim()) {
      return true;
    }

    const searchValue = navbarSearchTerm.toLowerCase();

    return Object.values(order).some((value) =>
      String(value).toLowerCase().includes(searchValue),
    );
  });

  return (
    <div className="relative h-screen overflow-hidden bg-[#0f0f0f] text-white">
      <Sidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

      <div
        className={`h-full overflow-y-auto transition-transform duration-300 ease-in-out ${
          isMenuOpen ? "translate-x-64" : "translate-x-0"
        }`}
      >
        <Navbar
          title="Kitchen Dashboard"
          subtitle="Real-time orders. Faster service. Happier Customers."
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          navbarSearchTerm={navbarSearchTerm}
          setNavbarSearchTerm={setNavbarSearchTerm}
        />

        <main className="mt-3 px-4">
          <DashboardStatus orders={orders} />

          <OrderBoard orders={filteredOrders} updateStatus={updateStatus} />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
