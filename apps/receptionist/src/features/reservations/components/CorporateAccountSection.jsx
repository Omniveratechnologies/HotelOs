import React from "react";
import { Building, Plus } from "lucide-react";
import { SectionCard, Button, Input } from "@hotelos/ui/components";
import { formatCurrency } from "@hotelos/utils";

export default function CorporateAccountSection({
  corporate,
  companies = [],
  companiesLoading = false,
  errors = {},
  onChange,
  onOpenNewCompanyModal,
}) {
  return (
    <SectionCard
      title="Corporate Account"
      subtitle="Select corporate client and review billing parameters"
      icon={Building}
    >
      <div className="grid grid-cols-12 gap-4">
        {/* Company Selector */}
        <div className="col-span-12 sm:col-span-8">
          <label
            htmlFor="corp-company-select"
            className="text-brand-900 mb-1.5 block text-sm font-semibold"
          >
            Company Name <span className="text-rose-500">*</span>
          </label>
          <div className="flex gap-2">
            <select
              id="corp-company-select"
              value={corporate.name || ""}
              onChange={(e) => {
                const selectedName = e.target.value;
                const match = companies.find((c) => c.name === selectedName);
                if (match) {
                  onChange("all", {
                    name: match.name,
                    code: match.code || "",
                    contactPerson: match.contactPerson || "",
                    phone: match.phone || "",
                    phonePrefix: match.phonePrefix || "+91",
                    email: match.email || "",
                    billingType: match.billingType || "Corporate Account",
                    creditLimit: match.creditLimit || "",
                    address: match.address || "",
                    gstNumber: match.gstNumber || "",
                    paymentTerms: match.paymentTerms || "30 Days",
                    costCenter: match.costCenter || "",
                    tier: match.tier || "Standard",
                    creditFacility: match.creditFacility ?? true,
                  });
                } else {
                  onChange("name", selectedName);
                }
              }}
              className="text-brand-900 focus:border-primary-500 focus:ring-primary-500/15 h-10 flex-1 rounded-lg border border-gray-200 bg-white px-3 text-sm transition outline-none focus:ring-2"
              disabled={companiesLoading}
            >
              <option value="">Select a company...</option>
              {companies.map((c) => (
                <option key={c._id || c.id || c.code} value={c.name}>
                  {c.name} {c.code ? `(${c.code})` : ""}
                </option>
              ))}
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={onOpenNewCompanyModal}
              className="gap-1.5 whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              Add New
            </Button>
          </div>
          {errors["corporate.name"] && (
            <p className="mt-1.5 text-xs font-medium text-rose-500">
              {errors["corporate.name"]}
            </p>
          )}
        </div>

        {/* Selected Company Preview Card */}
        {corporate.name && (
          <div className="col-span-12 rounded-xl border border-purple-200 bg-purple-50/50 p-4">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h4 className="text-base font-bold text-purple-950">
                  {corporate.name}
                </h4>
                <p className="text-xs text-purple-700">
                  Code: {corporate.code || "CORP-01"}
                </p>
              </div>
              <div className="flex gap-2">
                <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-800">
                  {corporate.tier || "Preferred Partner"}
                </span>
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
                  Credit Facility
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-purple-100 pt-2 text-xs sm:grid-cols-4">
              <div>
                <span className="block text-purple-600">Contact</span>
                <span className="font-semibold text-purple-900">
                  {corporate.contactPerson || "—"}
                </span>
              </div>
              <div>
                <span className="block text-purple-600">Phone</span>
                <span className="font-semibold text-purple-900">
                  {corporate.phone || "—"}
                </span>
              </div>
              <div>
                <span className="block text-purple-600">Credit Limit</span>
                <span className="font-semibold text-purple-900">
                  {corporate.creditLimit
                    ? formatCurrency(corporate.creditLimit)
                    : "₹5,00,000"}
                </span>
              </div>
              <div>
                <span className="block text-purple-600">Payment Terms</span>
                <span className="font-semibold text-purple-900">
                  {corporate.paymentTerms || "30 Days"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Corporate Fields */}
        <div className="col-span-12 sm:col-span-6">
          <Input
            label="Contact Person *"
            name="corpContact"
            value={corporate.contactPerson}
            onChange={(e) => onChange("contactPerson", e.target.value)}
            error={errors["corporate.contactPerson"]}
          />
        </div>

        <div className="col-span-12 sm:col-span-6">
          <label
            htmlFor="corp-phone"
            className="text-brand-900 mb-1.5 block text-sm font-semibold"
          >
            Phone *
          </label>
          <div className="flex">
            <select
              aria-label="Country Code"
              value={corporate.phonePrefix || "+91"}
              onChange={(e) => onChange("phonePrefix", e.target.value)}
              className="text-brand-900 focus:border-primary-500 focus:ring-primary-500/15 h-10 w-20 rounded-lg rounded-r-none border border-r-0 border-gray-200 bg-white px-3 text-sm transition outline-none focus:ring-2"
            >
              <option value="+91">+91</option>
              <option value="+1">+1</option>
              <option value="+44">+44</option>
              <option value="+61">+61</option>
              <option value="+971">+971</option>
            </select>
            <input
              id="corp-phone"
              type="tel"
              value={corporate.phone}
              onChange={(e) => onChange("phone", e.target.value)}
              placeholder="98765 43210"
              className="text-brand-900 focus:border-primary-500 focus:ring-primary-500/15 h-10 flex-1 rounded-lg rounded-l-none border border-gray-200 bg-white px-3 text-sm transition outline-none focus:ring-2"
            />
          </div>
          {errors["corporate.phone"] && (
            <p className="mt-1.5 text-xs font-medium text-rose-500">
              {errors["corporate.phone"]}
            </p>
          )}
        </div>

        <div className="col-span-12 sm:col-span-6">
          <Input
            label="Email"
            type="email"
            name="corpEmail"
            value={corporate.email}
            onChange={(e) => onChange("email", e.target.value)}
            placeholder="billing@company.com"
          />
        </div>

        <div className="col-span-12 sm:col-span-6">
          <label
            htmlFor="corp-billing-type"
            className="text-brand-900 mb-1.5 block text-sm font-semibold"
          >
            Billing Type
          </label>
          <select
            id="corp-billing-type"
            value={corporate.billingType}
            onChange={(e) => onChange("billingType", e.target.value)}
            className="text-brand-900 focus:border-primary-500 focus:ring-primary-500/15 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm transition outline-none focus:ring-2"
          >
            <option value="Corporate Account">Corporate Account</option>
            <option value="Guest Pays Extras Only">
              Guest Pays Extras Only
            </option>
            <option value="Guest Pays All">Guest Pays All</option>
          </select>
        </div>

        <div className="col-span-12 sm:col-span-4">
          <Input
            label="GST Number"
            name="corpGst"
            value={corporate.gstNumber}
            onChange={(e) => onChange("gstNumber", e.target.value)}
            placeholder="22ABCDE1234F1Z5"
          />
        </div>

        <div className="col-span-12 sm:col-span-4">
          <label
            htmlFor="corp-payment-terms"
            className="text-brand-900 mb-1.5 block text-sm font-semibold"
          >
            Payment Terms
          </label>
          <select
            id="corp-payment-terms"
            value={corporate.paymentTerms}
            onChange={(e) => onChange("paymentTerms", e.target.value)}
            className="text-brand-900 focus:border-primary-500 focus:ring-primary-500/15 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm transition outline-none focus:ring-2"
          >
            <option value="CASH">CASH</option>
            <option value="7 DAYS">7 DAYS</option>
            <option value="15 DAYS">15 DAYS</option>
            <option value="30 DAYS">30 DAYS</option>
            <option value="45 DAYS">45 DAYS</option>
            <option value="60 DAYS">60 DAYS</option>
          </select>
        </div>

        <div className="col-span-12 sm:col-span-4">
          <Input
            label="Cost Center"
            name="corpCostCenter"
            value={corporate.costCenter}
            onChange={(e) => onChange("costCenter", e.target.value)}
            placeholder="IT Department"
          />
        </div>
      </div>
    </SectionCard>
  );
}
