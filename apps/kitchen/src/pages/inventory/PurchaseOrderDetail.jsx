import { useState, useEffect } from "react";

import Navbar from "../../components/ui/Navbar.jsx";
import Sidebar from "../../components/Hamburger/SideBar.jsx";
import { MdInventory } from "react-icons/md";
import StatusBadge from "../../components/ui/StatusBadge.jsx";
import { useNavigate, useParams } from "react-router-dom";
import API_BASE_URL from "../../config/api.js";
import PurchaseOrderDetailCard from "../../components/purchaseOrders/PurchaseOrderDetailCard.jsx";
import Tabs from "../../components/ui/Tabs.jsx";
import PurchaseOrderItemsTable from "../../components/purchaseOrders/PurchaseOrderItemsTable.jsx";
import PurchaseOrderSummaryCard from "../../components/purchaseOrders/PurchaseOrderSummaryCard.jsx";
import ProcessBar from "../../components/ui/ProcessBar.jsx";

const PurchaseOrderDetail = () => {
  const { id } = useParams();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [po, setPO] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReceiveModal, setShowReceiveModal] = useState(false);

  const [receiveItems, setReceiveItems] = useState([]);
  const [receiveNotes, setReceiveNotes] = useState("");
  const [receiving, setReceiving] = useState(false);

  const fetchPO = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${API_BASE_URL}/inventory/purchase-orders/${id}`,
      );

      if (!res.ok) {
        throw new Error("Failed to fetch purchase order");
      }

      const data = await res.json();
      setPO(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPO();
  }, [id]);

  const changeStatus = async (status, confirmMessage) => {
    if (!po?._id) return;

    if (confirmMessage && !window.confirm(confirmMessage)) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/inventory/purchase-orders/${po._id}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to update status");
      }

      await fetchPO();
    } catch (error) {
      console.error("Status update error:", error);
      alert(error.message || "Failed to update status.");
    }
  };

  const handleSend = () => changeStatus("SENT");
  const handleConfirm = () => changeStatus("CONFIRMED");
  const handleCancel = () =>
    changeStatus(
      "CANCELLED",
      "Are you sure you want to cancel this purchase order? This cannot be undone.",
    );

  const handleMarkAsReceived = async () => {
    if (!po?._id) return;

    const confirmed = window.confirm(
      "Are you sure you want to mark this purchase order as received?",
    );
    if (!confirmed) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/inventory/purchase-orders/${po._id}/receive-all`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to mark as received");
      }

      await fetchPO();
      alert("Purchase order marked as received.");
    } catch (error) {
      console.error("Mark as received error:", error);
      alert(error.message || "Failed to mark purchase order as received.");
    }
  };

  const openReceiveModal = () => {
    const remainingItems = (po?.items ?? [])
      .map((item) => ({
        inventoryItemId: item.inventoryItem?._id ?? item.inventoryItem,
        itemName: item.itemName,
        orderedQuantity: Number(item.quantity),
        receivedQuantity: Number(item.receivedQuantity ?? 0),
        remainingQuantity:
          Number(item.quantity) - Number(item.receivedQuantity ?? 0),
        quantityReceived: "",
        batchNumber: "",
        manufacturingDate: "",
        expiryDate: "",
      }))
      .filter((item) => item.remainingQuantity > 0);

    setReceiveItems(remainingItems);
    setReceiveNotes("");
    setShowReceiveModal(true);
  };

  const handleReceiveStockSubmit = async (event) => {
    event.preventDefault();

    if (!po?._id) return;

    const items = receiveItems
      .filter((item) => Number(item.quantityReceived) > 0)
      .map((item) => ({
        inventoryItemId: item.inventoryItemId,
        quantityReceived: Number(item.quantityReceived),
        batchNumber: item.batchNumber || undefined,
        manufacturingDate: item.manufacturingDate || undefined,
        expiryDate: item.expiryDate || undefined,
        notes: receiveNotes || undefined,
      }));

    if (items.length === 0) {
      alert("Enter a received quantity for at least one item.");
      return;
    }

    try {
      setReceiving(true);

      const response = await fetch(
        `${API_BASE_URL}/inventory/purchase-orders/${po._id}/receive`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items }),
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to receive stock");
      }

      setShowReceiveModal(false);
      await fetchPO();
      alert("Stock received successfully.");
    } catch (error) {
      console.error("Receive stock error:", error);
      alert(error.message || "Failed to receive stock.");
    } finally {
      setReceiving(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!po) return <div>Purchase order not found</div>;

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
          iconColor="text-yellow-500"
          bgColor="bg-yellow-500/10"
          title={
            <span className="flex items-center gap-3">
              {po.poNumber}
              <StatusBadge status={po.status} />
            </span>
          }
          subtitle="View Purchase order details and manage receiving."
          isMenuOpen={isMenuOpen}
          breadcrumb={`Inventory → Purchase Order → ${po.poNumber}`}
          showPageHeading
          setIsMenuOpen={setIsMenuOpen}
        />

        <main className="mt-3 px-4">
          <div className="flex w-full items-start gap-6">
            <div className="min-w-0 flex-1">
              <PurchaseOrderDetailCard
                po={po}
                tabs={<Tabs />}
                table={<PurchaseOrderItemsTable items={po.items ?? []} />}
              />

              <ProcessBar items={po.items ?? []} />
            </div>

            <div className="w-full max-w-sm shrink-0">
              <PurchaseOrderSummaryCard
                po={po}
                onSend={handleSend}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
                onReceiveStock={openReceiveModal}
                onMarkAsReceived={handleMarkAsReceived}
              />
            </div>
          </div>
        </main>
        {showReceiveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <form
              onSubmit={handleReceiveStockSubmit}
              className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-gray-700 bg-[#171717] p-6"
            >
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">
                  Receive Stock — {po.poNumber}
                </h2>

                <button
                  type="button"
                  onClick={() => setShowReceiveModal(false)}
                  className="text-xl text-gray-400 hover:text-white"
                >
                  &times;
                </button>
              </div>

              <div className="space-y-5">
                {receiveItems.map((item, index) => (
                  <div
                    key={item.inventoryItemId}
                    className="rounded-lg border border-gray-700 p-4"
                  >
                    <h3 className="mb-3 font-medium text-white">
                      {item.itemName}
                    </h3>

                    <p className="mb-3 text-sm text-gray-400">
                      Ordered: {item.orderedQuantity} · Already received:{" "}
                      {item.receivedQuantity} · Remaining:{" "}
                      {item.remainingQuantity}
                    </p>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <label className="text-sm text-gray-300">
                        Quantity received *
                        <input
                          type="number"
                          min="0"
                          max={item.remainingQuantity}
                          step="any"
                          required
                          value={item.quantityReceived}
                          onChange={(event) => {
                            const value = event.target.value;

                            setReceiveItems((current) =>
                              current.map((row, rowIndex) =>
                                rowIndex === index
                                  ? { ...row, quantityReceived: value }
                                  : row,
                              ),
                            );
                          }}
                          className="focus:border-white-500 mt-1 w-full rounded-lg border border-gray-700 bg-[#0f0f0f] px-3 py-2 text-white outline-none"
                        />
                      </label>

                      <label className="text-sm text-gray-300">
                        Batch number
                        <input
                          type="text"
                          value={item.batchNumber}
                          onChange={(event) =>
                            setReceiveItems((current) =>
                              current.map((row, rowIndex) =>
                                rowIndex === index
                                  ? { ...row, batchNumber: event.target.value }
                                  : row,
                              ),
                            )
                          }
                          className="focus:border-white-500 mt-1 w-full rounded-lg border border-gray-700 bg-[#0f0f0f] px-3 py-2 text-white outline-none"
                        />
                      </label>

                      <label className="text-sm text-gray-300">
                        Manufacturing date
                        <input
                          type="date"
                          value={item.manufacturingDate}
                          onChange={(event) =>
                            setReceiveItems((current) =>
                              current.map((row, rowIndex) =>
                                rowIndex === index
                                  ? {
                                      ...row,
                                      manufacturingDate: event.target.value,
                                    }
                                  : row,
                              ),
                            )
                          }
                          className="focus:border-white-500 mt-1 w-full rounded-lg border border-gray-700 bg-[#0f0f0f] px-3 py-2 text-white outline-none"
                        />
                      </label>

                      <label className="text-sm text-gray-300">
                        Expiry date
                        <input
                          type="date"
                          value={item.expiryDate}
                          onChange={(event) =>
                            setReceiveItems((current) =>
                              current.map((row, rowIndex) =>
                                rowIndex === index
                                  ? { ...row, expiryDate: event.target.value }
                                  : row,
                              ),
                            )
                          }
                          className="focus:border-white-500 mt-1 w-full rounded-lg border border-gray-700 bg-[#0f0f0f] px-3 py-2 text-white outline-none"
                        />
                      </label>
                    </div>
                  </div>
                ))}

                {receiveItems.length === 0 && (
                  <p className="text-sm text-gray-400">
                    All items in this purchase order have already been received.
                  </p>
                )}

                <label className="block text-sm text-gray-300">
                  Notes
                  <textarea
                    value={receiveNotes}
                    onChange={(event) => setReceiveNotes(event.target.value)}
                    rows={2}
                    className="focus:border-white-500 mt-1 w-full rounded-lg border border-gray-700 bg-[#0f0f0f] px-3 py-2 text-white outline-none"
                  />
                </label>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowReceiveModal(false)}
                  className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={receiving || receiveItems.length === 0}
                  className="bg-white-600 hover:bg-white-700 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {receiving ? "Receiving..." : "Receive Stock"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseOrderDetail;
