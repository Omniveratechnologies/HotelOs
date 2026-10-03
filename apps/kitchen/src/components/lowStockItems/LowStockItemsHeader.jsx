import Tabs from "../ui/Tabs";
import SearchBar from "../ui/SearchBar";

const LowStockHeader = ({
  tabs,
  activeTab,
  onTabChange,
  searchTerm,
  setSearchTerm,
}) => {
  //   const filters = [
  //     {
  //       name: "category",
  //       options: [
  //         { value: "all", label: "All Categories" },
  //         { value: "Vegetables", label: "Vegetables" },
  //         { value: "Fruits", label: "Fruits" },
  //         { value: "Dairy", label: "Dairy" },
  //         { value: "Meat", label: "Meat" },
  //         { value: "Grains", label: "Grains" },
  //         { value: "Spices", label: "Spices" },
  //       ],
  //     },
  //     {
  //       name: "supplier",
  //       options: [
  //         { value: "all", label: "All Suppliers" },
  //       ],
  //     },
  //   ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={onTabChange} />

      {/* Search + Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <SearchBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          placeholder="Search items..."
        />

        {/* <Filters
          filters={filters}
          values={filterValues}
          onChange={onFilterChange}
        /> */}
      </div>
    </div>
  );
};

export default LowStockHeader;
