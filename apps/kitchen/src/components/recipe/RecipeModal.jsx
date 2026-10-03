import { FiX } from "react-icons/fi";

const RecipeModal = ({ recipe, onClose }) => {
  if (!recipe) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-xl border border-gray-800 bg-[#111111] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          {recipe.imageUrl ? (
            <img
              src={recipe.imageUrl}
              alt={recipe.menuItemName}
              className="h-48 w-full object-cover"
            />
          ) : (
            <div className="flex h-48 w-full items-center justify-center bg-gray-900 text-gray-600">
              No image
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
          >
            <FiX size={16} />
          </button>
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between">
            <h2 className="text-lg font-semibold text-white">
              {recipe.menuItemName}
            </h2>
            <span className="text-lg font-bold text-emerald-400">
              ₹{recipe.sellingPrice}
            </span>
          </div>

          <p className="mt-1 text-xs text-gray-500">
            {recipe.category} · {recipe.cuisineType} · {recipe.servingSize}{" "}
            {recipe.servingUnit}
          </p>

          {recipe.description && (
            <p className="mt-3 text-sm text-gray-400">{recipe.description}</p>
          )}

          <div className="mt-4 flex items-center gap-3 text-xs text-gray-500">
            <span>
              ⏱ {recipe.preparationTime} {recipe.preparationTimeUnit}
            </span>
            <span>📊 {recipe.difficultyLevel}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeModal;
