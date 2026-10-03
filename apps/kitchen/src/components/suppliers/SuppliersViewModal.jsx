import { FiX } from "react-icons/fi";

const SuppliersViewModal = ({ supplier, onClose }) => {
  if (!supplier) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-2xl rounded-xl border border-gray-800 bg-[#111111] shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-800 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-white">
              Supplier Details
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              View supplier information
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-gray-400 transition hover:bg-gray-800 hover:text-white"
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 px-5 py-5 sm:grid-cols-2">
          <DetailItem label="Supplier Name" value={supplier.supplierName} />

          <DetailItem label="Supplier Code" value={supplier.supplierCode} />

          <DetailItem label="Contact Person" value={supplier.contactPerson} />

          <DetailItem label="Phone" value={supplier.phone} />

          <DetailItem label="Email" value={supplier.email} />

          <DetailItem label="GST Number" value={supplier.gstNumber} />

          <DetailItem label="Payment Terms" value={supplier.paymentTerms} />

          <DetailItem label="Status" value={supplier.status} />

          <div className="sm:col-span-2">
            <p className="mb-1 text-[11px] text-gray-500">
              Categories Supplied
            </p>

            <div className="flex flex-wrap gap-2">
              {supplier.categories?.length > 0 ? (
                supplier.categories.map((category) => (
                  <span
                    key={category}
                    className="rounded-md bg-gray-800 px-2.5 py-1 text-xs text-gray-300"
                  >
                    {category}
                  </span>
                ))
              ) : (
                <span className="text-xs text-gray-500">-</span>
              )}
            </div>
          </div>

          <div className="sm:col-span-2">
            <p className="mb-1 text-[11px] text-gray-500">Address</p>

            <p className="text-sm text-gray-300">
              {[
                supplier.address,
                supplier.city,
                supplier.state,
                supplier.pincode,
              ]
                .filter(Boolean)
                .join(", ") || "-"}
            </p>
          </div>

          <DetailItem
            label="Total Purchase Value"
            value={`₹${Number(supplier.totalPurchaseValue || 0).toLocaleString(
              "en-IN",
            )}`}
          />
        </div>

        <div className="flex justify-end border-t border-gray-800 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-700 px-4 py-2 text-xs font-medium text-gray-300 transition hover:bg-gray-800 hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const DetailItem = ({ label, value }) => {
  return (
    <div>
      <p className="mb-1 text-[11px] text-gray-500">{label}</p>

      <p className="text-sm text-gray-200">{value || "-"}</p>
    </div>
  );
};

export default SuppliersViewModal;
