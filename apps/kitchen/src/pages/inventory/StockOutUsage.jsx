import { useEffect, useState } from "react";

import API_BASE_URL from "../../config/api.js";

import Navbar from "../../components/ui/Navbar.jsx";
import Sidebar from "../../components/Hamburger/SideBar.jsx";
import StockOut from "../../components/inventory/StockOut.jsx";

import { FaArrowDown } from "react-icons/fa6";
import { FiDownload } from "react-icons/fi";

import {
  fetchUsageHistory,
  generateUsageReportPDF,
} from "../../utils/stockOutUsageUtils.js";

const StockOutUsage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [navbarSearchTerm, setNavbarSearchTerm] = useState("");
  const [usageHistory, setUsageHistory] = useState([]);

  useEffect(() => {
    const loadUsageHistory = async () => {
      try {
        const data = await fetchUsageHistory(API_BASE_URL);
        setUsageHistory(data);
      } catch (error) {
        console.error("Failed to fetch usage history:", error);
      }
    };

    loadUsageHistory();
  }, []);

  const handleViewUsageReport = () => {
    generateUsageReportPDF(usageHistory);
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
          icon={<FaArrowDown />}
          iconColor="text-red-500"
          bgColor="bg-red-500/10"
          title="Stock Out/Usage"
          subtitle="Record ingredients and supplies used from inventory."
          breadcrumb="Inventory → Stock Out"
          showPageHeading
          pageAction={
            <button
              type="button"
              onClick={handleViewUsageReport}
              className="flex items-center gap-2 rounded-lg border border-slate-400/30 bg-slate-400/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-400 hover:text-black"
            >
              <FiDownload size={14} />
              View Usage Report
            </button>
          }
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          navbarSearchTerm={navbarSearchTerm}
          setNavbarSearchTerm={setNavbarSearchTerm}
        />

        <main className="mt-3 px-4">
          <StockOut />
        </main>
      </div>
    </div>
  );
};

export default StockOutUsage;
