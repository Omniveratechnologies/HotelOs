import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-between border-t border-gray-800 px-2 py-3">
      <p className="text-xs text-gray-500">
        Page {currentPage} of {totalPages}
      </p>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-700 text-gray-400 transition hover:bg-gray-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <FiChevronLeft size={15} />
        </button>

        {Array.from({ length: totalPages }, (_, index) => {
          const page = index + 1;

          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`h-8 min-w-8 rounded-md px-2 text-xs transition ${
                currentPage === page
                  ? "bg-emerald-600 text-white"
                  : "border border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
            >
              {page}
            </button>
          );
        })}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-700 text-gray-400 transition hover:bg-gray-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <FiChevronRight size={15} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
