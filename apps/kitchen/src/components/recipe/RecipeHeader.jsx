import { FiCopy, FiEye, FiSave } from "react-icons/fi";

const RecipeHeader = ({ onDuplicate, onPreview, onSave, saving }) => {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onDuplicate}
        className="flex items-center gap-2 rounded-md border border-gray-700 px-3 py-2 text-xs font-medium text-gray-300 transition hover:border-gray-600 hover:text-white"
      >
        <FiCopy size={14} />
        Duplicate
      </button>

      <button
        type="button"
        onClick={onPreview}
        className="flex items-center gap-2 rounded-md border border-gray-700 px-3 py-2 text-xs font-medium text-gray-300 transition hover:border-gray-600 hover:text-white"
      >
        <FiEye size={14} />
        Preview
      </button>

      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="flex items-center gap-2 rounded-md bg-emerald-500 px-4 py-2 text-xs font-semibold text-black transition -400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <FiSave size={14} />
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
};

export default RecipeHeader;
