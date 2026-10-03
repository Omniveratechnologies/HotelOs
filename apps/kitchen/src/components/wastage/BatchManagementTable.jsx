import { useEffect, useState } from "react";
import SearchBar from "../ui/SearchBar.jsx";
import API_BASE_URL from "../../config/api.js";

const URGENCY_DOT = {
  EXPIRED: "bg-red-500",
  TODAY: "bg-orange-400",
  "3_DAYS": "bg-yellow-400",
  "7_DAYS": "bg-blue-400",
  SAFE: "bg-emerald-500",
};

const BatchManagementTable = ({ refreshKey }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [items, setItems] = useState([]);
  const [expandedItem, setExpandedItem] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams({
      search: searchTerm,
      groupByItem: "true",
    });

    fetch(`${API_BASE_URL}/inventory/batches?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => setItems(data.data?.items || []))
      .catch((err) => console.error("Failed to load batches:", err));
  }, [searchTerm, refreshKey]);

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <SearchBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          placeholder="Search batch or supplier..."
        />
      </div>

      {items.length === 0 ? (
        <p className="py-10 text-center text-sm text-gray-500">
          No batches found
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((group) => {
            const isOpen = expandedItem === group.itemName;

            return (
              <div
                key={group.itemName}
                className="rounded-lg border border-gray-800"
              >
                <button
                  type="button"
                  onClick={() =>
                    setExpandedItem(isOpen ? null : group.itemName)
                  }
                  className="flex w-full items-center justify-between px-4 py-3 text-left"
                >
                  <div>
                    <p className="text-sm font-medium text-white">
                      {group.itemName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {group.batchCount} batch
                      {group.batchCount !== 1 ? "es" : ""} ·{" "}
                      {group.totalQuantity} total units
                    </p>
                  </div>
                  <span className="text-gray-500">{isOpen ? "−" : "+"}</span>
                </button>

                {isOpen && (
                  <div className="border-t border-gray-800 px-4 py-3">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-gray-500">
                          <th className="pb-2">Batch No.</th>
                          <th className="pb-2">Supplier</th>
                          <th className="pb-2">Qty</th>
                          <th className="pb-2">Received</th>
                          <th className="pb-2">Expiry</th>
                          <th className="pb-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.batches.map((b) => (
                          <tr
                            key={b._id}
                            className="border-t border-gray-800/60 text-gray-300"
                          >
                            <td className="py-2">{b.batchNumber || "-"}</td>
                            <td className="py-2">{b.supplierName}</td>
                            <td className="py-2">
                              {b.quantity} {b.unit}
                            </td>
                            <td className="py-2">
                              {new Date(b.receivedDate).toLocaleDateString(
                                "en-IN",
                                { day: "2-digit", month: "short" },
                              )}
                            </td>
                            <td className="py-2">
                              {b.expiryDate
                                ? new Date(b.expiryDate).toLocaleDateString(
                                    "en-IN",
                                    { day: "2-digit", month: "short" },
                                  )
                                : "-"}
                            </td>
                            <td className="py-2">
                              <span className="flex items-center gap-1.5">
                                <span
                                  className={`h-2 w-2 rounded-full ${URGENCY_DOT[b.urgency] || "bg-gray-500"}`}
                                />
                                {b.urgency.replace("_", " ")}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BatchManagementTable;
