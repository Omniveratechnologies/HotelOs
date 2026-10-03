import { useEffect, useState } from "react";
import Table from "../ui/Table.jsx";
import StatusCard from "../ui/StatusCard.jsx";
import API_BASE_URL from "../../config/api.js";

const URGENCY_STYLE = {
  EXPIRED: "text-red-500 font-semibold",
  TODAY: "text-orange-400 font-semibold",
  "3_DAYS": "text-yellow-400",
  "7_DAYS": "text-blue-400",
  SAFE: "text-gray-400",
};

const URGENCY_LABEL = {
  EXPIRED: "Expired",
  TODAY: "Today",
  "3_DAYS": "3 Days Left",
  "7_DAYS": "7 Days Left",
  SAFE: "Safe",
};

const ExpiryAlertsTable = ({ refreshKey }) => {
  const [batches, setBatches] = useState([]);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/inventory/batches/expiring?days=7`)
      .then((res) => res.json())
      .then((data) => setBatches(data.data || []))
      .catch((err) => console.error("Failed to load expiring batches:", err));

    fetch(`${API_BASE_URL}/inventory/batches/expiry-summary`)
      .then((res) => res.json())
      .then((data) => setSummary(data.data))
      .catch((err) => console.error("Failed to load expiry summary:", err));
  }, [refreshKey]);

  const columns = [
    { key: "itemName", label: "Item" },
    {
      key: "batchNumber",
      label: "Batch No.",
      render: (row) => row.batchNumber || "-",
    },
    {
      key: "quantity",
      label: "Quantity",
      render: (row) => `${row.quantity} ${row.unit}`,
    },
    { key: "supplierName", label: "Supplier" },
    {
      key: "expiryDate",
      label: "Expiry Date",
      render: (row) =>
        row.expiryDate
          ? new Date(row.expiryDate).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "-",
    },
    {
      key: "urgency",
      label: "Status",
      render: (row) => (
        <span
          className={`text-xs ${URGENCY_STYLE[row.urgency] || "text-gray-400"}`}
        >
          {URGENCY_LABEL[row.urgency] || row.urgency}
        </span>
      ),
    },
  ];

  return (
    <div>
      {summary && (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <StatusCard
            title="Already Expired"
            value={summary.expiredCount}
            iconColor="text-red-400"
            iconBg="bg-red-950"
          />
          <StatusCard
            title="Expiring Today"
            value={summary.expiringTodayCount}
            iconColor="text-orange-400"
            iconBg="bg-orange-950"
          />
          <StatusCard
            title="Expiring in 3 Days"
            value={summary.expiring3DaysCount}
            iconColor="text-yellow-400"
            iconBg="bg-yellow-950"
          />
          <StatusCard
            title="Est. Value at Risk"
            value={`₹${Number(summary.estimatedValueAtRisk || 0).toLocaleString("en-IN")}`}
            iconColor="text-purple-400"
            iconBg="bg-purple-950"
          />
        </div>
      )}

      <Table
        columns={columns}
        data={batches}
        emptyMessage="No batches expiring in the next 7 days"
      />
    </div>
  );
};

export default ExpiryAlertsTable;
