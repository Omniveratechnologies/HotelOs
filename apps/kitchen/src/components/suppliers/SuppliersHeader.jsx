import SearchBar from "../ui/SearchBar";
import Filters from "../ui/Filters";

const SuppliersHeader = ({
  searchTerm,
  setSearchTerm,
  filterValues,
  setFilterValues,
}) => {
  const supplierFilters = [
    {
      name: "category",
      label: "Category",
      options: [
        { value: "ALL", label: "All Categories" },
        { value: "Vegetables", label: "Vegetables" },
        { value: "Fruits", label: "Fruits" },
        { value: "Dairy", label: "Dairy" },
        { value: "Beverage", label: "Beverage" },
        { value: "Meat", label: "Meat" },
        { value: "Spices", label: "Spices" },
        { value: "Seasoning", label: "Seasoning" },
        { value: "Grains", label: "Grains" },
      ],
    },
    {
      name: "status",
      label: "Status",
      options: [
        { value: "ALL", label: "All Status" },
        { value: "ACTIVE", label: "Active" },
        { value: "INACTIVE", label: "Inactive" },
      ],
    },
  ];

  const handleFilterChange = (name, value) => {
    setFilterValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="flex flex-col gap-3 border-b border-gray-800 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <SearchBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        placeholder="Search suppliers..."
      />

      <Filters
        filters={supplierFilters}
        values={filterValues}
        onChange={handleFilterChange}
      />
    </div>
  );
};

export default SuppliersHeader;
