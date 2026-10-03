import { useEffect, useMemo, useState } from "react";
import { MdInventory } from "react-icons/md";

import Navbar from "../../components/ui/Navbar.jsx";
import Sidebar from "../../components/Hamburger/SideBar.jsx";
import PurchaseOrderCards from "../../components/purchaseOrders/PurchaseOrderCards.jsx";
import PurchaseOrderTable from "../../components/purchaseOrders/PurchaseOrderTable.jsx";
import Pagination from "../../components/ui/Pagination.jsx";
import FilterByDate from "../../components/ui/FilterByDate.jsx";
import Filters from "../../components/ui/Filters.jsx";
import SearchBar from "../../components/ui/SearchBar.jsx";
import API_BASE_URL from "../../config/api.js";
import { FaPlus } from "react-icons/fa6";

import PurchaseOrderViewModal from "../../components/purchaseOrders/PurchaseOrderViewModal.jsx";
import { useNavigate } from "react-router-dom";

const PurchaseOrder = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [navbarSearchTerm, setNavbarSearchTerm] = useState("");

  const [suppliers, setSuppliers] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);

  const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const [summary, setSummary] = useState({
    totalOrders: 0,
    draftOrders: 0,
    confirmedOrders: 0,
    partiallyReceivedOrders: 0,
    receivedOrders: 0,
    cancelledOrders: 0,
  });

  const [searchTerm, setSearchTerm] = useState("");

  const [filterValues, setFilterValues] = useState({
    supplier: "ALL",
    status: "ALL",
  });

  const [date, setDate] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 5;

  const filters = [
    {
      name: "supplier",
      options: [
        { value: "ALL", label: "All Suppliers" },
        ...suppliers.map((supplier) => ({
          value: supplier._id,
          label: supplier.supplierName,
        })),
      ],
    },
    {
      name: "status",
      options: [
        { value: "ALL", label: "All Status" },
        { value: "DRAFT", label: "Draft" },
        { value: "SENT", label: "Sent" },
        { value: "CONFIRMED", label: "Confirmed" },
        {
          value: "PARTIALLY_RECEIVED",
          label: "Partially Received",
        },
        { value: "RECEIVED", label: "Received" },
        { value: "CANCELLED", label: "Cancelled" },
      ],
    },
  ];

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/inventory/suppliers`);

        const result = await response.json();

        if (result.success) {
          setSuppliers(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch suppliers:", error);
      }
    };

    fetchSuppliers();
  }, []);

  useEffect(() => {
    const fetchPurchaseOrders = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/inventory/purchase-orders`,
        );

        const result = await response.json();

        console.log("Purchase Orders API status:", response.status);
        console.log("Purchase Orders API response:", result);

        if (response.ok && result.success && Array.isArray(result.data)) {
          setPurchaseOrders(result.data);
        } else {
          console.error("Invalid purchase orders response:", result);
        }
      } catch (error) {
        console.error("Failed to fetch purchase orders:", error);
      }
    };

    fetchPurchaseOrders();
  }, []);

  useEffect(() => {
    const fetchPurchaseOrderSummary = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/inventory/purchase-orders/summary`,
        );

        const result = await response.json();

        if (result.success) {
          setSummary(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch purchase order summary:", error);
      }
    };

    fetchPurchaseOrderSummary();
  }, []);

  const handleFilterChange = (name, value) => {
    setFilterValues((prev) => ({
      ...prev,
      [name]: value,
    }));

    setCurrentPage(1);
    console.log("Selected supplier:", filterValues.supplier);
  };

  const filteredPurchaseOrders = useMemo(() => {
    return purchaseOrders.filter((order) => {
      const searchValue = searchTerm.trim().toLowerCase();

      const matchesSearch =
        !searchValue ||
        order.poNumber?.toLowerCase().includes(searchValue) ||
        order.supplierName?.toLowerCase().includes(searchValue);

      const matchesSupplier =
        filterValues.supplier === "ALL" ||
        String(order.supplier?._id) === String(filterValues.supplier);

      const matchesStatus =
        filterValues.status === "ALL" || order.status === filterValues.status;

      const matchesDate =
        !date ||
        (order.orderDate &&
          new Date(order.orderDate).toISOString().slice(0, 10) === date);

      return matchesSearch && matchesSupplier && matchesStatus && matchesDate;
    });
  }, [purchaseOrders, searchTerm, filterValues, date]);

  const totalPages = Math.ceil(filteredPurchaseOrders.length / itemsPerPage);

  const paginatedPurchaseOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;

    return filteredPurchaseOrders.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPurchaseOrders, currentPage]);

  const handleEdit = (purchaseOrder) => {
    navigate(`/purchase-orders/edit/${purchaseOrder._id}`);
  };

  const handleDelete = async (purchaseOrder) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${purchaseOrder.poNumber}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/inventory/purchase-orders/${purchaseOrder._id}`,
        {
          method: "DELETE",
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to delete purchase order");
      }

      setPurchaseOrders((prev) =>
        prev.filter((order) => order._id !== purchaseOrder._id),
      );

      const summaryResponse = await fetch(
        `${API_BASE_URL}/inventory/purchase-orders/summary`,
      );

      const summaryResult = await summaryResponse.json();

      if (summaryResult.success) {
        setSummary(summaryResult.data);
      }
    } catch (error) {
      console.error("Delete purchase order error:", error);
    }
  };

  const handleView = (purchaseOrder) => {
    setSelectedPurchaseOrder(purchaseOrder);
    setIsViewModalOpen(true);
  };

  const handleViewOrderPage = (row) => {
    console.log("Navigating with id:", row._id);
    navigate(`/purchase-orders/${row._id}`);
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
          icon={<MdInventory />}
          iconColor="text-red-500"
          bgColor="bg-red-500/10"
          title="Purchase Order"
          subtitle="Create and manage purchase orders with suppliers."
          isMenuOpen={isMenuOpen}
          breadcrumb="Inventory → Purchase Order"
          showPageHeading
          setIsMenuOpen={setIsMenuOpen}
          navbarSearchTerm={navbarSearchTerm}
          setNavbarSearchTerm={setNavbarSearchTerm}
          pageAction={
            <button
              type="button"
              onClick={() => navigate("create-purchase-order")}
              className="hover:bg-white-500 flex items-center gap-2 rounded-lg border bg-emerald-400 p-2 text-sm text-black"
            >
              <FaPlus />
              Create Purchase Order
            </button>
          }
        />

        <main className="mt-3 px-4 pb-6">
          <PurchaseOrderCards summary={summary} />

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <SearchBar
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              placeholder="Search Purchase Orders"
            />

            <Filters
              filters={filters}
              values={filterValues}
              onChange={handleFilterChange}
            />

            <FilterByDate
              value={date}
              onChange={(value) => {
                setDate(value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="mt-4 overflow-hidden rounded-lg border border-gray-800">
            <PurchaseOrderTable
              purchaseOrders={paginatedPurchaseOrders}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onViewOrderPage={handleViewOrderPage}
            />

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </main>

        <PurchaseOrderViewModal
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false);
            setSelectedPurchaseOrder(null);
          }}
          purchaseOrder={selectedPurchaseOrder}
        />
      </div>
    </div>
  );
};

export default PurchaseOrder;
