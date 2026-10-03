import { useState } from "react";
import Tabs from "../ui/Tabs";
import SingleItem from "./SingleItem";
import MultipleItems from "./MultipleItems";

const StockOutUsageForm = ({
  inventoryItems,
  formData,
  setFormData,
  handleAddToList,
  handleMultipleAddToList,
  editingId,
  handleClear,
  setSelectedStockItemId,
}) => {
  const [mode, setMode] = useState("single");

  return (
    <div className="rounded-xl border border-gray-800 bg-[#081923] p-4">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Add Usage Item</h2>
        </div>

        <Tabs
          tabs={[
            {
              value: "single",
              label: "Single Item",
            },
            {
              value: "multiple",
              label: "Multiple Items",
            },
          ]}
          activeTab={mode}
          onChange={setMode}
        />
      </div>

      {mode === "single" ? (
        <SingleItem
          inventoryItems={inventoryItems}
          formData={formData}
          setFormData={setFormData}
          handleAddToList={handleAddToList}
          editingId={editingId}
          handleClear={handleClear}
          setSelectedStockItemId={setSelectedStockItemId}
        />
      ) : (
        <MultipleItems
          inventoryItems={inventoryItems}
          formData={formData}
          setFormData={setFormData}
          handleMultipleAddToList={handleMultipleAddToList}
          handleClear={handleClear}
          setSelectedStockItemId={setSelectedStockItemId}
        />
      )}
    </div>
  );
};

export default StockOutUsageForm;
