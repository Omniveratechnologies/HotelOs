import { useEffect, useMemo, useState } from "react";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import API_BASE_URL from "../../config/api.js";

const CreatePurchaseOrderItems = ({
  items,
  setItems,
  taxPercentage = 0,
  setTaxPercentage,
}) => {
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);

  useEffect(() => {
    const fetchInventoryItems = async () => {
      try {
        setLoadingItems(true);

        const response = await fetch(`${API_BASE_URL}/inventory/items`);

        const result = await response.json();

        if (result.success) {
          setInventoryItems(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch inventory items:", error);
      } finally {
        setLoadingItems(false);
      }
    };

    fetchInventoryItems();
  }, []);

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        inventoryItem: "",
        itemName: "",
        category: "",
        quantity: 1,
        unit: "",
        unitCost: 0,
        totalCost: 0,
        currentStock: 0,
      },
    ]);
  };

  const handleRemoveItem = (index) => {
    setItems((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleItemChange = (index, inventoryId) => {
    const selectedItem = inventoryItems.find(
      (item) => item._id === inventoryId,
    );

    if (!selectedItem) return;

    setItems((prev) =>
      prev.map((item, itemIndex) => {
        if (itemIndex !== index) return item;

        const unitCost = Number(
          selectedItem.unitCost ?? selectedItem.price ?? 0,
        );

        return {
          ...item,
          inventoryItem: selectedItem._id,
          itemName: selectedItem.name,
          category: selectedItem.category,
          unit: selectedItem.unit,
          currentStock: selectedItem.currentStock ?? 0,
          quantity: item.quantity || 1,
          unitCost,
          totalCost: (item.quantity || 1) * unitCost,
        };
      }),
    );
  };

  const handleQuantityChange = (index, value) => {
    const quantity = Number(value);

    setItems((prev) =>
      prev.map((item, itemIndex) => {
        if (itemIndex !== index) return item;

        return {
          ...item,
          quantity,
          totalCost: quantity * Number(item.unitCost || 0),
        };
      }),
    );
  };

  const handleUnitCostChange = (index, value) => {
    const unitCost = Number(value);

    setItems((prev) =>
      prev.map((item, itemIndex) => {
        if (itemIndex !== index) return item;

        return {
          ...item,
          unitCost,
          totalCost: Number(item.quantity || 0) * unitCost,
        };
      }),
    );
  };

  const subtotal = useMemo(() => {
    return items.reduce(
      (total, item) => total + Number(item.totalCost || 0),
      0,
    );
  }, [items]);

  const taxAmount = useMemo(() => {
    return (subtotal * Number(taxPercentage || 0)) / 100;
  }, [subtotal, taxPercentage]);

  const totalAmount = subtotal + taxAmount;

  return (
    <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-4">
      <div className="overflow-hidden rounded-xl border border-gray-800 bg-[#111111] xl:col-span-3">
        <div className="flex items-center justify-between border-b border-gray-800 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-white">Items</h2>
            <p className="mt-1 text-[11px] text-gray-500">
              Add the items and quantities required for this purchase order.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddItem}
            className="flex items-center gap-2 rounded-lg border border-gray-700 px-3 py-2 text-xs font-medium text-gray-300 transition hover:border-emerald-500 hover:bg-white-500/10 hover:text-emerald-400"
          >
            <FiPlus size={14} />
            Add Item
          </button>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="border-b border-gray-800 bg-[#0f0f0f]">
                <th className="px-4 py-3 text-center text-[11px] tracking-wide text-gray-500 uppercase">
                  #
                </th>

                <th className="px-4 py-3 text-left text-[11px] tracking-wide text-gray-500 uppercase">
                  Item
                </th>

                <th className="px-4 py-3 text-center text-[11px] tracking-wide text-gray-500 uppercase">
                  Current Stock
                </th>

                <th className="px-4 py-3 text-center text-[11px] tracking-wide text-gray-500 uppercase">
                  Quantity
                </th>

                <th className="px-4 py-3 text-center text-[11px] tracking-wide text-gray-500 uppercase">
                  Unit
                </th>

                <th className="px-4 py-3 text-center text-[11px] tracking-wide text-gray-500 uppercase">
                  Unit Price (₹)
                </th>

                <th className="px-4 py-3 text-center text-[11px] tracking-wide text-gray-500 uppercase">
                  Total (₹)
                </th>

                <th className="px-4 py-3 text-center text-[11px] tracking-wide text-gray-500 uppercase">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="px-4 py-12 text-center text-xs text-gray-500"
                  >
                    No items added. Click "Add Item" to add an item.
                  </td>
                </tr>
              ) : (
                items.map((item, index) => (
                  <tr key={index} className="border-b border-gray-800/70">
                    <td className="px-4 py-3 text-center text-xs text-gray-500">
                      {index + 1}
                    </td>

                    <td className="px-4 py-3">
                      <select
                        value={item.inventoryItem}
                        onChange={(e) =>
                          handleItemChange(index, e.target.value)
                        }
                        disabled={loadingItems}
                        className="w-44 rounded-lg border border-gray-700 bg-[#0f0f0f] px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                      >
                        <option value="">
                          {loadingItems ? "Loading..." : "Select item"}
                        </option>

                        {inventoryItems.map((inventoryItem) => (
                          <option
                            key={inventoryItem._id}
                            value={inventoryItem._id}
                          >
                            {inventoryItem.name}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-4 py-3 text-center text-xs text-gray-400">
                      {item.inventoryItem
                        ? `${item.currentStock} ${item.unit}`
                        : "-"}
                    </td>

                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) =>
                          handleQuantityChange(index, e.target.value)
                        }
                        className="w-24 rounded-lg border border-gray-700 bg-[#0f0f0f] px-3 py-2 text-center text-xs text-white outline-none focus:border-emerald-500"
                      />
                    </td>

                    <td className="px-4 py-3 text-center text-xs text-gray-400">
                      {item.unit || "-"}
                    </td>

                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitCost}
                        onChange={(e) =>
                          handleUnitCostChange(index, e.target.value)
                        }
                        className="w-28 rounded-lg border border-gray-700 bg-[#0f0f0f] px-3 py-2 text-center text-xs text-white outline-none focus:border-emerald-500"
                      />
                    </td>

                    <td className="px-4 py-3 text-center text-xs font-medium text-white">
                      ₹
                      {Number(item.totalCost || 0).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="rounded-md p-2 text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
                        title="Remove item"
                      >
                        <FiTrash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="h-fit rounded-xl border border-gray-800 bg-[#111111] p-5">
        <h2 className="text-sm font-semibold text-white">Order Summary</h2>

        <div className="mt-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Subtotal</span>

            <span className="text-sm font-medium text-gray-300">
              ₹
              {subtotal.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-gray-500">Tax</span>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                step="0.01"
                value={taxPercentage}
                onChange={(e) => setTaxPercentage(Number(e.target.value))}
                className="w-16 rounded-md border border-gray-700 bg-[#0f0f0f] px-2 py-1.5 text-right text-xs text-white outline-none focus:border-emerald-500"
              />

              <span className="text-xs text-gray-500">%</span>

              <span className="w-24 text-right text-xs text-gray-400">
                ₹
                {taxAmount.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>

          <div className="border-t border-gray-800" />

          <div className="rounded-lg bg-emerald-500/10 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-300">
                Total Amount
              </span>

              <span className="text-lg font-bold text-emerald-400">
                ₹
                {totalAmount.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePurchaseOrderItems;
