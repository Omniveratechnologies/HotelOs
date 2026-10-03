import FormField from "../ui/FormField";

const SupplierForm = ({ formData, setFormData }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="p-5">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-800 bg-[#0b1117] p-5">
          <h2 className="mb-4 text-sm font-semibold text-white">
            Basic Information
          </h2>

          <div className="space-y-4">
            <FormField
              label="Supplier Name"
              name="supplierName"
              value={formData.supplierName}
              onChange={handleChange}
              placeholder="FreshFarm Co."
              required
            />

            <FormField
              label="Company Name"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              placeholder="FreshFarm Traders Pvt. Ltd."
            />

            <FormField
              label="Supplier Code"
              name="supplierCode"
              value={formData.supplierCode}
              onChange={handleChange}
              placeholder="SUP-001"
            />

            <FormField
              label="Contact Person"
              name="contactPerson"
              value={formData.contactPerson}
              onChange={handleChange}
              placeholder="Rohit Sharma"
              required
            />

            <FormField
              label="Phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="98765 43210"
              maxLength={10}
              required
            />

            <FormField
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="contact@example.com"
            />

            <FormField
              label="Categories"
              name="categories"
              type="multiselect"
              value={formData.categories}
              onChange={handleChange}
              options={[
                { value: "Vegetables", label: "Vegetables" },
                { value: "Fruits", label: "Fruits" },
                { value: "Dairy", label: "Dairy" },
                { value: "Beverage", label: "Beverage" },
                { value: "Meat", label: "Meat" },
                { value: "Spices", label: "Spices" },
                { value: "Seasoning", label: "Seasoning" },
                { value: "Grains", label: "Grains" },
              ]}
              required
            />

            <FormField
              label="Status"
              name="status"
              type="select"
              value={formData.status}
              onChange={handleChange}
              options={[
                { value: "ACTIVE", label: "Active" },
                { value: "INACTIVE", label: "Inactive" },
              ]}
            />
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-xl border border-gray-800 bg-[#0b1117] p-5">
            <h2 className="mb-4 text-sm font-semibold text-white">Address</h2>

            <div className="space-y-4">
              <FormField
                label="Address Line 1"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="A-12, Aradpur Mandi"
              />

              <FormField
                label="Address Line 2"
                name="addressLine2"
                value={formData.addressLine2}
                onChange={handleChange}
                placeholder="Near Gate No. 3"
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  label="City"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="New Delhi"
                />

                <FormField
                  label="State"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="Delhi"
                />
              </div>

              <FormField
                label="Pincode"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                placeholder="110033"
              />
            </div>
          </div>
          \
          <div className="rounded-xl border border-gray-800 bg-[#0b1117] p-5">
            <h2 className="mb-4 text-sm font-semibold text-white">
              Other Details
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  label="Tax Number (GST)"
                  name="gstNumber"
                  value={formData.gstNumber}
                  onChange={handleChange}
                  placeholder="07AACF1234Q1Z1"
                />

                <FormField
                  label="Payment Terms"
                  name="paymentTerms"
                  type="select"
                  value={formData.paymentTerms}
                  onChange={handleChange}
                  options={[
                    { value: "CASH", label: "Cash" },
                    { value: "7 DAYS", label: "Net 7 Days" },
                    { value: "15 DAYS", label: "Net 15 Days" },
                    { value: "30 DAYS", label: "Net 30 Days" },
                    { value: "45 DAYS", label: "Net 45 Days" },
                  ]}
                />
              </div>

              <FormField
                label="Notes"
                name="notes"
                type="textarea"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Add supplier notes..."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierForm;
