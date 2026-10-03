const EMPTY_ARRAY = [];

const Tabs = ({ tabs = EMPTY_ARRAY, activeTab, onChange }) => {
  return (
    <div className="flex rounded-lg border border-gray-700 bg-[#0b1d29] p-1">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.value;

        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            className={`rounded-md px-4 py-1.5 text-xs font-semibold transition ${
              isActive
                ? "bg-emerald-300 text-black"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;
