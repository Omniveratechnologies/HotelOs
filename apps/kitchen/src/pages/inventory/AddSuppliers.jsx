import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MdInventory } from "react-icons/md";

import Navbar from "../../components/ui/Navbar.jsx";
import Sidebar from "../../components/Hamburger/SideBar.jsx";
import SupplierForm from "../../components/suppliers/SupplierForm.jsx";
import API_BASE_URL from "../../config/api.js";

const AddSuppliers = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [navbarSearchTerm, setNavbarSearchTerm] = useState("");
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    supplierName: "",
    supplierCode: "",
    companyName: "",
    contactPerson: "",
    phone: "",
    email: "",
    categories: [],
    status: "ACTIVE",
    address: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    gstNumber: "",
    paymentTerms: "CASH",
    notes: "",
  });

  useEffect(() => {
    if (!isEditMode) return;

    const fetchSupplier = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/inventory/suppliers/${id}`,
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Failed to fetch supplier");
        }

        const supplier = result.data || result;

        setFormData({
          supplierName: supplier.supplierName || "",
          supplierCode: supplier.supplierCode || "",
          companyName: supplier.companyName || "",
          contactPerson: supplier.contactPerson || "",
          phone: supplier.phone || "",
          email: supplier.email || "",
          categories: supplier.categories || [],
          status: supplier.status || "ACTIVE",
          address: supplier.address || "",
          addressLine2: supplier.addressLine2 || "",
          city: supplier.city || "",
          state: supplier.state || "",
          pincode: supplier.pincode || "",
          gstNumber: supplier.gstNumber || "",
          paymentTerms: supplier.paymentTerms || "CASH",
          notes: supplier.notes || "",
        });
      } catch (error) {
        console.error("Fetch supplier error:", error);
      }
    };

    fetchSupplier();
  }, [id, isEditMode]);
  const handleSubmit = async () => {
    try {
      const payload = {
        ...formData,
        supplierCode: formData.supplierCode.trim() || undefined,
      };

      const url = isEditMode
        ? `${API_BASE_URL}/inventory/suppliers/${id}`
        : `${API_BASE_URL}/inventory/suppliers`;

      const response = await fetch(url, {
        method: isEditMode ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            `Failed to ${isEditMode ? "update" : "add"} supplier`,
        );
      }

      navigate("/inventory/suppliers");
    } catch (error) {
      console.error(`${isEditMode ? "Update" : "Add"} supplier error:`, error);
    }
  };

  return (
    <div className="relative h-screen overflow-hidden bg-[#0f0f0f] text-white">
      <Sidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

      <div
        className={`h-full overflow-y-auto transition-transform duration-300 ease-in-out ${
          isMenuOpen ? "translate-x-64" : "translate-x-0"
        }`}
      >
        <Navbar
          icon={<MdInventory />}
          iconColor="text-emerald-500"
          bgColor="bg-emerald-500/10"
          title={isEditMode ? "Edit Supplier" : "Add Suppliers"}
          subtitle={
            isEditMode
              ? "Update supplier information."
              : "Add a new supplier to your system."
          }
          isMenuOpen={isMenuOpen}
          breadcrumb={
            isEditMode
              ? "Inventory → Suppliers → Edit Supplier"
              : "Inventory → Suppliers → Add Supplier"
          }
          pageAction={
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate("/inventory/suppliers")}
                className="rounded-lg border border-gray-700 px-5 py-2.5 text-xs font-medium text-gray-300 transition hover:bg-gray-800 hover:text-white"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                className="hover:bg-white-500 rounded-lg bg-emerald-600 px-5 py-2.5 text-xs font-medium text-white transition"
              >
                {isEditMode ? "Update Supplier" : "Add Supplier"}
              </button>
            </div>
          }
          showPageHeading
          setIsMenuOpen={setIsMenuOpen}
          navbarSearchTerm={navbarSearchTerm}
          setNavbarSearchTerm={setNavbarSearchTerm}
        />

        <main className="mt-3 px-4">
          <SupplierForm formData={formData} setFormData={setFormData} />
        </main>
      </div>
    </div>
  );
};

export default AddSuppliers;
