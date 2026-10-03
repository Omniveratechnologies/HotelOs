import { useEffect, useState } from "react";
import { FiMail, FiMapPin, FiPhone, FiUser } from "react-icons/fi";
import API_BASE_URL from "../../config/api.js";

const CreatePurchaseOrderHeader = ({ formData, setFormData }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setLoadingSuppliers(true);

        const response = await fetch(`${API_BASE_URL}/inventory/suppliers`);

        const result = await response.json();

        if (result.success) {
          setSuppliers(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch suppliers:", error);
      } finally {
        setLoadingSuppliers(false);
      }
    };

    fetchSuppliers();
  }, []);

  const selectedSupplier = suppliers.find(
    (supplier) => supplier._id === formData.supplier,
  );

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="rounded-xl border border-gray-800 bg-[#111111] p-5 lg:col-span-2">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-2 block text-xs font-medium text-gray-300">
              Supplier <span className="text-red-400">*</span>
            </label>

            <select
              name="supplier"
              value={formData.supplier}
              onChange={handleChange}
              disabled={loadingSuppliers}
              className="w-full rounded-lg border border-gray-700 bg-[#0f0f0f] px-3 py-2.5 text-sm text-white transition outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">
                {loadingSuppliers ? "Loading suppliers..." : "Select supplier"}
              </option>

              {suppliers.map((supplier) => (
                <option key={supplier._id} value={supplier._id}>
                  {supplier.supplierName}
                  {supplier.companyName ? ` (${supplier.companyName})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-gray-300">
              Expected Delivery Date <span className="text-red-400">*</span>
            </label>

            <div className="relative">
              <input
                type="date"
                name="expectedDeliveryDate"
                value={formData.expectedDeliveryDate}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-700 bg-[#0f0f0f] px-3 py-2.5 text-sm text-white transition outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-gray-300">
              Order Notes
            </label>

            <input
              type="text"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Enter order notes"
              className="w-full rounded-lg border border-gray-700 bg-[#0f0f0f] px-3 py-2.5 text-sm text-white transition outline-none placeholder:text-gray-600"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-800 bg-[#111111] p-5">
        <h3 className="mb-4 text-sm font-semibold text-white">Supplier Info</h3>

        {!selectedSupplier ? (
          <div className="flex min-h-[150px] items-center justify-center text-center">
            <p className="text-xs text-gray-500">
              Select a supplier to view supplier information
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
                <FiUser size={20} />
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {selectedSupplier.supplierName}
                </p>

                {selectedSupplier.companyName && (
                  <p className="truncate text-xs text-gray-500">
                    {selectedSupplier.companyName}
                  </p>
                )}
              </div>
            </div>

            {selectedSupplier.contactPerson && (
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <FiUser size={14} className="shrink-0" />
                <span>{selectedSupplier.contactPerson}</span>
              </div>
            )}

            {selectedSupplier.phone && (
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <FiPhone size={14} className="shrink-0" />
                <span>{selectedSupplier.phone}</span>
              </div>
            )}

            {selectedSupplier.email && (
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <FiMail size={14} className="shrink-0" />
                <span className="truncate">{selectedSupplier.email}</span>
              </div>
            )}

            {(selectedSupplier.address ||
              selectedSupplier.city ||
              selectedSupplier.state) && (
              <div className="flex items-start gap-3 text-xs text-gray-400">
                <FiMapPin size={14} className="mt-0.5 shrink-0" />

                <span>
                  {[
                    selectedSupplier.address,
                    selectedSupplier.city,
                    selectedSupplier.state,
                    selectedSupplier.pincode,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              </div>
            )}

            <div>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium ${
                  selectedSupplier.status === "ACTIVE"
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-red-500/10 text-red-400"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    selectedSupplier.status === "ACTIVE"
                      ? "bg-emerald-400"
                      : "bg-red-400"
                  }`}
                />

                {selectedSupplier.status}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatePurchaseOrderHeader;
