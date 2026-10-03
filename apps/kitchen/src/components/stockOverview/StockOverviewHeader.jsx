import SearchBar from "../ui/SearchBar.jsx";
import Filters from "../ui/Filters.jsx";

const EMPTY_ARRAY = [];

const STATUS_OPTIONS = [
  { value: "ALL", label: "All Status" },
  { value: "IN STOCK", label: "In Stock" },
  { value: "LOW STOCK", label: "Low Stock" },
  { value: "OUT OF STOCK", label: "Out of Stock" },
];

const CATEGORY_OPTIONS = [
  { value: "ALL", label: "All Categories" },
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

const SORT_OPTIONS = [
  { value: "name", label: "Name (A-Z)" },
  { value: "expiry", label: "Expiry (Earliest)" },
  { value: "stock", label: "Stock (Lowest)" },
];

const StockOverviewHeader = ({
  searchTerm,
  setSearchTerm,
  filterValues,
  onFilterChange,
  supplierOptions = EMPTY_ARRAY,
}) => {
  const filters = [
    {
      name: "supplier",
      options: [{ value: "ALL", label: "All Suppliers" }, ...supplierOptions],
    },
    {
      name: "status",
      options: STATUS_OPTIONS,
    },
    {
      name: "category",
      options: CATEGORY_OPTIONS,
    },
    {
      name: "sortBy",
      options: SORT_OPTIONS,
    },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <SearchBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        placeholder="Search items..."
      />

      <Filters
        filters={filters}
        values={filterValues}
        onChange={onFilterChange}
      />
    </div>
  );
};

export default StockOverviewHeader;
