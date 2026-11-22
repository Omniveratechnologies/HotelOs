import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

import Table from "@/components/ui/Table.jsx";
import Pagination from "@/components/ui/Pagination.jsx";
import StatusBadge from "@/components/ui/StatusBadge.jsx";
import EditButton from "@/components/ui/button/EditButton.jsx";
import DeleteButton from "@/components/ui/button/DeleteButton.jsx";
import API_BASE_URL from "@/config/api.js";
import StockOverviewHeader from "./StockOverviewHeader.jsx";
import { useAsyncData } from "@/hooks/useAsyncData.js";

const daysLeftLabel = (expiryDate) => {
  if (!expiryDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);

  const diffDays = Math.round((expiry - today) / 86400000);

  if (diffDays < 0) {
    return {
      text: "Expired",
      color: "text-red-500",
    };
  }

  if (diffDays === 0) {
    return {
      text: "Today",
      color: "text-red-500",
    };
  }

  if (diffDays <= 7) {
    return {
      text: `${diffDays} days left`,
      color: "text-red-400",
    };
  }

  return null;
};

const StockOverviewTable = ({ activeCategory, refreshKey, onDataLoaded }) => {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");

  const [filterValues, setFilterValues] = useState({
    supplier: "ALL",
    status: "ALL",
    category: "ALL",
    sortBy: "name",
  });

  const [supplierOptions, setSupplierOptions] = useState([]);

  const [page, setPage] = useState(1);

  const limit = 10;

  /*
   * Load suppliers
   */
  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/inventory/suppliers`);

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to load suppliers");
        }

        const options = (data.data || []).map((supplier) => ({
          value: supplier.supplierName,
          label: supplier.supplierName,
        }));

        setSupplierOptions(options);
      } catch (error) {
        console.error("Failed to load suppliers:", error);
        setSupplierOptions([]);
      }
    };

    loadSuppliers();
  }, []);

  /*
   * Fetch, filter and prepare inventory data.
   *
   * IMPORTANT:
   * This function does NOT call setState().
   * It only returns the calculated data.
   */
  const fetchItems = useCallback(async () => {
    const response = await fetch(`${API_BASE_URL}/inventory/items`);

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Failed to load inventory items");
    }

    const inventoryItems = Array.isArray(data.data) ? data.data : [];

    let filteredItems = [...inventoryItems];

    /*
     * Search
     */
    const trimmedSearch = searchTerm.trim();

    if (trimmedSearch) {
      const search = trimmedSearch.toLowerCase();

      filteredItems = filteredItems.filter((item) => {
        const itemName = item.name?.toLowerCase() || "";
        const category = item.category?.toLowerCase() || "";
        const supplier = item.supplierName?.toLowerCase() || "";

        return (
          itemName.includes(search) ||
          category.includes(search) ||
          supplier.includes(search)
        );
      });
    }

    if (filterValues.supplier !== "ALL") {
      filteredItems = filteredItems.filter(
        (item) => item.supplierName === filterValues.supplier,
      );
    }

    if (filterValues.status !== "ALL") {
      filteredItems = filteredItems.filter(
        (item) => item.status === filterValues.status,
      );
    }

    if (filterValues.category !== "ALL") {
      filteredItems = filteredItems.filter(
        (item) => item.category === filterValues.category,
      );
    }

    if (activeCategory && activeCategory !== "ALL") {
      filteredItems = filteredItems.filter(
        (item) => item.category === activeCategory,
      );
    }

    if (filterValues.sortBy === "name") {
      filteredItems = filteredItems.toSorted((a, b) =>
        (a.name || "").localeCompare(b.name || ""),
      );
    }

    if (filterValues.sortBy === "stock") {
      filteredItems = filteredItems.toSorted(
        (a, b) => Number(a.currentStock || 0) - Number(b.currentStock || 0),
      );
    }

    if (filterValues.sortBy === "expiry") {
      filteredItems = filteredItems.toSorted((a, b) => {
        if (!a.expiryDate && !b.expiryDate) {
          return 0;
        }

        if (!a.expiryDate) {
          return 1;
        }

        if (!b.expiryDate) {
          return -1;
        }

        return new Date(a.expiryDate) - new Date(b.expiryDate);
      });
    }

    const totalRecords = filteredItems.length;

    const totalPages = Math.max(Math.ceil(totalRecords / limit), 1);

    const currentPage = Math.min(page, totalPages);

    const startIndex = (currentPage - 1) * limit;

    const paginatedItems = filteredItems.slice(startIndex, startIndex + limit);

    return {
      filteredItems,
      paginatedItems,
      pagination: {
        page: currentPage,
        totalPages,
        totalRecords,
      },
    };
  }, [
    searchTerm,
    filterValues.supplier,
    filterValues.status,
    filterValues.category,
    filterValues.sortBy,
    activeCategory,
    page,
  ]);

  const { data: fetchResult, loading, refresh } = useAsyncData(fetchItems, [
    searchTerm,
    filterValues.supplier,
    filterValues.status,
    filterValues.category,
    filterValues.sortBy,
    activeCategory,
    page,
    refreshKey,
  ]);

  const items = fetchResult?.paginatedItems || [];
  const pagination = fetchResult?.pagination || { page: 1, totalPages: 1, totalRecords: 0 };

  const filteredItemsRef = useRef([]);

  useEffect(() => {
    filteredItemsRef.current = fetchResult?.filteredItems || [];
  }, [fetchResult]);

  useEffect(() => {
    onDataLoaded?.(filteredItemsRef.current);
  }, [onDataLoaded, filteredItemsRef]);

  const handleSearchChange = (value) => {
    setPage(1);
    setSearchTerm(value);
  };

  const handleFilterChange = (name, value) => {
    setPage(1);

    setFilterValues((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // These are passed to StockOverviewHeader; mark as intentionally unused here
  void handleSearchChange;
  void handleFilterChange;

  const handleDelete = async (row) => {
    const confirmed = window.confirm(`Delete "${row.name}" from inventory?`);

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/inventory/items/${row._id}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete item");
      }

      refresh();
    } catch (error) {
      console.error("Delete item error:", error);

      alert(error.message || "Failed to delete item.");
    }
  };

  const columns = [
    {
      key: "serialNumber",
      label: "#",
      render: (_, index) =>
        `#${String((pagination.page - 1) * limit + index + 1).padStart(
          3,
          "0",
        )}`,
    },

    {
      key: "name",
      label: "Item Name",
      render: (row) => (
        <span className="font-medium text-white">{row.name}</span>
      ),
    },

    {
      key: "category",
      label: "Category",
    },

    {
      key: "currentStock",
      label: "Current Stock",
    },

    {
      key: "unit",
      label: "Unit",
    },

    {
      key: "supplierName",
      label: "Supplier",
    },

    {
      key: "status",
      label: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },

    {
      key: "expiry",
      label: "Expiry",
      render: (row) => {
        const days = daysLeftLabel(row.expiryDate);
        if (!days) return null;
        return (
          <span className={`text-xs font-medium ${days.color}`}>{days.text}</span>
        );
      },
    },

    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="flex items-center justify-center gap-1">
          <EditButton
            onClick={() => navigate(`/inventory/edit/${row._id}`)}
            aria-label={`Edit ${row.name}`}
          />
          <DeleteButton onClick={() => handleDelete(row)} aria-label={`Delete ${row.name}`} />
        </div>
      ),
    },
  ];

  return (
    <section className="bg-slate rounded-xl border border-gray-800/70 p-5">
      <StockOverviewHeader
        activeCategory={activeCategory}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterValues={filterValues}
        setFilterValues={setFilterValues}
        supplierOptions={supplierOptions}
        loading={loading}
      />

      <Table
        columns={columns}
        data={items}
        emptyMessage="No inventory items found"
        loading={loading}
        minWidthClass="min-w-[1100px]"
      />

      <div className="mt-4 flex items-center justify-between">
        <p className="px-2 text-xs text-gray-500">
          Showing {items.length === 0 ? 0 : (pagination.page - 1) * limit + 1}-
          {(pagination.page - 1) * limit + items.length} of {pagination.totalRecords}{" "}
          records
        </p>

        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={setPage}
          totalItems={pagination.totalRecords}
          pageSize={limit}
          itemLabel="items"
        />
      </div>
    </section>
  );
};

export default StockOverviewTable;