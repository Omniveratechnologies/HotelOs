import { useState, useEffect } from "react";
import API_BASE_URL from "../../config/api.js";

import Navbar from "../../components/ui/Navbar.jsx";
import Sidebar from "../../components/Hamburger/SideBar.jsx";
import { MdInventory } from "react-icons/md";

import StockAdjustmentForm from "../../components/stockAdjustment/StockAdjustmentForm.jsx";
import { useNavigate } from "react-router-dom";

const StockAdjustment = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const handleAdjustmentSubmit = async (formData) => {
    try {
      setSaving(true);

      const response = await fetch(`${API_BASE_URL}/inventory/adjustments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const responseText = await response.text();

      let result;

      try {
        result = JSON.parse(responseText);
      } catch {
        throw new Error(
          `Server returned HTML instead of JSON. Check the API URL and backend route. Status: ${response.status}`,
        );
      }

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to confirm stock adjustment");
      }

      alert("Stock adjustment completed successfully.");
      navigate(-1);
    } catch (error) {
      console.error("Stock adjustment error:", error);
      alert(error.message || "Failed to adjust stock.");
    } finally {
      setSaving(false);
    }
  };
  useEffect(() => {
    const fetchInventoryItems = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/inventory/items`);

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Failed to fetch inventory items");
        }

        setInventoryItems(result.data ?? []);
      } catch (error) {
        console.error("Fetch inventory items error:", error);
      }
    };

    fetchInventoryItems();
  }, []);

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
          iconColor="text-emerald-500"
          bgColor="bg-emerald-500/10"
          title="Stock Adjustment"
          subtitle="Adjust stock to match physical count."
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          breadcrumb="Inventory → Stock Adjustment"
          showPageHeading
          pageAction={
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                disabled={saving}
                className="rounded-lg border border-gray-700 px-4 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-gray-800 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                form="stock-adjustment-form"
                disabled={saving}
                className="hover:bg-white-400 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-black transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving..." : "Confirm Adjustment"}
              </button>
            </div>
          }
        />

        <main className="mt-3 px-4">
          <StockAdjustmentForm
            inventoryItems={inventoryItems}
            onSubmit={handleAdjustmentSubmit}
            loading={saving}
          />
        </main>
      </div>
    </div>
  );
};

export default StockAdjustment;
