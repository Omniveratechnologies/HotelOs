import { useEffect, useState } from "react";

import API_BASE_URL from "../../config/api.js";

import Navbar from "../../components/ui/Navbar.jsx";
import Sidebar from "../../components/Hamburger/SideBar.jsx";

import { IoWarning } from "react-icons/io5";
import { FiDownload, FiShoppingCart } from "react-icons/fi";
import LowStockItemsCard from "../../components/lowStockItems/LowStockItemsCard.jsx";
import LowStockItemsHeader from "../../components/lowStockItems/LowStockItemsHeader.jsx";
import LowStockItemsTable from "../../components/lowStockItems/LowStockItemsTable.jsx";
import LowStockItemsFilterCard from "../../components/lowStockItems/LowStockItemsFilterCard.jsx";
import LowStockItemsViewModal from "../../components/lowStockItems/LowStockItemsViewModal.jsx";
import LowStockItemsReorderModal from "../../components/lowStockItems/LowStockItemsReorderModal.jsx";
import BulkActionsCard from "../../components/lowStockItems/BulkActionsCard.jsx";
import ReorderSummaryCard from "../../components/lowStockItems/ReorderSummaryCard.jsx";
import Pagination from "../../components/ui/Pagination.jsx";
import {
  exportLowStockToExcel,
  printLowStockList,
  createPurchaseOrder,
} from "../../utils/lowStockItemsUtils.js";
import { useNavigate } from "react-router-dom";

