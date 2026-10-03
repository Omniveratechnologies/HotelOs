import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Table from "../ui/Table.jsx";
import Pagination from "../ui/Pagination.jsx";
import StatusBadge from "../ui/StatusBadge.jsx";
import EditButton from "../ui/button/EditButton.jsx";
import DeleteButton from "../ui/button/DeleteButton.jsx";
import API_BASE_URL from "../../config/api.js";
import StockOverviewHeader from "./StockOverviewHeader.jsx";

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

  const [items, setItems] = useState([]);

  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalRecords: 0,
  });

  const [searchTerm, setSearchTerm] = useState("");

  const [filterValues, setFilterValues] = useState({
    supplier: "ALL",
    status: "ALL",
    category: "ALL",
    sortBy: "name",
  });

  const [supplierOptions, setSupplierOptions] = useState([]);

  const [page, setPage] = useState(1);

  const [reloadKey, setReloadKey] = useState(0);

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

    /*
     * Supplier filter
     */
    if (filterValues.supplier !== "ALL") {
      filteredItems = filteredItems.filter(
        (item) => item.supplierName === filterValues.supplier,
      );
    }

    /*
     * Status filter
     */
    if (filterValues.status !== "ALL") {
      filteredItems = filteredItems.filter(
        (item) => item.status === filterValues.status,
      );
    }

    /*
     * Category filter
     */
    if (filterValues.category !== "ALL") {
      filteredItems = filteredItems.filter(
        (item) => item.category === filterValues.category,
      );
    }

    /*
     * Category tab filter
     */
    if (activeCategory && activeCategory !== "ALL") {
      filteredItems = filteredItems.filter(
        (item) => item.category === activeCategory,
      );
    }

    /*
     * Sorting
     */
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

    /*
     * Pagination
     */
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

  /*
   * Load inventory data.
   *
   * fetchItems() only returns data.
   * State is updated here after the async operation completes.
   */
  useEffect(() => {
    const loadItems = async () => {
      try {
        const result = await fetchItems();

        setItems(result.paginatedItems);
        setPagination(result.pagination);

        onDataLoaded?.(result.filteredItems);
      } catch (error) {
        console.error("Failed to load inventory items:", error);

        setItems([]);

        setPagination({
          page: 1,
          totalPages: 1,
          totalRecords: 0,
        });

        onDataLoaded?.([]);
      }
    };

    loadItems();
  }, [fetchItems, refreshKey, reloadKey, onDataLoaded]);

  /*
   * Search change
   */
  const handleSearchChange = (value) => {
    setPage(1);
    setSearchTerm(value);
  };

  /*
   * Filter change
   */
  const handleFilterChange = (name, value) => {
    setPage(1);

    setFilterValues((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /*
   * Delete item
   */
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

      /*
       * Trigger the loading effect again.
       */
      setReloadKey((previous) => previous + 1);
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
      key: "minimumStock",
      label: "Min. Stock",
    },

    {
      key: "expiryDate",
      label: "Expiry Date",
      render: (row) => {
        if (!row.expiryDate) {
          return "-";
        }

        const label = daysLeftLabel(row.expiryDate);

        return (
          <div>
            <div>
              {new Date(row.expiryDate).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </div>

            {label && (
              <div className={`text-[10px] ${label.color}`}>{label.text}</div>
            )}
          </div>
        );
      },
    },

    {
      key: "supplierName",
      label: "Supplier",
      render: (row) => row.supplierName || "-",
    },

    {
      key: "status",
      label: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },

    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="flex items-center justify-center gap-1">
          <EditButton
            onClick={() => navigate(`/inventory/add-item?id=${row._id}`)}
          />

          <DeleteButton onClick={() => handleDelete(row)} />
        </div>
      ),
    },
  ];

  return (
    <div className="bg-slate rounded-xl border border-gray-800/70 p-5">
      <div className="mb-4">
        <StockOverviewHeader
          searchTerm={searchTerm}
          setSearchTerm={handleSearchChange}
          filterValues={filterValues}
          onFilterChange={handleFilterChange}
          supplierOptions={supplierOptions}
        />
      </div>

      <Table
        columns={columns}
        data={items}
        emptyMessage="No inventory items found"
      />

      <div className="mt-2 flex items-center justify-between">
        <p className="px-2 text-xs text-gray-500">
          Showing {items.length === 0 ? 0 : (pagination.page - 1) * limit + 1}-
          {(pagination.page - 1) * limit + items.length} of{" "}
          {pagination.totalRecords} items
        </p>

        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
};

export default StockOverviewTable;
