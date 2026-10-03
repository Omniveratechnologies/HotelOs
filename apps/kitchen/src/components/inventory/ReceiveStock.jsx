import { useEffect, useState } from "react";
import { FiTruck } from "react-icons/fi";

import API_BASE_URL from "../../config/api.js";

import ReceiveStockForm from "./ReceiveStockForm.jsx";
import ReceiveStockTable from "./ReceiveStockTable.jsx";
import RecentPurchaseCard from "../ui/RecentPurchaseCard.jsx";

const ReceiveStock = () => {
  const [inventoryItems, setInventoryItems] = useState([]);
  const [items, setItems] = useState([]);
  const [_loadingItems, setLoadingItems] = useState(false);
  const [receivingStock, setReceivingStock] = useState(false);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [purchaseHistoryLoading, setPurchaseHistoryLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    inventoryItem: "",
    category: "",
    supplier: "",
    quantity: "",
    unit: "",
    unitCost: "",
    batchNumber: "",
    manufacturingDate: "",
    expiryDate: "",
    notes: "",
  });

  useEffect(() => {
    const fetchInventoryItems = async () => {
      try {
        setLoadingItems(true);
        setError("");

        const response = await fetch(`${API_BASE_URL}/inventory/items`);

        if (!response.ok) {
          throw new Error("Failed to fetch inventory items");
        }

        const result = await response.json();

        setInventoryItems(result.data || []);
      } catch (err) {
        console.error("Error fetching inventory items:", err);
        setError("Failed to load inventory items.");
      } finally {
        setLoadingItems(false);
      }
    };

    fetchInventoryItems();
  }, []);

  useEffect(() => {
    const fetchPurchaseHistory = async () => {
      try {
        setPurchaseHistoryLoading(true);

        const response = await fetch(
          `${API_BASE_URL}/inventory/purchase-history`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch purchase history");
        }

        const result = await response.json();

        setPurchaseHistory(result.data || []);
        console.log("Purchase History:", result.data);
      } catch (err) {
        console.error("Error fetching purchase history:", err);
      } finally {
        setPurchaseHistoryLoading(false);
      }
    };

    fetchPurchaseHistory();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddToList = (event) => {
    event.preventDefault();

    const {
      inventoryItem,
      category,
      supplier,
      quantity,
      unit,
      unitCost,
      batchNumber,
      manufacturingDate,
      expiryDate,
      notes,
    } = formData;

    if (!inventoryItem || !supplier || !quantity || !unit || !unitCost) {
      return;
    }

    const quantityValue = Number(quantity);
    const costValue = Number(unitCost);

    const inventoryItemName =
      inventoryItems.find((item) => item._id === inventoryItem)?.name || "";

    const updatedItem = {
      id: editingId || Date.now(),
      inventoryItem,
      inventoryItemName,
      category,
      supplier,
      quantity: quantityValue,
      unit,
      unitCost: costValue,
      batchNumber,
      manufacturingDate,
      expiryDate,
      notes,
      totalCost: quantityValue * costValue,
    };

    if (editingId) {
      setItems((prev) =>
        prev.map((item) => (item.id === editingId ? updatedItem : item)),
      );

      setEditingId(null);
    } else {
      setItems((prev) => [...prev, updatedItem]);
    }

    setFormData({
      inventoryItem: "",
      category: "",
      supplier: "",
      quantity: "",
      unit: "",
      unitCost: "",
      batchNumber: "",
      manufacturingDate: "",
      expiryDate: "",
      notes: "",
    });
  };

  const handleReceiveStock = async () => {
    if (items.length === 0) {
      setError("Please add at least one item.");
      return;
    }

    try {
      setReceivingStock(true);
      setMessage("");
      setError("");

      await Promise.all(
        items.map(async (item) => {
          const response = await fetch(`${API_BASE_URL}/inventory/receive`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              inventoryItemId: item.inventoryItem,
              category: item.category,
              supplierName: item.supplier,
              quantityReceived: item.quantity,
              unit: item.unit,
              unitCost: item.unitCost,
              batchNumber: item.batchNumber,
              manufacturingDate: item.manufacturingDate || undefined,
              expiryDate: item.expiryDate || undefined,
              notes: item.notes,
            }),
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.message || "Failed to receive stock");
          }

          return result;
        }),
      );

      setMessage("Stock received successfully.");

      setItems([]);

      const inventoryResponse = await fetch(`${API_BASE_URL}/inventory/items`);

      if (inventoryResponse.ok) {
        const inventoryResult = await inventoryResponse.json();
        setInventoryItems(inventoryResult.data || []);
      }

      const purchaseHistoryResponse = await fetch(
        `${API_BASE_URL}/inventory/purchase-history`,
      );

      if (purchaseHistoryResponse.ok) {
        const purchaseHistoryResult = await purchaseHistoryResponse.json();

        setPurchaseHistory(purchaseHistoryResult.data || []);
      }
    } catch (err) {
      console.error("Error receiving stock:", err);
      setError(error.message || "Failed to receive stock.");
    } finally {
      setReceivingStock(false);
    }
  };

  const handleRemove = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleEdit = (item) => {
    setEditingId(item.id);

    setFormData({
      inventoryItem: item.inventoryItem,
      category: item.category,
      supplier: item.supplier,
      quantity: item.quantity,
      unit: item.unit,
      unitCost: item.unitCost,
      batchNumber: item.batchNumber,
      manufacturingDate: item.manufacturingDate,
      expiryDate: item.expiryDate,
      notes: item.notes,
    });
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] p-6">
      {message && (
        <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="rounded-2xl border border-gray-800 bg-[#0f0f0f] p-6">
          <div className="mb-6 flex items-center gap-2">
            <FiTruck className="text-emerald-500" size={19} />

            <h2 className="text-lg font-semibold text-white">Item Details</h2>
          </div>

          <ReceiveStockForm
            formData={formData}
            inventoryItems={inventoryItems}
            handleChange={handleChange}
            handleSubmit={handleAddToList}
            editingId={editingId}
          />
        </div>
        <RecentPurchaseCard
          items={purchaseHistory}
          loading={purchaseHistoryLoading}
          type="purchase"
        />
      </div>

      <ReceiveStockTable
        items={items}
        handleEdit={handleEdit}
        handleRemove={handleRemove}
      />

      {items.length > 0 && (
        <div className="mt-6 flex justify-end border-t border-gray-800 pt-5">
          <button
            type="button"
            onClick={handleReceiveStock}
            disabled={receivingStock}
            className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            {receivingStock ? "Receiving..." : "Receive Stock"}
          </button>
        </div>
      )}
    </div>
  );
};

export default ReceiveStock;