const LowStockItems = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [navbarSearchTerm, setNavbarSearchTerm] = useState("");

  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedItem, setSelectedItem] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [lowStockItems, setLowStockItems] = useState([]);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const [filterValues, setFilterValues] = useState({
    statuses: {
      critical: true,
      low: true,
      outOfStock: true,
    },
    category: "all",
    supplier: "all",
    sortBy: "currentStockAsc",
  });

  const fetchLowStockItems = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/inventory/low-stock`);

      if (!response.ok) {
        throw new Error("Failed to fetch low stock items");
      }

      const result = await response.json();

      if (result.success) {
        setLowStockItems(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch low stock items:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchaseHistory = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/inventory/purchase-history`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch purchase history");
      }

      const result = await response.json();

      if (result.success) {
        setPurchaseHistory(result.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch purchase history:", error);
    }
  };

  useEffect(() => {
    fetchLowStockItems();
    fetchPurchaseHistory();
  }, []);

  const tabs = [
    {
      label: `All (${lowStockItems.length})`,
      value: "all",
    },
    {
      label: `Critical (${
        lowStockItems.filter((item) => item.status === "CRITICAL").length
      })`,
      value: "critical",
    },
    {
      label: `Low (${
        lowStockItems.filter((item) => item.status === "LOW").length
      })`,
      value: "low",
    },
    {
      label: `Out of Stock (${
        lowStockItems.filter((item) => item.status === "OUT OF STOCK").length
      })`,
      value: "outOfStock",
    },
  ];

  const handleApplyFilters = (filters) => {
    setFilterValues(filters);
  };

  const handleClearFilters = (filters) => {
    setFilterValues(filters);
  };

  const getSupplierForItem = (item) => {
    const purchase = purchaseHistory.find((purchase) => {
      const purchaseItemId =
        purchase.inventoryItem?._id || purchase.inventoryItem;

      return purchaseItemId === item._id;
    });

    return purchase?.supplierName || "";
  };

  const filteredItems = lowStockItems
    .filter((item) => {
      if (activeTab === "critical" && item.status !== "CRITICAL") {
        return false;
      }

      if (activeTab === "low" && item.status !== "LOW") {
        return false;
      }

      if (activeTab === "outOfStock" && item.status !== "OUT OF STOCK") {
        return false;
      }

      if (
        searchTerm &&
        !item.name.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }

      const statusAllowed =
        (item.status === "CRITICAL" && filterValues.statuses.critical) ||
        (item.status === "LOW" && filterValues.statuses.low) ||
        (item.status === "OUT OF STOCK" && filterValues.statuses.outOfStock);

      if (!statusAllowed) {
        return false;
      }

      if (
        filterValues.category !== "all" &&
        item.category !== filterValues.category
      ) {
        return false;
      }

      if (filterValues.supplier !== "all") {
        const supplier = getSupplierForItem(item);

        if (supplier !== filterValues.supplier) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      switch (filterValues.sortBy) {
        case "currentStockDesc":
          return b.currentStock - a.currentStock;

        case "reorderQuantityDesc":
          return b.reorderQuantity - a.reorderQuantity;

        case "reorderQuantityAsc":
          return a.reorderQuantity - b.reorderQuantity;

        case "currentStockAsc":
        default:
          return a.currentStock - b.currentStock;
      }
    });

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handleView = (item) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  const handleReorder = (item) => {
    setSelectedItem(item);
    setShowReorderModal(true);
  };
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, filterValues]);

  const handleSelectAll = (items) => {
    const itemIds = items.map((item) => item._id);

    const allSelected =
      itemIds.length > 0 && itemIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(itemIds);
    }
  };

  const handleToggleItem = (itemId) => {
    setSelectedIds((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId],
    );
  };

  const handleCreatePurchaseOrder = async (selectedIds) => {
    try {
      const selectedItems = lowStockItems.filter((item) =>
        selectedIds.includes(item._id),
      );

      if (selectedItems.length === 0) {
        return;
      }

      const result = await createPurchaseOrder(selectedItems);

      console.log("Purchase order created:", result);

      setSelectedIds([]);
    } catch (error) {
      console.error("Create purchase order error:", error);
    }
  };

  const navigate = useNavigate("");
  const handlePurchaseHistory = () => {
    navigate("/inventory/purchase-orders/create-purchase-order");
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
          icon={<IoWarning />}
          iconColor="text-yellow-500"
          bgColor="bg-yellow-500/10"
          title="Low Stock Items"
          subtitle="Items that are at or below the minimum stock level. Take action to avoid stockouts"
          isMenuOpen={isMenuOpen}
          breadcrumb="Inventory → Low Stock Items"
          showPageHeading
          setIsMenuOpen={setIsMenuOpen}
          navbarSearchTerm={navbarSearchTerm}
          setNavbarSearchTerm={setNavbarSearchTerm}
          pageAction={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => exportLowStockToExcel(lowStockItems)}
                className="flex items-center gap-2 rounded-md border border-gray-700 px-3 py-2 text-xs font-medium text-gray-300 transition hover:border-gray-600 hover:bg-gray-800 hover:text-white"
              >
                <FiDownload size={14} />
                <span>Export</span>
              </button>

              <button
                type="button"
                onClick={handlePurchaseHistory}
                className="hover:bg-white-300 flex items-center gap-2 rounded-md bg-emerald-400 px-3 py-2 text-xs font-semibold text-black transition"
              >
                <FiShoppingCart size={14} />
                <span>Purchase History</span>
              </button>
            </div>
          }
        />

        <main className="mt-3 px-4 pb-6">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_288px]">
            <div className="min-w-0">
              <LowStockItemsCard items={lowStockItems} />

              <section className="mt-4 rounded-xl border border-gray-800 bg-[#111111]">
                <div className="border-b border-gray-800 px-4 py-4">
                  <LowStockItemsHeader
                    tabs={tabs}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                  />
                </div>

                <div className="px-4 py-2">
                  <LowStockItemsTable
                    items={paginatedItems}
                    onReorder={handleReorder}
                    onView={handleView}
                    selectedIds={selectedIds}
                    onToggleItem={handleToggleItem}
                  />
                </div>

                <div className="border-t border-gray-800 px-4 py-3">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              </section>
            </div>

            <div className="flex flex-col gap-4">
              <LowStockItemsFilterCard
                items={lowStockItems}
                purchaseHistory={purchaseHistory}
                filterValues={filterValues}
                onApply={handleApplyFilters}
                onClear={handleClearFilters}
                onClose={() => setIsFilterOpen(false)}
              />

              <BulkActionsCard
                items={lowStockItems}
                selectedIds={selectedIds}
                onSelectAll={handleSelectAll}
                onCreatePurchaseOrder={handleCreatePurchaseOrder}
                onExportExcel={exportLowStockToExcel}
                onPrintList={printLowStockList}
              />

              <ReorderSummaryCard items={lowStockItems} />
            </div>
          </div>
        </main>

        {showViewModal && (
          <LowStockItemsViewModal
            item={selectedItem}
            onClose={() => {
              setShowViewModal(false);
              setSelectedItem(null);
            }}
          />
        )}

        {showReorderModal && (
          <LowStockItemsReorderModal
            item={selectedItem}
            onClose={(success) => {
              setShowReorderModal(false);
              setSelectedItem(null);

              if (success) {
                fetchLowStockItems();
                fetchPurchaseHistory();
              }
            }}
          />
        )}
      </div>
    </div>
  );
};

export default LowStockItems;
