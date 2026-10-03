import { useCallback, useEffect, useState } from "react";

import API_BASE_URL from "../../config/api.js";
import CurrentStock from "./CurrentStock.jsx";
import RecentPurchaseCard from "../ui/RecentPurchaseCard.jsx";
import StockOutUsageForm from "./StockOutUsageForm.jsx";
import StockOutUsageTable from "./StockOutUsageTable.jsx";

const getToday = () => {
  return new Date().toISOString().split("T")[0];
};

const createItemId = () => {
  return crypto.randomUUID();
};

const createInitialFormData = () => ({
  inventoryItemId: "",
  category: "",
  quantityUsed: "",
  unit: "",
  usageType: "",
  department: "Kitchen",
  reference: "",
  usedDate: getToday(),
  notes: "",
  multipleItems: [
    {
      inventoryItemId: "",
      category: "",
      quantityUsed: "",
      unit: "",
    },
  ],
});

const StockOut = () => {
  const [inventoryItems, setInventoryItems] = useState([]);
  const [usageItems, setUsageItems] = useState([]);
  const [selectedStockItemId, setSelectedStockItemId] = useState("");

  const [items, setItems] = useState([]);

  const [formData, setFormData] = useState(createInitialFormData);

  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [loadingUsage, setLoadingUsage] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedItem = inventoryItems.find(
    (item) => item._id === formData.inventoryItemId,
  );

  const currentStockItem = selectedStockItemId
    ? inventoryItems.find((item) => item._id === selectedStockItemId)
    : selectedItem;

  const fetchInventoryItems = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/inventory/items`);

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to fetch inventory");
      }

      return result.data || [];
    } catch (err) {
      setError(err.message || "Failed to fetch inventory");
      return [];
    }
  }, []);

  const fetchUsageItems = useCallback(async () => {
    try {
      setLoadingUsage(true);

      const response = await fetch(`${API_BASE_URL}/inventory/usage`);

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to fetch usage history");
      }

      setUsageItems(result.data || []);
    } catch (err) {
      setError(err.message || "Failed to fetch usage history");
    } finally {
      setLoadingUsage(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setLoadingUsage(true);

      const [inventoryData, usageData] = await Promise.all([
        fetchInventoryItems(),
        fetchUsageItems(),
      ]);

      if (cancelled) return;

      setInventoryItems(inventoryData);
      setUsageItems(usageData);
      setLoadingUsage(false);
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [fetchInventoryItems, fetchUsageItems]);

  const handleAddToList = (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!formData.inventoryItemId) {
      setError("Please select an inventory item");
      return;
    }

    if (!formData.quantityUsed || Number(formData.quantityUsed) <= 0) {
      setError("Quantity used must be greater than 0");
      return;
    }

    if (!formData.usageType) {
      setError("Please select a reason");
      return;
    }

    if (
      selectedItem &&
      Number(formData.quantityUsed) > selectedItem.currentStock
    ) {
      setError(
        `Only ${selectedItem.currentStock} ${selectedItem.unit} available`,
      );
      return;
    }

    const quantity = Number(formData.quantityUsed);

    const updatedItem = {
      id: editingId || createItemId(),
      inventoryItemId: formData.inventoryItemId,
      inventoryItemName: selectedItem?.name || "",
      category: formData.category || selectedItem?.category || "",
      quantityUsed: quantity,
      unit: formData.unit || selectedItem?.unit || "",
      usageType: formData.usageType,
      department: formData.department,
      reference: formData.reference,
      usedDate: formData.usedDate,
      notes: formData.notes,
    };

    if (editingId) {
      setItems((prev) =>
        prev.map((item) => (item.id === editingId ? updatedItem : item)),
      );
    } else {
      setItems((prev) => [...prev, updatedItem]);
    }

    handleClear();
  };

  const handleEdit = (item) => {
    setEditingId(item.id);

    setFormData({
      inventoryItemId: item.inventoryItemId,
      category: item.category || "",
      quantityUsed: item.quantityUsed,
      unit: item.unit || "",
      usageType: item.usageType || "",
      department: item.department || "Kitchen",
      reference: item.reference || "",
      usedDate: item.usedDate || getToday(),
      notes: item.notes || "",
      multipleItems: [
        {
          inventoryItemId: "",
          category: "",
          quantityUsed: "",
          unit: "",
        },
      ],
    });

    setSelectedStockItemId(item.inventoryItemId);
  };

  const handleRemove = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));

    if (editingId === id) {
      handleClear();
    }
  };

  const handleClear = () => {
    setEditingId(null);
    setSelectedStockItemId("");

    setFormData(createInitialFormData());

    setError("");
    setMessage("");
  };

  const handleMultipleAddToList = (data) => {
    setMessage("");
    setError("");

    const selectedRows = data.items || [];

    if (selectedRows.length === 0) {
      setError("Please add at least one item");
      return;
    }

    for (const row of selectedRows) {
      const rowItem = inventoryItems.find(
        (item) => item._id === row.inventoryItemId,
      );

      if (!rowItem) {
        setError("Invalid inventory item");
        return;
      }

      if (Number(row.quantityUsed) <= 0) {
        setError(`${rowItem.name}: quantity must be greater than 0`);
        return;
      }

      if (Number(row.quantityUsed) > rowItem.currentStock) {
        setError(
          `${rowItem.name}: only ${rowItem.currentStock} ${rowItem.unit} available`,
        );
        return;
      }
    }

    const newItems = selectedRows.map((row) => {
      const rowItem = inventoryItems.find(
        (item) => item._id === row.inventoryItemId,
      );

      return {
        id: createItemId(),
        inventoryItemId: row.inventoryItemId,
        inventoryItemName: rowItem?.name || "",
        category: rowItem?.category || "",
        quantityUsed: Number(row.quantityUsed),
        unit: rowItem?.unit || "",
        usageType: data.usageType,
        department: data.department,
        reference: data.reference,
        usedDate: data.usedDate,
        notes: data.notes,
      };
    });

    setItems((prev) => [...prev, ...newItems]);

    handleClear();
  };

  const handleRecordUsage = async () => {
    if (items.length === 0) {
      setError("Please add at least one item");
      return;
    }

    setLoading(true);
    setMessage("");
    setError("");

    try {
      for (const item of items) {
        const response = await fetch(`${API_BASE_URL}/inventory/use`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inventoryItemId: item.inventoryItemId,
            category: item.category,
            quantityUsed: item.quantityUsed,
            unit: item.unit,
            usageType: item.usageType,
            notes: item.notes,
            usedDate: item.usedDate,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Failed to record usage");
        }
      }

      setItems([]);

      setMessage("Stock usage recorded successfully");

      await fetchInventoryItems();
      await fetchUsageItems();

      handleClear();
    } catch (err) {
      setError(err.message || "Failed to record usage");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.7fr_0.8fr]">
        <StockOutUsageForm
          inventoryItems={inventoryItems}
          formData={formData}
          setFormData={setFormData}
          handleAddToList={handleAddToList}
          handleMultipleAddToList={handleMultipleAddToList}
          editingId={editingId}
          handleClear={handleClear}
          setSelectedStockItemId={setSelectedStockItemId}
        />

        <div className="space-y-4">
          <CurrentStock item={currentStockItem} />

          <RecentPurchaseCard
            items={usageItems}
            loading={loadingUsage}
            type="usage"
          />
        </div>
      </div>

      {message && (
        <div className="rounded-lg border border-emerald-900 bg-emerald-950/40 px-4 py-3 text-xs text-emerald-400">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-900 bg-red-950/40 px-4 py-3 text-xs text-red-400">
          {error}
        </div>
      )}

      <StockOutUsageTable
        items={items}
        handleEdit={handleEdit}
        handleRemove={handleRemove}
      />

      <div className="mb-3 flex justify-end gap-3">
        <button
          type="button"
          onClick={() => {
            setItems([]);
            handleClear();
          }}
          className="rounded-lg border border-gray-700 px-6 py-2.5 text-xs font-medium text-gray-300 transition hover:border-gray-600 hover:text-white"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleRecordUsage}
          disabled={loading || items.length === 0}
          className="rounded-lg bg-emerald-400 px-6 py-2.5 text-xs font-semibold text-black transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Recording..." : "Record Usage"}
        </button>
      </div>
    </div>
  );
};

export default StockOut;
