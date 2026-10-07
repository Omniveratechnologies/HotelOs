import React, { useState } from "react";
import { Plus, Trash2, Users, Download, Upload } from "lucide-react";
import { SectionCard, Button, Input } from "@hotelos/ui/components";

export default function CorporateGuestListTable({
  guests = [],
  onAddGuest,
  onRemoveGuest,
}) {
  const [activeTab, setActiveTab] = useState("manual");
  const [newGuest, setNewGuest] = useState({
    name: "",
    designation: "",
    phone: "",
    email: "",
    idType: "Aadhaar",
    idNumber: "",
  });

  const handleAdd = () => {
    if (!newGuest.name.trim()) return;
    onAddGuest({
      id: `cg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      ...newGuest,
    });
    setNewGuest({
      name: "",
      designation: "",
      phone: "",
      email: "",
      idType: "Aadhaar",
      idNumber: "",
    });
  };

  return (
    <SectionCard
      title="Corporate Guests"
      subtitle="Manage employees and travelers under this corporate booking"
      icon={Users}
      action={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Simulated template download
              const csvContent =
                "data:text/csv;charset=utf-8,Name,Designation,Phone,Email,ID Type,ID Number\n";
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement("a");
              link.setAttribute("href", encodedUri);
              link.setAttribute("download", "corporate_guest_template.csv");
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="gap-1.5"
          >
            <Download className="h-4 w-4" />
            Template
          </Button>
        </div>
      }
    >
      {/* Mode Tabs */}
      <div className="mb-4 flex gap-2 border-b border-gray-200 pb-3 text-sm font-medium">
        <button
          type="button"
          onClick={() => setActiveTab("manual")}
          className={`rounded-lg px-3 py-1.5 transition ${
            activeTab === "manual"
              ? "bg-brand-900 font-semibold text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Add Guest
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("import")}
          className={`rounded-lg px-3 py-1.5 transition ${
            activeTab === "import"
              ? "bg-brand-900 font-semibold text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Import from Excel
        </button>
      </div>

      {activeTab === "import" ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-8 text-center">
          <Upload className="mx-auto mb-2 h-8 w-8 text-gray-400" />
          <p className="text-sm font-semibold text-gray-900">
            Upload CSV / Excel spreadsheet
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Download template above, populate employee details and drop here.
          </p>
          <label className="mt-4 inline-block cursor-pointer">
            <span className="text-brand-900 rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-semibold shadow-xs hover:bg-gray-50">
              Browse Files
            </span>
            <input
              type="file"
              accept=".csv,.xlsx"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  // Prepopulate sample import for demonstration
                  onAddGuest({
                    id: `cg-${Date.now()}-1`,
                    name: "Rahul Verma",
                    designation: "Tech Lead",
                    phone: "+91 9876543211",
                    email: "rahul@company.com",
                    idType: "Aadhaar",
                    idNumber: "1234 5678 9012",
                  });
                  setActiveTab("manual");
                }
              }}
            />
          </label>
        </div>
      ) : (
        /* Quick Add Form */
        <div className="mb-4 rounded-xl border border-gray-200/80 bg-gray-50 p-4">
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-12 sm:col-span-4">
              <Input
                label="Full Name"
                placeholder="e.g. Ramesh Kumar"
                value={newGuest.name}
                onChange={(e) =>
                  setNewGuest({ ...newGuest, name: e.target.value })
                }
              />
            </div>
            <div className="col-span-12 sm:col-span-4">
              <Input
                label="Designation"
                placeholder="e.g. Sr. Analyst"
                value={newGuest.designation}
                onChange={(e) =>
                  setNewGuest({ ...newGuest, designation: e.target.value })
                }
              />
            </div>
            <div className="col-span-12 sm:col-span-4">
              <Input
                label="Phone"
                placeholder="e.g. 98765 43210"
                value={newGuest.phone}
                onChange={(e) =>
                  setNewGuest({ ...newGuest, phone: e.target.value })
                }
              />
            </div>
            <div className="col-span-12 sm:col-span-4">
              <Input
                label="Email"
                type="email"
                placeholder="guest@company.com"
                value={newGuest.email}
                onChange={(e) =>
                  setNewGuest({ ...newGuest, email: e.target.value })
                }
              />
            </div>
            <div className="col-span-6 sm:col-span-3">
              <label
                htmlFor="cg-id-type"
                className="text-brand-900 mb-1.5 block text-sm font-semibold"
              >
                ID Type
              </label>
              <select
                id="cg-id-type"
                value={newGuest.idType}
                onChange={(e) =>
                  setNewGuest({ ...newGuest, idType: e.target.value })
                }
                className="text-brand-900 focus:border-primary-500 focus:ring-primary-500/15 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm transition outline-none focus:ring-2"
              >
                <option value="Aadhaar">Aadhaar</option>
                <option value="Passport">Passport</option>
                <option value="Driving Licence">Driving Licence</option>
                <option value="PAN Card">PAN Card</option>
              </select>
            </div>
            <div className="col-span-6 sm:col-span-3">
              <Input
                label="ID Number"
                placeholder="XXXX XXXX XXXX"
                value={newGuest.idNumber}
                onChange={(e) =>
                  setNewGuest({ ...newGuest, idNumber: e.target.value })
                }
              />
            </div>
            <div className="col-span-12 flex items-end sm:col-span-2">
              <Button
                variant="primary"
                onClick={handleAdd}
                disabled={!newGuest.name.trim()}
                className="h-10 w-full gap-1.5"
              >
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Guest Table */}
      {guests.length === 0 ? (
        <div className="py-6 text-center text-sm text-gray-500">
          No guests added yet. Use the form above to add travelers for this
          booking.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-200 bg-gray-50 font-semibold tracking-wider text-gray-600 uppercase">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Guest Name</th>
                <th className="px-4 py-3">Designation</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">ID Proof</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {guests.map((g, idx) => (
                <tr
                  key={g.id || `corp-guest-${g.name}-${idx}`}
                  className="hover:bg-gray-50/80"
                >
                  <td className="px-4 py-3 font-medium text-gray-500">
                    {idx + 1}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    {g.name}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {g.designation || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <div>{g.phone || "—"}</div>
                    <div className="text-[11px] text-gray-400">{g.email}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <span className="font-medium text-gray-800">
                      {g.idType}:
                    </span>{" "}
                    {g.idNumber || "Pending"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => onRemoveGuest(idx)}
                      className="p-1 text-gray-400 transition hover:text-rose-600"
                      title="Remove guest"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}
