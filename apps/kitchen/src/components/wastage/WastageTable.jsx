import { useEffect, useState } from "react";
import Table from "../ui/Table.jsx";
import Tabs from "../ui/Tabs.jsx";
import ExpiryAlertsTable from "./ExpiryAlertsTable.jsx";
import BatchManagementTable from "./BatchManagementTable.jsx";
import Pagination from "../ui/Pagination.jsx";
import SearchBar from "../ui/SearchBar.jsx";
import Filters from "../ui/Filters.jsx";
import EditButton from "../ui/button/EditButton.jsx";
import DeleteButton from "../ui/button/DeleteButton.jsx";
import API_BASE_URL from "../../config/api.js";

const REASON_BADGE_COLOR = {
  EXPIRED: "text-red-400",
  SPOILED: "text-orange-400",
  DAMAGED: "text-yellow-400",
  OVERPRODUCTION: "text-blue-400",
  BURNT: "text-purple-400",
  DROPPED: "text-green-400",
  UNKNOWN: "text-gray-400",
};

const REASON_FILTER_OPTIONS = [
  { value: "ALL", label: "All Reasons" },
  { value: "EXPIRED", label: "Expired" },
  { value: "SPOILED", label: "Spoiled" },
  { value: "DAMAGED", label: "Damaged" },
  { value: "OVERPRODUCTION", label: "Overproduction" },
  { value: "BURNT", label: "Burnt" },
  { value: "DROPPED", label: "Dropped" },
  { value: "UNKNOWN", label: "Unknown" },
];

const DEPARTMENT_FILTER_OPTIONS = [
  { value: "ALL", label: "All Departments" },
  { value: "Kitchen", label: "Kitchen" },
  { value: "Prep Area", label: "Prep Area" },
  { value: "Storage", label: "Storage" },
  { value: "Bar", label: "Bar" },
];

const PERIOD_FILTER_OPTIONS = [
  { value: "All Time", label: "All Time" },
  { value: "Today", label: "Today" },
  { value: "This Week", label: "This Week" },
  { value: "This Month", label: "This Month" },
];

const TAB_OPTIONS = [
  { value: "history", label: "Wastage History" },
  { value: "expiry", label: "Expiry Alerts" },
  { value: "batch", label: "Batch Management" },
];

const WastageTable = ({ onEdit, refreshKey, onDeleted }) => {
  const [activeTab, setActiveTab] = useState("history");
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalRecords: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterValues, setFilterValues] = useState({
    reason: "ALL",
    department: "ALL",
    period: "All Time",
  });
  const [page, setPage] = useState(1);
  const limit = 5;

  const fetchRecords = async () => {
    try {
      const params = new URLSearchParams({
        search: searchTerm,
        reason: filterValues.reason,
        department: filterValues.department,
        period: filterValues.period,
        page,
        limit,
      });

      const res = await fetch(
        `${API_BASE_URL}/inventory/wastage?${params.toString()}`,
      );
      const data = await res.json();

      if (!res.ok || !data.success) throw new Error(data.message);

      setRecords(data.data.records);
      setPagination(data.data.pagination);
    } catch (err) {
      console.error("Failed to load wastage history:", err);
    }
  };

  useEffect(() => {
    if (activeTab !== "history") return;
    fetchRecords();
  }, [searchTerm, filterValues, page, refreshKey, activeTab]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterValues]);

  const handleDelete = async (row) => {
    const confirmed = window.confirm(
      `Delete wastage record for "${row.itemName}"? This will restore ${row.quantity} ${row.unit} back to stock.`,
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`${API_BASE_URL}/inventory/wastage/${row._id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok || !data.success) throw new Error(data.message);

      await fetchRecords();
      onDeleted?.();
    } catch (err) {
      console.error("Delete wastage error:", err);
      alert(err.message || "Failed to delete record.");
    }
  };

  const columns = [
    {
      key: "serialNumber",
      label: "#",
      render: (_, i) => (page - 1) * limit + i + 1,
    },
    {
      key: "date",
      label: "Date",
      render: (row) =>
        new Date(row.date).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
    },
    { key: "itemName", label: "Item Name" },
    {
      key: "batchNumber",
      label: "Batch No.",
      render: (row) => row.batchNumber || "-",
    },
    { key: "quantity", label: "Quantity" },
    { key: "unit", label: "Unit" },
    {
      key: "reason",
      label: "Reason",
      render: (row) => (
        <span
          className={`text-xs font-medium ${REASON_BADGE_COLOR[row.reason] || "text-gray-400"}`}
        >
          {row.reason}
        </span>
      ),
    },
    { key: "department", label: "Department" },
    {
      key: "totalCost",
      label: "Cost (₹)",
      render: (row) => `₹${Number(row.totalCost || 0).toLocaleString("en-IN")}`,
    },
    { key: "notes", label: "Notes", render: (row) => row.notes || "-" },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="flex items-center justify-center gap-1">
          <EditButton onClick={() => onEdit?.(row)} />
          <DeleteButton onClick={() => handleDelete(row)} />
        </div>
      ),
    },
  ];

  return (
    <div className="bg-slate rounded-xl border border-gray-800/70 p-5">
      <div className="mb-4">
        <Tabs
          tabs={TAB_OPTIONS}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {activeTab === "history" && (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-white">
              Wastage History
            </h2>

            <div className="flex flex-wrap items-center gap-3">
              <SearchBar
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                placeholder="Search items..."
              />

              <Filters
                filters={[
                  { name: "reason", options: REASON_FILTER_OPTIONS },
                  { name: "department", options: DEPARTMENT_FILTER_OPTIONS },
                  { name: "period", options: PERIOD_FILTER_OPTIONS },
                ]}
                values={filterValues}
                onChange={(name, value) =>
                  setFilterValues((prev) => ({ ...prev, [name]: value }))
                }
              />
            </div>
          </div>

          <Table
            columns={columns}
            data={records}
            emptyMessage="No wastage records found"
          />

          <div className="mt-2 flex items-center justify-between">
            <p className="px-2 text-xs text-gray-500">
              Showing {records.length === 0 ? 0 : (page - 1) * limit + 1}-
              {(page - 1) * limit + records.length} of {pagination.totalRecords}{" "}
              records
            </p>

            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={setPage}
            />
          </div>
        </>
      )}

      {activeTab === "expiry" && <ExpiryAlertsTable refreshKey={refreshKey} />}

      {activeTab === "batch" && (
        <BatchManagementTable refreshKey={refreshKey} />
      )}
    </div>
  );
};

export default WastageTable;
