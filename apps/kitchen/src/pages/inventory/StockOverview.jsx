import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiDownload, FiPlus } from "react-icons/fi";

import Navbar from "../../components/ui/Navbar.jsx";
import Sidebar from "../../components/Hamburger/SideBar.jsx";
import { generateInventoryReport } from "../../utils/inventoryReport.js";

import StockOverviewCards from "../../components/stockOverview/StockOverviewCards.jsx";
import StockOverviewTabs from "../../components/stockOverview/StockOverviewTabs.jsx";
import StockOverviewTable from "../../components/stockOverview/StockOverviewTable.jsx";
import QuickActionsCard from "../../components/stockOverview/QuickActionsCard.jsx";
import LowStockAlertsCard from "../../components/stockOverview/LowStockAlertsCard.jsx";
import RecentActivitiesCard from "../../components/stockOverview/RecentActivitiesCard.jsx";

const StockOverview = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [refreshKey, setRefreshKey] = useState(0);
  const [latestItems, setLatestItems] = useState([]);

  const navigate = useNavigate();

  const handleDownloadReport = () => {
    generateInventoryReport(latestItems);
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
          title="Inventory Management"
          subtitle="Track and manage all raw materials, ingredients and supplies for your restaurant."
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          pageAction={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadReport}
                className="flex items-center gap-2 rounded-md border border-gray-700 px-3 py-2 text-xs font-medium text-gray-300 transition hover:border-gray-600 hover:text-white"
              >
                <FiDownload size={14} />
                Download Report
              </button>

              <button
                type="button"
                onClick={() => navigate("/inventory/add-item")}
                className="hover:bg-white-400 flex items-center gap-2 rounded-md bg-emerald-500 px-4 py-2 text-xs font-semibold text-black transition"
              >
                <FiPlus size={15} />
                Add Item
              </button>
            </div>
          }
          showPageHeading
        />

        <main className="space-y-4 px-4 py-4">
          <StockOverviewCards refreshKey={refreshKey} />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
            <div className="min-w-0 space-y-4">
              <StockOverviewTabs
                activeCategory={activeCategory}
                onChange={setActiveCategory}
                categories={categories}
              />

              <StockOverviewTable
                activeCategory={activeCategory}
                refreshKey={refreshKey}
              />
            </div>

            <div className="w-full space-y-4">
              <QuickActionsCard />
              <LowStockAlertsCard refreshKey={refreshKey} />
              <RecentActivitiesCard refreshKey={refreshKey} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default StockOverview;
