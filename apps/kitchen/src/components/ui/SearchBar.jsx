import { FiSearch } from "react-icons/fi";

const SearchBar = ({ searchTerm, setSearchTerm, placeholder }) => {
  return (
    <div className="relative w-40 sm:w-52 md:w-64">
      <FiSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />

      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-600 bg-transparent py-2 pr-3 pl-10 text-sm text-white outline-none placeholder:text-gray-500 focus:border-white"
      />
    </div>
  );
};

export default SearchBar;
