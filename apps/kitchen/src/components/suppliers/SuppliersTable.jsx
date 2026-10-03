import { useCallback, useEffect, useState } from "react";
import { FiEdit2, FiEye } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

import API_BASE_URL from "../../config/api";
import Table from "../ui/Table";
import SuppliersViewModal from "./SuppliersViewModal";
import Pagination from "../ui/Pagination";

const EMPTY_FILTER_VALUES = {};

const ITEMS_PER_PAGE = 5;

const SuppliersTable = ({
  searchTerm = "",
  filterValues = EMPTY_FILTER_VALUES,
}) => {
  const navigate = useNavigate();

  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedSupplier, setSelectedSupplier] = useState(null);

  const [showViewModal, setShowViewModal] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);

  const fetchSuppliers = useCallback(async () => {
    const params = new URLSearchParams();

    if (searchTerm.trim()) {
      params.append("search", searchTerm.trim());
    }

    if (filterValues.category && filterValues.category !== "ALL") {
      params.append("category", filterValues.category);
    }

    if (filterValues.status && filterValues.status !== "ALL") {
      params.append("status", filterValues.status);
    }

    const response = await fetch(
      `${API_BASE_URL}/inventory/suppliers?${params.toString()}`,
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch suppliers");
    }

    return data.data || data;
  }, [searchTerm, filterValues.category, filterValues.status]);

  useEffect(() => {
    let cancelled = false;

    const loadSuppliers = async () => {
      setLoading(true);

      try {
        const supplierData = await fetchSuppliers();

        if (cancelled) {
          return;
        }

        setSuppliers(Array.isArray(supplierData) ? supplierData : []);
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error("Fetch suppliers error:", error);

        setSuppliers([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadSuppliers();

    return () => {
      cancelled = true;
    };
  }, [fetchSuppliers]);

  const handleView = (supplier) => {
    setSelectedSupplier(supplier);
    setShowViewModal(true);
  };

  const handleEdit = (supplier) => {
    navigate(`/inventory/suppliers/edit-suppliers/${supplier._id}`);
  };

  const totalPages = Math.max(Math.ceil(suppliers.length / ITEMS_PER_PAGE), 1);

  const displayPage = Math.min(currentPage, totalPages);

  const startIndex = (displayPage - 1) * ITEMS_PER_PAGE;

  const paginatedSuppliers = suppliers.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  const columns = [
    {
      key: "serialNo",
      label: "S.No",
      render: (_, index) => startIndex + index + 1,
    },

    {
      key: "supplierName",
      label: "Supplier Name",
      render: (row) => row.supplierName || "-",
    },

    {
      key: "contactPerson",
      label: "Contact",
      render: (row) => row.contactPerson || "-",
    },

    {
      key: "categories",
      label: "Categories",
      render: (row) => {
        const categories = Array.isArray(row.categories) ? row.categories : [];

        if (categories.length === 0) {
          return "-";
        }

        if (categories.length === 1) {
          return categories[0];
        }

        if (categories.length === 2) {
          return `${categories[0]} & ${categories[1]}`;
        }

        return `${categories.slice(0, -1).join(", ")} & ${
          categories[categories.length - 1]
        }`;
      },
    },

    {
      key: "email",
      label: "Email",
      render: (row) => row.email || "-",
    },

    {
      key: "status",
      label: "Status",
      render: (row) => (
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${
            row.status === "ACTIVE"
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-red-500/10 text-red-400"
          }`}
        >
          {row.status}
        </span>
      ),
    },

    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => handleView(row)}
            className="rounded-md p-2 text-gray-400 transition hover:bg-gray-800 hover:text-white"
            title="View supplier"
          >
            <FiEye size={14} />
          </button>

          <button
            type="button"
            onClick={() => handleEdit(row)}
            className="rounded-md p-2 text-gray-400 transition hover:bg-gray-800 hover:text-white"
            title="Edit supplier"
          >
            <FiEdit2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="px-4 py-10 text-center text-sm text-gray-500">
        Loading suppliers...
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table
          columns={columns}
          data={paginatedSuppliers}
          emptyMessage="No suppliers found"
        />
      </div>

      {suppliers.length > 0 && (
        <Pagination
          currentPage={displayPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {showViewModal && (
        <SuppliersViewModal
          supplier={selectedSupplier}
          onClose={() => {
            setShowViewModal(false);
            setSelectedSupplier(null);
          }}
        />
      )}
    </>
  );
};

export default SuppliersTable;
