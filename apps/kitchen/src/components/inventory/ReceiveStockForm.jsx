import FormField from "../ui/FormField";
import { FiPlus } from "react-icons/fi";

const PREDEFINED_CATEGORIES = [
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
];

const UNIT_OPTIONS = [
  { value: "kg", label: "Kilograms (kg)" },
  { value: "g", label: "Grams (g)" },
  { value: "litre", label: "Litres" },
  { value: "ml", label: "Millilitres (ml)" },
  { value: "pieces", label: "Pieces" },
  { value: "dozen", label: "Dozen" },
];

const ReceiveStockForm = ({
  formData,
  inventoryItems,
  handleChange,
  handleSubmit,
  editingId,
}) => {
  /*
   * Get categories already stored in the inventory items.
   *
   * Example:
   *
   * Inventory:
   * Tomato       -> Vegetables
   * Butter       -> Dairy
   * Badam        -> Nuts
   *
   * "Nuts" will automatically become a category option.
   */
  const databaseCategories = inventoryItems
    .map((item) => item.category?.trim())
    .filter(Boolean);

  /*
   * Remove duplicate categories.
   */
  const uniqueDatabaseCategories = [
    ...new Set(databaseCategories),
  ];

  /*
   * Get only custom categories which are not already
   * part of the predefined categories.
   */
  const predefinedCategoryValues =
    PREDEFINED_CATEGORIES.map((category) => category.value);

  const customCategories = uniqueDatabaseCategories.filter(
    (category) =>
      !predefinedCategoryValues.includes(category),
  );

  /*
   * Final dropdown:
   *
   * Vegetables
   * Fruits
   * ...
   * Desserts
   * Nuts
   * Bakery
   * Others
   */
  const categoryOptions = [
    ...PREDEFINED_CATEGORIES,

    ...customCategories.map((category) => ({
      value: category,
      label: category,
    })),

    {
      value: "Others",
      label: "Others",
    },
  ];

  /*
   * When Others is selected, the user can enter
   * a completely new category.
   */
  const handleCategoryChange = (event) => {
    const { value } = event.target;

    handleChange(event);

    /*
     * When selecting an existing category,
     * clear any previous custom category.
     */
    if (value !== "Others") {
      handleChange({
        target: {
          name: "customCategory",
          value: "",
        },
      });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {/* Inventory Item */}
        <FormField
          label="Inventory Item"
          name="inventoryItem"
          type="select"
          value={formData.inventoryItem}
          onChange={handleChange}
          required
          options={inventoryItems.map((item) => ({
            value: item._id,
            label: item.name,
          }))}
        />

        {/* Category */}
        <FormField
          label="Category"
          name="category"
          type="select"
          value={formData.category}
          onChange={handleCategoryChange}
          required
          options={categoryOptions}
        />

        {/* Custom Category */}
        {formData.category === "Others" && (
          <FormField
            label="Custom Category"
            name="customCategory"
            value={formData.customCategory || ""}
            onChange={handleChange}
            placeholder="Enter category name"
            required
          />
        )}

        {/* Supplier */}
        <FormField
          label="Supplier"
          name="supplier"
          value={formData.supplier}
          onChange={handleChange}
          placeholder="Enter supplier name"
          required
        />

        {/* Quantity */}
        <FormField
          label="Quantity"
          name="quantity"
          type="number"
          value={formData.quantity}
          onChange={handleChange}
          placeholder="e.g. 20"
          min="0"
          step="any"
          required
        />

        {/* Unit */}
        <FormField
          label="Unit"
          name="unit"
          type="select"
          value={formData.unit}
          onChange={handleChange}
          required
          options={UNIT_OPTIONS}
        />

        {/* Unit Cost */}
        <FormField
          label="Unit Cost(₹)"
          name="unitCost"
          type="number"
          value={formData.unitCost}
          onChange={handleChange}
          placeholder="e.g. 40"
          min="0"
          step="any"
          required
        />

        {/* Batch Number */}
        <FormField
          label="Batch Number"
          name="batchNumber"
          value={formData.batchNumber}
          onChange={handleChange}
          placeholder="e.g. TOM-001"
        />

        {/* Manufacturing Date */}
        <FormField
          label="Manufacturing Date"
          name="manufacturingDate"
          type="date"
          value={formData.manufacturingDate}
          onChange={handleChange}
        />

        {/* Expiry Date */}
        <FormField
          label="Expiry Date"
          name="expiryDate"
          type="date"
          value={formData.expiryDate}
          onChange={handleChange}
        />
      </div>

      {/* Notes */}
      <div className="mt-5">
        <label className="mb-1.5 block font-medium text-gray-300">
          Notes
        </label>

        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={3}
          placeholder="Add any notes about this stock..."
          className="w-full resize-none rounded-lg border border-gray-700 bg-[#0f0f0f] px-3 py-2.5 text-sm text-white outline-none placeholder:text-gray-600"
        />
      </div>

      {/* Submit */}
      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white-500"
        >
          <FiPlus size={18} />

          {editingId
            ? "Update List"
            : "Add to List"}
        </button>
      </div>
    </form>
  );
};

export default ReceiveStockForm;