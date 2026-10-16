import { useState } from "react";
import { createMenuItem } from "../../services/menu.js";

const MenuForm = ({ onCancel = () => window.history.back() }) => {
  const [formData, setFormData] = useState({
    name: "",
    shortDescription: "",
    description: "",
    category: "",
    price: "",
    stock: "",
    availability: "Always",
    isVeg: false,
    isSpicy: false,
    isChefSpecial: false,
    isRoomServiceAvailable: false,
    isAvailable: true,
    image: null,
  });

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? checked : type === "file" ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let image = "";
      if (formData.image) {
        if (formData.image.size > 2 * 1024 * 1024)
          throw new Error("Image must be smaller than 2MB");
        image = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(formData.image);
        });
      }

      await createMenuItem({
        name: formData.name,
        description: formData.description || formData.shortDescription,
        price: Number(formData.price),
        category: formData.category,
        image,
        stock: Number(formData.stock || 0),
        availability: formData.availability,
        isVeg: formData.isVeg,
        isSpicy: formData.isSpicy,
        isChefSpecial: formData.isChefSpecial,
        isRoomServiceAvailable: formData.isRoomServiceAvailable,
        isAvailable: formData.isAvailable,
      });

      alert("Menu item added successfully!");

      onCancel();
    } catch (error) {
      alert(error.message || "Failed to add menu item");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6">
      <div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">
          Basic Information
        </h3>

        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Item Name <span className="text-red-500">*</span>
            </label>

            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter item name"
              required
              className="focus:border-white-500 focus:ring-white-500/20 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm transition outline-none focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Short Description
            </label>

            <input
              type="text"
              name="shortDescription"
              value={formData.shortDescription}
              onChange={handleChange}
              placeholder="Enter short description"
              className="focus:border-white-500 focus:ring-white-500/20 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm transition outline-none focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Detailed Description
            </label>

            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              placeholder="Describe the menu item..."
              className="focus:border-white-500 focus:ring-white-500/20 w-full resize-none rounded-lg border border-slate-300 px-4 py-2.5 text-sm transition outline-none focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Category
            </label>

            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="focus:border-white-500 focus:ring-white-500/20 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm transition outline-none focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            >
              <option value="">Select category</option>
              <option value="Starters">Starters</option>
              <option value="Main Course">Main Course</option>
              <option value="Beverages">Beverages</option>
              <option value="Desserts">Desserts</option>
              <option value="Combos">Combos</option>
            </select>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 pt-6 dark:border-slate-700">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">
          Pricing & Stock
        </h3>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Price <span className="text-red-500">*</span>
            </label>

            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="₹ 0.00"
              min="0"
              required
              className="focus:border-white-500 focus:ring-white-500/20 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm transition outline-none focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Stock
            </label>

            <input
              type="number"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
              placeholder="Enter stock"
              min="0"
              className="focus:border-white-500 focus:ring-white-500/20 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm transition outline-none focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 pt-6 dark:border-slate-700">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">
          Availability
        </h3>

        <div className="mt-4">
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Availability Schedule
          </label>

          <select
            name="availability"
            value={formData.availability}
            onChange={handleChange}
            className="focus:border-white-500 focus:ring-white-500/20 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm transition outline-none focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          >
            <option value="Always">Always</option>
            <option value="Breakfast Only">Breakfast Only</option>
            <option value="Lunch Only">Lunch Only</option>
            <option value="Dinner Only">Dinner Only</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>
        </div>
      </div>

      <div className="border-t border-slate-200 pt-6 dark:border-slate-700">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">
          Item Options
        </h3>

        <div className="mt-4 space-y-3">
          <Checkbox
            name="isVeg"
            checked={formData.isVeg}
            onChange={handleChange}
            label="Veg Item"
          />

          <Checkbox
            name="isSpicy"
            checked={formData.isSpicy}
            onChange={handleChange}
            label="Spicy"
          />

          <Checkbox
            name="isChefSpecial"
            checked={formData.isChefSpecial}
            onChange={handleChange}
            label="Chef's Special"
          />

          <Checkbox
            name="isRoomServiceAvailable"
            checked={formData.isRoomServiceAvailable}
            onChange={handleChange}
            label="Room Service Available"
          />
        </div>
      </div>

      <div className="border-t border-slate-200 pt-6 dark:border-slate-700">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">
          Item Image
        </h3>

        <div className="mt-4">
          <input
            type="file"
            name="image"
            accept="image/*"
            onChange={handleChange}
            className="block w-full rounded-lg border border-slate-300 p-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
          />
        </div>
      </div>

      <div className="border-t border-slate-200 pt-6 dark:border-slate-700">
        <Checkbox
          name="isAvailable"
          checked={formData.isAvailable}
          onChange={handleChange}
          label="Item is active and available"
        />
      </div>

      <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-200 bg-white py-4 dark:border-slate-700 dark:bg-slate-900">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Cancel
        </button>

        <button
          type="submit"
          className="hover:bg-white-700 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition"
        >
          Add Item
        </button>
      </div>
    </form>
  );
};

const Checkbox = ({ name, checked, onChange, label }) => {
  return (
    <label className="flex cursor-pointer items-center gap-3">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        className="focus:ring-white-500 h-4 w-4 rounded border-slate-300 text-emerald-600"
      />

      <span className="text-sm text-slate-700 dark:text-slate-300">
        {label}
      </span>
    </label>
  );
};

export default MenuForm;
