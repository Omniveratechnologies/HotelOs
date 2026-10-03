import Tabs from "../ui/Tabs.jsx";

const EMPTY_ARRAY = [];

const StockOverviewTabs = ({
  activeCategory,
  onChange,
  categories = EMPTY_ARRAY,
}) => {
  const categoryTabs = [
    { value: "ALL", label: "All Items" },
    ...categories.map((category) => ({
      value: category,
      label: category,
    })),
  ];

  return (
    <Tabs
      tabs={categoryTabs}
      activeTab={activeCategory}
      onChange={onChange}
    />
  );
};

export default StockOverviewTabs;