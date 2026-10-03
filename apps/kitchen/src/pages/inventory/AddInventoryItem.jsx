import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import FormField from "../../components/ui/FormField.jsx";
import API_BASE_URL from "../../config/api.js";

const CATEGORY_OPTIONS = [
  { value: "Vegetables", label: "Vegetables" },
  { value: "Fruits", label: "Fruits" },
  { value: "Dairy", label: "Dairy" },
  { value: "Beverage", label: "Beverage" },
  { value: "Spices", label: "Spices" },
  { value: "Seasoning", label: "Seasoning" },
  { value: "Meat", label: "Meat" },
  { value: "Oils", label: "Oils" },
  { value: "Grains", label: "Grains" },
  { value: "Sweeteners", label: "Sweeteners" },
  { value: "Snacks", label: "Snacks" },
  { value: "Desserts", label: "Desserts" },
  { value: "Others", label: "Others" },
];

const UNIT_OPTIONS = [
  { value: "kg", label: "kg" },
  { value: "g", label: "g" },
  { value: "litre", label: "litre" },
  { value: "ml", label: "ml" },
  { value: "pieces", label: "pieces" },
  { value: "dozen", label: "dozen" },
];

const initialForm = {
  name: "",
  category: "",
  customCategory: "",
  unit: "",
  minimumStock: "",
  costPerUnit: "",
  expiryDate: "",
};

const AddInventoryItem = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const id = searchParams.get("id");
  const isEdit = Boolean(id);

  const [form, setForm] = useState(initialForm);

  const [categoryOptions, setCategoryOptions] = useState(CATEGORY_OPTIONS);

  const [loading, setLoading] = useState(false);
  const [fetchingItem, setFetchingItem] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/inventory/items`);

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to load categories");
        }

        const items = data.data || [];

        const databaseCategories = items
          .map((item) => item.category?.trim())
          .filter(Boolean);

        const uniqueCategories = [...new Set(databaseCategories)];

        const predefinedCategories = CATEGORY_OPTIONS.filter(
          (option) => option.value !== "Others",
        ).map((option) => option.value);

        const customCategories = uniqueCategories.filter(
          (category) => !predefinedCategories.includes(category),
        );

        const finalCategories = [...predefinedCategories, ...customCategories];

        setCategoryOptions([
          ...finalCategories.map((category) => ({
            value: category,
            label: category,
          })),
          {
            value: "Others",
            label: "Others",
          },
        ]);
      } catch (error) {
        console.error("Failed to load categories:", error);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    if (!isEdit) {
      setForm(initialForm);
      return;
    }

    const fetchItem = async () => {
      try {
        setFetchingItem(true);

        const response = await fetch(`${API_BASE_URL}/inventory/items/${id}`);

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to load inventory item");
        }

        const item = data.data;

        const predefinedOrExistingCategory = categoryOptions.some(
          (option) =>
            option.value === item.category && option.value !== "Others",
        );

        setForm({
          name: item.name || "",
          category: predefinedOrExistingCategory ? item.category : "Others",

          customCategory: predefinedOrExistingCategory
            ? ""
            : item.category || "",

          unit: item.unit || "",

          minimumStock: item.minimumStock ?? "",

          costPerUnit: item.costPerUnit ?? "",

          expiryDate: item.expiryDate
            ? new Date(item.expiryDate).toISOString().split("T")[0]
            : "",
        });
      } catch (error) {
        console.error("Failed to load inventory item:", error);

        alert(error.message || "Failed to load inventory item.");

        navigate("/inventory/stock-overview");
      } finally {
        setFetchingItem(false);
      }
    };

    fetchItem();
  }, [id, isEdit, navigate, categoryOptions]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => {
      if (name === "category") {
        return {
          ...prev,
          category: value,

          customCategory: value === "Others" ? prev.customCategory : "",
        };
      }

      return {
        ...prev,
        [name]: value,
      };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const finalCategory =
      form.category === "Others" ? form.customCategory.trim() : form.category;

    if (!form.name.trim()) {
      alert("Please enter item name.");
      return;
    }

    if (!finalCategory) {
      alert("Please select or enter a category.");
      return;
    }

    if (!form.unit) {
      alert("Please select a unit.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        name: form.name.trim(),

        category: finalCategory,

        unit: form.unit,

        minimumStock: Number(form.minimumStock || 0),

        costPerUnit: Number(form.costPerUnit || 0),

        expiryDate: form.expiryDate || null,
      };

      const url = isEdit
        ? `${API_BASE_URL}/inventory/items/${id}`
        : `${API_BASE_URL}/inventory/items`;

      const response = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to save inventory item");
      }

      navigate("/inventory/stock-overview");
    } catch (error) {
      console.error("Save inventory item error:", error);

      alert(error.message || "Failed to save inventory item.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/inventory/stock-overview");
  };

  if (fetchingItem) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-sm text-gray-400">
        Loading inventory item...
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="bg-slate mx-auto max-w-3xl rounded-xl border border-gray-800/70 p-6">
        \
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-white">
            {isEdit ? "Edit Inventory Item" : "Add New Inventory Item"}
          </h1>

          <p className="mt-1 text-xs text-gray-500">
            {isEdit
              ? "Update the inventory item details."
              : "Add a new item to your inventory."}
          </p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <FormField
              label="Item Name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter item name"
              required
            />

            <FormField
              label="Category"
              name="category"
              type="select"
              value={form.category}
              onChange={handleChange}
              options={categoryOptions}
              required
            />

            {form.category === "Others" && (
              <div className="md:col-span-2">
                <FormField
                  label="Custom Category"
                  name="customCategory"
                  value={form.customCategory}
                  onChange={handleChange}
                  placeholder="Enter category name"
                  required
                />
              </div>
            )}

            <FormField
              label="Unit"
              name="unit"
              type="select"
              value={form.unit}
              onChange={handleChange}
              options={UNIT_OPTIONS}
              required
            />

            <FormField
              label="Minimum Stock"
              name="minimumStock"
              type="number"
              value={form.minimumStock}
              onChange={handleChange}
              placeholder="Enter minimum stock"
              min="0"
              step="any"
              required
            />

            <FormField
              label="Cost Per Unit"
              name="costPerUnit"
              type="number"
              value={form.costPerUnit}
              onChange={handleChange}
              placeholder="Enter cost per unit"
              min="0"
              step="any"
              required
            />

            <FormField
              label="Expiry Date"
              name="expiryDate"
              type="date"
              value={form.expiryDate}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="rounded-lg border border-gray-700 px-4 py-2.5 text-sm text-gray-300 transition hover:border-gray-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="hover:bg-white-400 rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-medium text-black transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Saving..." : isEdit ? "Update Item" : "Add Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddInventoryItem;
