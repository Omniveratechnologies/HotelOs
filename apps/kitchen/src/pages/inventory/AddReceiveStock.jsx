import { useEffect, useState } from "react";

import API_BASE_URL from "../../config/api.js";

import Navbar from "../../components/ui/Navbar.jsx";
import Sidebar from "../../components/Hamburger/SideBar.jsx";
import ReceiveStock from "../../components/inventory/ReceiveStock.jsx";

import { FiPackage, FiDownload } from "react-icons/fi";

import {
  fetchPurchaseOrder,
  generatePurchaseOrderPDF,
} from "../../utils/addReceivePurchaseOrderUtils.js";

const AddReceiveStock = ({ onClose }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [navbarSearchTerm, setNavbarSearchTerm] = useState("");
  const [purchaseOrder, setPurchaseOrder] = useState([]);

  useEffect(() => {
    const loadPurchaseOrder = async () => {
      try {
        const data = await fetchPurchaseOrder(API_BASE_URL);
        setPurchaseOrder(data);
      } catch (error) {
        console.error("Failed to fetch purchase history:", error);
      }
    };

    loadPurchaseOrder();
  }, []);

  const handlePurchaseOrder = () => {
    generatePurchaseOrderPDF(purchaseOrder);
  };

  return (
    <div className="relative h-screen overflow-hidden bg-[#0f0f0f] text-white">
      <Sidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

      <div
        className={`h-full overflow-y-auto transition-transform duration-300 ease-in-out ${
          isMenuOpen ? "translate-x-64" : "translate-x-0"
        }`}
      >
        <Navbar
          icon={<FiPackage />}
          iconColor="text-emerald-500"
          bgColor="bg-emerald-500/10"
          title="Add/Receive Stock"
          subtitle="Record new stock received from the suppliers and update your inventory."
          isMenuOpen={isMenuOpen}
          breadcrumb="Inventory → Add/Receive Stock"
          pageAction={
            <button
              type="button"
              onClick={handlePurchaseOrder}
              className="flex items-center gap-2 rounded-lg border border-slate-400/30 bg-slate-400/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-400 hover:text-black"
            >
              <FiDownload size={14} />
              View Purchase Order
            </button>
          }
          showPageHeading
          setIsMenuOpen={setIsMenuOpen}
          navbarSearchTerm={navbarSearchTerm}
          setNavbarSearchTerm={setNavbarSearchTerm}
        />

        <main className="mt-3 px-4">
          <ReceiveStock />
        </main>
      </div>
    </div>
  );
};

export default AddReceiveStock;
