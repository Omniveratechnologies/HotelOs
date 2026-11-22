const MenuItemStatusCard = ({ form, onChange }) => {
  const toggleActive = () => {
    onChange({ target: { name: "isActive", value: !form.isActive } });
  };

  const handleTextChange = (e) => {
    onChange(e);
  };

  return (
    <div className="bg-slate rounded-xl border border-gray-800/70 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-200">
          Menu Item Status
        </h3>

        <button
          type="button"
          onClick={toggleActive}
          className={`relative h-6 w-11 rounded-full transition ${
            form.isActive ? "bg-emerald-500" : "bg-gray-700"
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
              form.isActive ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-300">
            Selling Price (₹) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="sellingPrice"
            value={form.sellingPrice}
            onChange={handleTextChange}
            className="w-full rounded-lg border border-gray-700 bg-[#0f0f0f] px-3 py-2.5 text-sm text-white outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 flex items-center justify-between text-xs font-medium text-gray-300">
            Description
            <span className="text-[10px] text-gray-600">
              {(form.description || "").length}/500
            </span>
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleTextChange}
            maxLength={500}
            rows={4}
            className="w-full resize-none rounded-lg border border-gray-700 bg-[#0f0f0f] px-3 py-2.5 text-sm text-white outline-none"
          />
        </div>
      </div>
    </div>
  );
};

export default MenuItemStatusCard;
