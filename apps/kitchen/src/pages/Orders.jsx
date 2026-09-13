import { useState } from "react";

import Sidebar from "../components/hamburger/SideBar";
import Navbar from "../components/Navbar";
import DashboardStatus from "../components/dashboard/DashboardStatus";
//import OrderBoard from "../components/Dashboard/OrderBoard";
const Orders = () => {

    const [orders, setOrders] = useState([]);
      const [isMenuOpen, setIsMenuOpen] = useState(false);
      const [searchTerm, setSearchTerm] = useState("");
return (
    <div className="relative h-screen overflow-hidden bg-[#0f0f0f] text-white">
      <Sidebar
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
      />

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
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />

        <main className="mt-3 px-4">
          <DashboardStatus orders={orders} />

          {/* <OrderBoard
            orders={filteredOrders}
            updateStatus={updateStatus}
          /> */}
        </main>
      </div>
    </div>
  );
}

export default Orders