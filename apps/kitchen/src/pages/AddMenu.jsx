import { useEffect, useState } from "react";

import API_BASE_URL from "../config/api.js";

import Navbar from "../components/ui/Navbar.jsx";
import Sidebar from "../components/Hamburger/SideBar.jsx";
import MenuForm from "../components/menu/MenuForm.jsx";

const AddMenu = ({ onClose }) => {
  const [orders, setOrders] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [navbarSearchTerm, setNavbarSearchTerm] = useState("");

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

  return (
    <div className="relative h-screen overflow-hidden bg-[#0f0f0f] text-white">
      <Sidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

      <div
        className={`h-full overflow-y-auto transition-transform duration-300 ease-in-out ${
          isMenuOpen ? "translate-x-64" : "translate-x-0"
        }`}
      >
        <Navbar
          title="Add Menu"
          subtitle="Add & Edit all menu items, categories, pricing and availability."
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          navbarSearchTerm={navbarSearchTerm}
          setNavbarSearchTerm={setNavbarSearchTerm}
        />

        <main className="mt-3 px-4">
          <MenuForm onCancel={onClose} />
        </main>
      </div>
    </div>
  );
};

export default AddMenu;
