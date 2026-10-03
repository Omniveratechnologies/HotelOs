import { useState } from "react";
import { FiPlus, FiX } from "react-icons/fi";
import Table from "../ui/Table.jsx";
import EditButton from "../ui/button/EditButton.jsx";
import DeleteButton from "../ui/button/DeleteButton.jsx";
import FormField from "../ui/FormField.jsx";

const UNIT_OPTIONS = [
  { value: "kg", label: "kg" },
  { value: "g", label: "g" },
  { value: "litre", label: "litre" },
  { value: "ml", label: "ml" },
  { value: "pieces", label: "pieces" },
  { value: "dozen", label: "dozen" },
];

const convertToInventoryUnit = (quantity, recipeUnit, inventoryUnit) => {
  const value = Number(quantity || 0);

  if (!value) return 0;

  if (recipeUnit === inventoryUnit) {
    return value;
  }

  if (recipeUnit === "g" && inventoryUnit === "kg") {
    return value / 1000;
  }

  if (recipeUnit === "kg" && inventoryUnit === "g") {
    return value * 1000;
  }

  if (recipeUnit === "ml" && inventoryUnit === "litre") {
    return value / 1000;
  }

  if (recipeUnit === "litre" && inventoryUnit === "ml") {
    return value * 1000;
  }

  if (recipeUnit === "dozen" && inventoryUnit === "pieces") {
    return value * 12;
  }

  if (recipeUnit === "pieces" && inventoryUnit === "dozen") {
    return value / 12;
  }

  return value;
};

