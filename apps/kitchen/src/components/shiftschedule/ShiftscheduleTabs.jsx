export const TABS = [
  { key: "overview", label: "Shift Overview" },
  { key: "roster", label: "Staff Schedule" },
  { key: "calendar", label: "Shift Calendar" },
];

const ShiftscheduleTabs = ({ active, onChange }) => (
  <div
    role="tablist"
    aria-label="Shift & Schedule views"
    className="flex gap-6 border-b border-gray-800"
  >
    {TABS.map((tab) => {
      const selected = tab.key === active;
      return (
        <button
          key={tab.key}
          type="button"
          role="tab"
          aria-selected={selected}
          onClick={() => onChange(tab.key)}
          className={`-mb-px border-b-2 px-1 pb-3 text-xs font-medium transition ${
            selected
              ? "border-emerald-400 text-emerald-400"
              : "border-transparent text-gray-500 hover:text-gray-300"
          }`}
        >
          {tab.label}
        </button>
      );
    })}
  </div>
);

export default ShiftscheduleTabs;
