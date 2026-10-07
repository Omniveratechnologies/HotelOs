import React, { useState } from "react";
import { Modal, Input, Button } from "@hotelos/ui/components";
import { createCorporateCompany, updateCorporateCompany } from "@hotelos/api";

function getInitialFormData(company) {
  if (company) {
    return {
      name: company.name || "",
      code: company.code || "",
      contactPerson: company.contactPerson || "",
      phone: company.phone || "",
      phonePrefix: company.phonePrefix || "+91",
      email: company.email || "",
      address: company.address || "",
      gstNumber: company.gstNumber || "",
      billingType: company.billingType || "Corporate Account",
      creditLimit: String(company.creditLimit || 0),
      paymentTerms: company.paymentTerms || "30 DAYS",
      tier: company.tier || "Standard",
      creditFacility: Boolean(company.creditFacility),
      status: company.status || "ACTIVE",
    };
  }
  return {
    name: "",
    code: "",
    contactPerson: "",
    phone: "",
    phonePrefix: "+91",
    email: "",
    address: "",
    gstNumber: "",
    billingType: "Corporate Account",
    creditLimit: "100000",
    paymentTerms: "30 DAYS",
    tier: "Standard",
    creditFacility: true,
    status: "ACTIVE",
  };
}

function CorporateCompanyModalForm({ company, onClose, onSuccess }) {
  const [formData, setFormData] = useState(() => getInitialFormData(company));
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = "Company name is required";
    if (!formData.contactPerson.trim())
      errs.contactPerson = "Contact person is required";
    if (!formData.phone.trim()) errs.phone = "Phone is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        creditLimit: Number(formData.creditLimit) || 0,
      };

      let result;
      if (company?._id) {
        result = await updateCorporateCompany(company._id, payload);
      } else {
        result = await createCorporateCompany(payload);
      }

      if (result?.success || result?._id || result?.data) {
        onSuccess(result?.data || result);
        onClose();
      } else {
        setErrors({
          submit: result?.message || "Failed to save corporate company",
        });
      }
    } catch (err) {
      setErrors({ submit: err?.message || "Failed to save corporate company" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.submit && (
        <div className="rounded-lg bg-rose-50 p-3 text-xs font-medium text-rose-600">
          {errors.submit}
        </div>
      )}

      <div className="grid grid-cols-12 gap-3 text-xs">
        <div className="col-span-8">
          <Input
            label="Company Legal Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Tata Consultancy Services Ltd"
            error={errors.name}
            required
          />
        </div>
        <div className="col-span-4">
          <Input
            label="Corporate Code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            placeholder="e.g. TCS-CORP"
          />
        </div>

        <div className="col-span-6">
          <Input
            label="Primary Contact Person *"
            value={formData.contactPerson}
            onChange={(e) =>
              setFormData({ ...formData, contactPerson: e.target.value })
            }
            placeholder="e.g. Amit Sharma"
            error={errors.contactPerson}
            required
          />
        </div>
        <div className="col-span-6">
          <Input
            label="Contact Phone *"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            placeholder="e.g. 9876543210"
            error={errors.phone}
            required
          />
        </div>

        <div className="col-span-6">
          <Input
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            placeholder="corporate@company.com"
          />
        </div>
        <div className="col-span-6">
          <Input
            label="GST Identification Number"
            value={formData.gstNumber}
            onChange={(e) =>
              setFormData({ ...formData, gstNumber: e.target.value })
            }
            placeholder="27AAAAA0000A1Z5"
          />
        </div>

        <div className="col-span-12">
          <Input
            label="Registered Address"
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
            placeholder="Tower B, Tech Park, Bangalore"
          />
        </div>

        <div className="col-span-4">
          <label className="mb-1 block font-semibold text-gray-700">
            Billing Type
          </label>
          <select
            value={formData.billingType}
            onChange={(e) =>
              setFormData({ ...formData, billingType: e.target.value })
            }
            className="focus:border-brand-500 w-full rounded-lg border border-gray-200 bg-white p-2.5 outline-none"
          >
            <option value="Corporate Account">Corporate Account</option>
            <option value="Direct Billing (Bill to Company)">
              Direct Billing (BTC)
            </option>
            <option value="Guest Direct Pay">Guest Direct Pay</option>
          </select>
        </div>

        <div className="col-span-4">
          <Input
            label="Credit Limit (₹)"
            type="number"
            value={formData.creditLimit}
            onChange={(e) =>
              setFormData({ ...formData, creditLimit: e.target.value })
            }
            placeholder="100000"
          />
        </div>

        <div className="col-span-4">
          <label className="mb-1 block font-semibold text-gray-700">
            Payment Terms
          </label>
          <select
            value={formData.paymentTerms}
            onChange={(e) =>
              setFormData({ ...formData, paymentTerms: e.target.value })
            }
            className="focus:border-brand-500 w-full rounded-lg border border-gray-200 bg-white p-2.5 outline-none"
          >
            <option value="15 DAYS">15 Days</option>
            <option value="30 DAYS">30 Days</option>
            <option value="45 DAYS">45 Days</option>
            <option value="ON CHECKOUT">On Checkout</option>
          </select>
        </div>

        <div className="col-span-6">
          <label className="mb-1 block font-semibold text-gray-700">
            Partnership Tier
          </label>
          <select
            value={formData.tier}
            onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
            className="focus:border-brand-500 w-full rounded-lg border border-gray-200 bg-white p-2.5 outline-none"
          >
            <option value="Standard">Standard</option>
            <option value="Silver">Silver</option>
            <option value="Gold">Gold</option>
            <option value="Platinum">Platinum</option>
          </select>
        </div>

        <div className="col-span-6">
          <label className="mb-1 block font-semibold text-gray-700">
            Account Status
          </label>
          <select
            value={formData.status}
            onChange={(e) =>
              setFormData({ ...formData, status: e.target.value })
            }
            className="focus:border-brand-500 w-full rounded-lg border border-gray-200 bg-white p-2.5 outline-none"
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive / Suspended</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-3 border-t border-gray-100 pt-3">
        <Button variant="secondary" type="button" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" disabled={submitting}>
          {submitting
            ? "Saving..."
            : company
              ? "Update Company"
              : "Save Company"}
        </Button>
      </div>
    </form>
  );
}

export default function CorporateCompanyModal({
  isOpen,
  onClose,
  onSuccess,
  company = null,
}) {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={company ? "Edit Corporate Account" : "Register Corporate Account"}
      size="lg"
    >
      <CorporateCompanyModalForm
        key={company?._id || "new-company"}
        company={company}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    </Modal>
  );
}