const IngredientModal = ({
  isOpen,
  onClose,
  onSubmit,
  inventoryItemOptions,
  inventoryItemsById,
  initialData,
}) => {
  const [inventoryItem, setInventoryItem] = useState(
    initialData?.inventoryItem || "",
  );

  const [quantityPerServing, setQuantityPerServing] = useState(
    initialData?.quantityPerServing ?? "",
  );

  const [unit, setUnit] = useState(initialData?.unit || "");

  if (!isOpen) return null;

  const selectedItem = inventoryItemsById[inventoryItem];

  const inventoryUnit = selectedItem?.unit || "";

  const handleIngredientChange = (e) => {
    const value = e.target.value;

    setInventoryItem(value);
    setUnit("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!inventoryItem) {
      alert("Select an ingredient.");
      return;
    }

    if (quantityPerServing === "") {
      alert("Enter quantity per serving.");
      return;
    }

    if (Number(quantityPerServing) <= 0) {
      alert("Quantity must be greater than 0.");
      return;
    }

    if (!unit) {
      alert("Select a unit.");
      return;
    }

    onSubmit({
      inventoryItem,
      quantityPerServing: Number(quantityPerServing),
      unit,
    });
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-gray-800 bg-[#111111] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-800 px-5 py-4">
          <h2 className="text-base font-semibold text-white">
            {initialData ? "Edit Ingredient" : "Add Ingredient"}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-800 hover:text-white"
          >
            <FiX size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FormField
                label="Ingredient"
                name="inventoryItem"
                type="select"
                value={inventoryItem}
                onChange={handleIngredientChange}
                options={inventoryItemOptions}
                required
              />
            </div>

            <FormField
              label="Quantity (per serving)"
              name="quantityPerServing"
              type="number"
              value={quantityPerServing}
              onChange={(e) => setQuantityPerServing(e.target.value)}
              min="0"
              step="any"
              required
            />

            <FormField
              label="Unit"
              name="unit"
              type="select"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              options={UNIT_OPTIONS}
              required
            />
          </div>

          {selectedItem && (
            <div className="mt-4 rounded-lg border border-gray-800 bg-[#0a0a0a] p-3">
              <p className="text-xs text-gray-500">Inventory unit</p>

              <p className="mt-1 text-sm font-medium text-white">
                {selectedItem.name}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Stock unit:{" "}
                <span className="text-gray-300">{inventoryUnit || "-"}</span>
                {" · "}
                Stock cost: ₹{Number(selectedItem.costPerUnit || 0).toFixed(
                  2,
                )}{" "}
                per {inventoryUnit || "-"}
              </p>
            </div>
          )}

          {selectedItem && unit && quantityPerServing && (
            <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
              <p className="text-xs text-emerald-400">Recipe usage</p>

              <p className="mt-1 text-xs text-gray-400">
                {quantityPerServing} {unit} per serving
              </p>

              {unit !== inventoryUnit && (
                <p className="mt-1 text-xs text-gray-500">
                  Inventory stock is measured in {inventoryUnit}.
                </p>
              )}
            </div>
          )}

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-700 px-4 py-2 text-xs font-medium text-gray-300 transition hover:bg-gray-800 hover:text-white"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-emerald-700"
            >
              {initialData ? "Update" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EMPTY_ARRAY = [];
const EMPTY_OBJECT = {};

const RecipeTable = ({
  ingredients = EMPTY_ARRAY,
  inventoryItemOptions = EMPTY_ARRAY,
  inventoryItemsById = EMPTY_OBJECT,
  onChange,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);

  const openAddModal = () => {
    setEditingIndex(null);
    setModalOpen(true);
  };

  const openEditModal = (index) => {
    setEditingIndex(index);
    setModalOpen(true);
  };

  const handleDelete = (index) => {
    if (!window.confirm("Remove this ingredient?")) {
      return;
    }

    onChange(ingredients.filter((_, i) => i !== index));
  };

  const handleModalSubmit = ({ inventoryItem, quantityPerServing, unit }) => {
    const itemInfo = inventoryItemsById[inventoryItem] || {};

    const inventoryUnit = itemInfo.unit || "";

    const inventoryQuantity = convertToInventoryUnit(
      quantityPerServing,
      unit,
      inventoryUnit,
    );

    const inventoryCostPerUnit = Number(itemInfo.costPerUnit || 0);

    const totalCost = inventoryQuantity * inventoryCostPerUnit;

    const newIngredient = {
      inventoryItem,
      quantityPerServing: Number(quantityPerServing),
      unit,
      costPerUnit: inventoryCostPerUnit,
      totalCost: Number(totalCost.toFixed(2)),
    };

    if (editingIndex === null) {
      onChange([...ingredients, newIngredient]);
    } else {
      const updated = [...ingredients];

      updated[editingIndex] = newIngredient;

      onChange(updated);
    }

    setModalOpen(false);
    setEditingIndex(null);
  };

  const editingIngredient =
    editingIndex !== null
      ? {
          ...ingredients[editingIndex],
          inventoryItem:
            typeof ingredients[editingIndex].inventoryItem === "object" &&
            ingredients[editingIndex].inventoryItem !== null
              ? ingredients[editingIndex].inventoryItem._id
              : ingredients[editingIndex].inventoryItem,
        }
      : null;

  const columns = [
    {
      key: "serialNumber",
      label: "#",
      render: (_, index) => index + 1,
    },
    {
      key: "ingredient",
      label: "Ingredient",
      render: (row) => {
        const item =
          typeof row.inventoryItem === "object" && row.inventoryItem !== null
            ? row.inventoryItem
            : inventoryItemsById[row.inventoryItem];

        return item?.name || "Unknown item";
      },
    },
    {
      key: "category",
      label: "Category",
      render: (row) => {
        const item =
          typeof row.inventoryItem === "object" && row.inventoryItem !== null
            ? row.inventoryItem
            : inventoryItemsById[row.inventoryItem];

        return item?.category || "-";
      },
    },
    {
      key: "quantityPerServing",
      label: "Quantity (per serving)",
      render: (row) => `${row.quantityPerServing} ${row.unit}`,
    },
    {
      key: "unit",
      label: "Unit",
      render: (row) => row.unit || "-",
    },
    {
      key: "costPerUnit",
      label: "Unit Cost (₹)",
      render: (row) => `₹${Number(row.costPerUnit || 0).toFixed(2)}`,
    },
    {
      key: "totalCost",
      label: "Total Cost (₹)",
      render: (row) => `₹${Number(row.totalCost || 0).toFixed(2)}`,
    },
    {
      key: "actions",
      label: "Actions",
      render: (_, index) => (
        <div className="flex items-center justify-center gap-1">
          <EditButton onClick={() => openEditModal(index)} />

          <DeleteButton onClick={() => handleDelete(index)} />
        </div>
      ),
    },
  ];

  return (
    <div className="bg-slate rounded-xl border border-gray-800/70 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-semibold text-white">
          Ingredients
          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400">
            {ingredients.length} ingredients
          </span>
        </h2>

        <button
          type="button"
          onClick={openAddModal}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
        >
          <FiPlus size={13} />
          Add Ingredient
        </button>
      </div>

      <Table
        columns={columns}
        data={ingredients}
        emptyMessage="No ingredients added yet"
      />

      <button
        type="button"
        onClick={openAddModal}
        className="mt-3 flex items-center gap-2 text-xs text-emerald-400 hover:underline"
      >
        <FiPlus size={13} />
        Add New Ingredient
      </button>

      <IngredientModal
        key={`${modalOpen}-${editingIndex ?? "new"}`}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingIndex(null);
        }}
        onSubmit={handleModalSubmit}
        inventoryItemOptions={inventoryItemOptions}
        inventoryItemsById={inventoryItemsById}
        initialData={editingIngredient}
      />
    </div>
  );
};

export default RecipeTable;
