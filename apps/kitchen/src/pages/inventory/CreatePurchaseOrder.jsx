import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Navbar from "../../components/ui/Navbar.jsx";
import Sidebar from "../../components/Hamburger/SideBar.jsx";
import { MdInventory } from "react-icons/md";
import API_BASE_URL from "../../config/api.js";
import CreatePurchaseOrderHeader from "../../components/purchaseOrders/CreatePurchaseOrderHeader.jsx";
import CreatePurchaseOrderItems from "../../components/purchaseOrders/CreatePurchaseOrderItems.jsx";
const CreatePurchaseOrder = () => {
  const { id } = useParams();

  const isEditMode = Boolean(id);

  const title = isEditMode ? "Edit Purchase Order" : "Create Purchase Order";

  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [formData, setFormData] = useState({
    supplier: "",
    expectedDeliveryDate: "",
    notes: "",
  });
  const [items, setItems] = useState([]);
  const [taxPercentage, setTaxPercentage] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleCancel = () => {
    navigate("/purchase-orders");
  };
  useEffect(() => {
    if (!id) return;

    const fetchPurchaseOrder = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/inventory/purchase-orders/${id}`,
        );

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message);
        }

        const purchaseOrder = result.data;

        setFormData({
          supplier: purchaseOrder.supplier?._id || "",
          expectedDeliveryDate:
            purchaseOrder.expectedDeliveryDate?.slice(0, 10) || "",
          notes: purchaseOrder.notes || "",
        });

        setItems(
          purchaseOrder.items.map((item) => ({
            inventoryItem: item.inventoryItem?._id || item.inventoryItem,
            itemName: item.itemName,
            category: item.category,
            quantity: item.quantity,
            unit: item.unit,
            unitCost: item.unitCost,
            totalCost: item.totalCost,
            currentStock: 0,
          })),
        );

        setTaxPercentage(purchaseOrder.taxPercentage || 0);
      } catch (error) {
        console.error("Failed to fetch purchase order:", error);
      }
    };

    fetchPurchaseOrder();
  }, [id]);
  const handleCreatePurchaseOrder = async () => {
    try {
      setIsSubmitting(true);

      const payload = {
        supplier: formData.supplier,
        expectedDeliveryDate: formData.expectedDeliveryDate,
        items: items.map((item) => ({
          inventoryItem: item.inventoryItem,
          quantity: Number(item.quantity),
          unitCost: Number(item.unitCost),
        })),
        taxPercentage: Number(taxPercentage),
        notes: formData.notes,
      };

      const response = await fetch(
        `${API_BASE_URL}/inventory/purchase-orders`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to create purchase order");
      }

      navigate("/inventory/purchase-orders");
    } catch (error) {
      console.error("Create purchase order error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePurchaseOrder = async () => {
    try {
      setIsSubmitting(true);

      const payload = {
        supplier: formData.supplier,
        expectedDeliveryDate: formData.expectedDeliveryDate,
        items: items.map((item) => ({
          inventoryItem: item.inventoryItem,
          quantity: Number(item.quantity),
          unitCost: Number(item.unitCost),
        })),
        taxPercentage: Number(taxPercentage),
        notes: formData.notes,
      };

      const response = await fetch(
        `${API_BASE_URL}/inventory/purchase-orders/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to update purchase order");
      }

      navigate("/inventory/purchase-orders");
    } catch (error) {
      console.error("Update purchase order error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
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
          title="Create Purchase Order"
          subtitle="Create a new purchase order for your supplier."
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          breadcrumb="Inventory → Purchase Order → PO"
          showPageHeading
          pageAction={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 transition hover:bg-gray-800 hover:text-white"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  isEditMode
                    ? handleUpdatePurchaseOrder
                    : handleCreatePurchaseOrder
                }
                disabled={isSubmitting}
                className="hover:bg-white-500 rounded-lg bg-emerald-400 px-4 py-2 text-sm text-black disabled:opacity-50"
              >
                {isSubmitting
                  ? "Saving..."
                  : isEditMode
                    ? "Update Purchase Order"
                    : "Create Purchase Order"}
              </button>
            </div>
          }
        />

        <main className="mt-3 px-4">
          <CreatePurchaseOrderHeader
            formData={formData}
            setFormData={setFormData}
          />

          <CreatePurchaseOrderItems
            items={items}
            setItems={setItems}
            taxPercentage={taxPercentage}
            setTaxPercentage={setTaxPercentage}
          />
        </main>
      </div>
    </div>
  );
};

export default CreatePurchaseOrder;
