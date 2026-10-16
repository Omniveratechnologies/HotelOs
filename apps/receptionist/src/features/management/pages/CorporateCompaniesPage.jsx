import React, { useState } from "react";
import {
  Header,
  KpiTile,
  KpiTileRow,
  Button,
  InlineBanner,
} from "@hotelos/ui/components";
import {
  Building2,
  Plus,
  Search,
  CreditCard,
  Phone,
  Mail,
  CheckCircle2,
  Trash2,
  Edit2,
} from "lucide-react";
import { formatCurrency } from "@hotelos/utils";
import { useQuery, useMutation, useQueryClient } from "@hotelos/query";
import { getCorporateCompanies, deleteCorporateCompany } from "@hotelos/api";

import CorporateCompanyModal from "../components/CorporateCompanyModal.jsx";

export default function CorporateCompaniesPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState("ALL");
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | null
  const [bannerMsg, setBannerMsg] = useState("");
  const [bannerVariant, setBannerVariant] = useState("success");

  const { data, isLoading } = useQuery({
    queryKey: [
      "corporate-companies",
      "list",
      { q: searchQuery, status: "ACTIVE" },
    ],
    queryFn: () => getCorporateCompanies({ q: searchQuery }),
  });

  const companies = data?.companies || [];

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteCorporateCompany(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["corporate-companies"] });
      setBannerVariant("success");
      setBannerMsg("Corporate company removed.");
      if (selectedCompany?._id === selectedCompany?._id)
        setSelectedCompany(null);
      setTimeout(() => setBannerMsg(""), 4000);
    },
    onError: (err) => {
      setBannerVariant("error");
      setBannerMsg(err?.message || "Failed to delete company");
    },
  });

  const filteredCompanies = companies.filter((c) => {
    if (tierFilter !== "ALL" && c.tier !== tierFilter) return false;
    return true;
  });

  const totalCreditLimit = companies.reduce(
    (acc, c) => acc + (c.creditLimit || 0),
    0,
  );

  return (
    <div className="bg-background-50/50 min-h-screen pb-24">
      <Header
        pageTitle="Corporate Companies Management"
        pageDescription="Manage business accounts, corporate rate contracts, billing credit limits, and guest rosters"
      >
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => {
            setSelectedCompany(null);
            setModalMode("create");
          }}
        >
          Add New Company
        </Button>
      </Header>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* KPI Row */}
        <KpiTileRow>
          <KpiTile
            label="Total Corporate Accounts"
            value={companies.length}
            icon={Building2}
            iconClassName="bg-brand-50 text-brand-700"
          />
          <KpiTile
            label="Active Contracts"
            value={companies.filter((c) => c.status === "ACTIVE").length}
            icon={CheckCircle2}
            iconClassName="bg-emerald-50 text-emerald-700"
          />
          <KpiTile
            label="Total Credit Extended"
            value={formatCurrency(totalCreditLimit)}
            icon={CreditCard}
            iconClassName="bg-blue-50 text-blue-700"
          />
          <KpiTile
            label="Tier Preferred (Gold/Platinum)"
            value={
              companies.filter((c) => ["Gold", "Platinum"].includes(c.tier))
                .length
            }
            icon={Building2}
            iconClassName="bg-purple-50 text-purple-700"
          />
        </KpiTileRow>

        {bannerMsg && (
          <InlineBanner variant={bannerVariant}>{bannerMsg}</InlineBanner>
        )}

        {/* Filter bar */}
        <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-xs sm:flex-row">
          <div className="relative w-full sm:w-80">
            <Search className="absolute top-2.5 left-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search companies, GST, contact..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="focus:border-brand-500 w-full rounded-lg border border-gray-200 py-2 pr-3 pl-9 text-sm focus:outline-none"
            />
          </div>

          <div className="flex w-full items-center gap-2 sm:w-auto">
            <span className="text-xs font-semibold text-gray-500">Tier:</span>
            {["ALL", "Standard", "Silver", "Gold", "Platinum"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTierFilter(t)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  tierFilter === t
                    ? "bg-brand-600 text-white shadow-xs"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Companies Table */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
          {isLoading ? (
            <div className="p-12 text-center text-sm text-gray-500">
              Loading companies...
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="p-16 text-center">
              <Building2 className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-3 text-sm font-bold text-gray-900">
                No corporate accounts found
              </h3>
              <p className="mx-auto mt-1 max-w-sm text-xs text-gray-500">
                {searchQuery
                  ? "No companies match your search. Try another query."
                  : "No corporate accounts have been created yet. Click below to add the first corporate company."}
              </p>
              <div className="mt-5">
                <Button
                  variant="primary"
                  size="sm"
                  icon={Plus}
                  onClick={() => {
                    setSelectedCompany(null);
                    setModalMode("create");
                  }}
                >
                  Register Corporate Company
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-gray-200 bg-gray-50 font-semibold tracking-wider text-gray-600 uppercase">
                  <tr>
                    <th className="px-5 py-3.5">Company & Code</th>
                    <th className="px-4 py-3.5">Primary Contact</th>
                    <th className="px-4 py-3.5">Billing & GST</th>
                    <th className="px-4 py-3.5">Credit Limit & Terms</th>
                    <th className="px-4 py-3.5">Tier</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCompanies.map((c) => (
                    <tr
                      key={c._id}
                      onClick={() => setSelectedCompany(c)}
                      className={`hover:bg-brand-50/40 cursor-pointer transition ${
                        selectedCompany?._id === c._id ? "bg-brand-50/60" : ""
                      }`}
                    >
                      <td className="px-5 py-4">
                        <div className="text-sm font-bold text-gray-900">
                          {c.name}
                        </div>
                        <div className="mt-0.5 font-mono text-[11px] text-gray-500">
                          {c.code || "NO CODE"}
                        </div>
                      </td>
                      <td className="space-y-0.5 px-4 py-4">
                        <div className="font-semibold text-gray-800">
                          {c.contactPerson}
                        </div>
                        <div className="flex items-center gap-1 text-gray-500">
                          <Phone className="h-3 w-3" /> {c.phone}
                        </div>
                        {c.email && (
                          <div className="flex items-center gap-1 text-[11px] text-gray-400">
                            <Mail className="h-3 w-3" /> {c.email}
                          </div>
                        )}
                      </td>
                      <td className="space-y-0.5 px-4 py-4">
                        <div className="font-medium text-gray-800">
                          {c.billingType}
                        </div>
                        <div className="font-mono text-[11px] text-gray-500">
                          GST: {c.gstNumber || "Unregistered"}
                        </div>
                      </td>
                      <td className="space-y-0.5 px-4 py-4">
                        <div className="font-bold text-emerald-700">
                          {formatCurrency(c.creditLimit || 0)}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          {c.paymentTerms}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                            c.tier === "Platinum"
                              ? "bg-purple-100 text-purple-800"
                              : c.tier === "Gold"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {c.tier}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            c.status === "ACTIVE"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div
                          className="flex items-center justify-end gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCompany(c);
                              setModalMode("edit");
                            }}
                            className="hover:text-brand-600 rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (
                                confirm(
                                  `Are you sure you want to delete ${c.name}?`,
                                )
                              ) {
                                deleteMutation.mutate(c._id);
                              }
                            }}
                            className="rounded-lg p-1.5 text-gray-500 hover:bg-rose-50 hover:text-rose-600"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Reusable Corporate Company Modal */}
      <CorporateCompanyModal
        isOpen={Boolean(modalMode)}
        onClose={() => setModalMode(null)}
        company={modalMode === "edit" ? selectedCompany : null}
        onSuccess={(saved) => {
          queryClient.invalidateQueries({ queryKey: ["corporate-companies"] });
          setBannerVariant("success");
          setBannerMsg(`Company "${saved.name}" saved successfully!`);
          setTimeout(() => setBannerMsg(""), 4000);
        }}
      />
    </div>
  );
}
