import { FiCamera } from "react-icons/fi";
import FormField from "../ui/FormField.jsx";

const CATEGORY_OPTIONS = [
  { value: "Starter", label: "Starter" },
  { value: "Main Course", label: "Main Course" },
  { value: "Dessert", label: "Dessert" },
  { value: "Beverage", label: "Beverage" },
  { value: "Side Dish", label: "Side Dish" },
];

const SERVING_UNIT_OPTIONS = [
  { value: "plate", label: "plate" },
  { value: "bowl", label: "bowl" },
  { value: "piece", label: "piece" },
  { value: "glass", label: "glass" },
];

const TIME_UNIT_OPTIONS = [
  { value: "minutes", label: "minutes" },
  { value: "hours", label: "hours" },
];

const DIFFICULTY_OPTIONS = [
  { value: "Easy", label: "Easy" },
  { value: "Medium", label: "Medium" },
  { value: "Hard", label: "Hard" },
];

const RecipeForm = ({ form, onChange, onImageSelect }) => {
  return (
    <div className="bg-slate rounded-xl border border-gray-800/70 p-5">
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-base font-semibold text-white">
          Basic Information
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-[1fr_1fr_160px]">
        <div className="space-y-4 sm:col-span-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Menu Item"
              name="menuItemName"
              value={form.menuItemName}
              onChange={onChange}
              required
            />
            <FormField
              label="Category"
              name="category"
              type="select"
              value={form.category}
              onChange={onChange}
              options={CATEGORY_OPTIONS}
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid grid-cols-2 gap-2">
              <FormField
                label="Serving Size"
                name="servingSize"
                type="number"
                value={form.servingSize}
                onChange={onChange}
                required
              />
              <FormField
                label="Unit"
                name="servingUnit"
                type="select"
                value={form.servingUnit}
                onChange={onChange}
                options={SERVING_UNIT_OPTIONS}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <FormField
                label="Preparation Time"
                name="preparationTime"
                type="number"
                value={form.preparationTime}
                onChange={onChange}
                required
              />
              <FormField
                label="Unit"
                name="preparationTimeUnit"
                type="select"
                value={form.preparationTimeUnit}
                onChange={onChange}
                options={TIME_UNIT_OPTIONS}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Cuisine Type"
              name="cuisineType"
              value={form.cuisineType}
              onChange={onChange}
              required
            />
            <FormField
              label="Difficulty Level"
              name="difficultyLevel"
              type="select"
              value={form.difficultyLevel}
              onChange={onChange}
              options={DIFFICULTY_OPTIONS}
              required
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-300">
            Image
          </label>
          <div className="relative h-32 w-full overflow-hidden rounded-lg border border-gray-700 bg-[#0f0f0f]">
            {form.imageUrl ? (
              <img
                src={form.imageUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-gray-600">
                <FiCamera size={24} />
              </div>
            )}
            <label className="absolute right-1.5 bottom-1.5 flex cursor-pointer items-center gap-1 rounded-md bg-black/70 px-2 py-1 text-[10px] text-white hover:bg-black/90">
              <FiCamera size={11} />
              Change Image
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onImageSelect?.(e.target.files?.[0])}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeForm;
