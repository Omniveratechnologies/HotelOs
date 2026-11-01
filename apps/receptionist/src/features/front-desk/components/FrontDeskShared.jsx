import React, { useState, useRef } from "react";
import {
  Search,
  CheckCircle2,
  AlertCircle,
  Upload,
  Crown,
  Pencil,
  Plus,
  Trash2,
  FileText,
  Calendar,
  Users,
  CreditCard,
  BedDouble,
} from "lucide-react";
import { Button, Input } from "@hotelos/ui/components";
import { formatCurrency } from "@hotelos/utils";

/**
 * Common Today's Arrivals Queue component (Screens 10, 11)
 */
export function ArrivalsQueue({
  arrivals = [],
  selectedId,
  onSelectArrival,
  onSelect,
  tabs = [
    { id: "all", label: "All Expected" },
    { id: "guaranteed", label: "Guaranteed" },
    { id: "deposit-due", label: "Deposit Due" },
    { id: "express", label: "Express" },
    { id: "repeat", label: "Repeat" },
  ],
}) {
  const handleItemSelect = onSelectArrival || onSelect || (() => {});
  const [activeTab, setActiveTab] = useState("all");
  const [query, setQuery] = useState("");

  const filtered = arrivals.filter((a) => {
    if (activeTab === "guaranteed" && a.status !== "confirmed") return false;
    if (
      activeTab === "deposit-due" &&
      a.status !== "reserved" &&
      a.paymentStatus === "paid"
    )
      return false;
    if (activeTab === "express" && !a.isExpress) return false;
    if (activeTab === "repeat" && a.source !== "REPEAT_GUEST" && !a.isRepeat)
      return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      return (
        (a.name && a.name.toLowerCase().includes(q)) ||
        (a.bookingNo && String(a.bookingNo).toLowerCase().includes(q)) ||
        (a.room && String(a.room).toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="flex max-h-[calc(100vh-8.5rem)] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
      <div className="shrink-0 border-b border-gray-100 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">Today's Arrivals</h3>
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
            {arrivals.length} Total
          </span>
        </div>

        {/* Filter Tabs */}
        <div className="mb-3 flex flex-wrap gap-1 border-b border-gray-100 pb-2 text-[11px]">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`rounded-lg px-2 py-1 font-medium transition ${
                activeTab === t.id
                  ? "bg-brand-900 font-semibold text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute top-2.5 left-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search arrival name, booking #..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="focus:border-brand-900 h-9 w-full rounded-lg border border-gray-200 bg-gray-50/50 pr-3 pl-9 text-xs text-gray-900 focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* Arrival List */}
      <div className="min-h-0 flex-1 divide-y divide-gray-100 overflow-y-auto">
        {filtered.map((item) => {
          const isSelected =
            selectedId != null && String(selectedId) === String(item.id);
          const isProvisional = item.status === "reserved";
          const isUnpaid = item.paymentStatus === "unpaid";

          return (
            <div
              key={item.id}
              onClick={() => handleItemSelect(item)}
              className={`cursor-pointer p-3.5 transition ${
                isSelected
                  ? "border-l-brand-900 border-l-4 bg-blue-50/80"
                  : "hover:bg-gray-50"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
                    {item.name}
                    {item.isVip && (
                      <span className="py-0.2 inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 text-[9px] font-bold text-amber-800">
                        <Crown className="h-2.5 w-2.5" /> VIP
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-xs text-gray-500">
                    #{item.bookingNo} · {item.time || "2:00 PM"}
                  </div>

                  {/* Status Pills */}
                  <div className="mt-1.5 flex flex-wrap items-center gap-1">
                    {isProvisional ? (
                      <span className="rounded-md border border-amber-200/60 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                        Hold
                      </span>
                    ) : (
                      <span className="rounded-md border border-emerald-200/60 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                        Confirmed
                      </span>
                    )}

                    {isUnpaid ? (
                      <span className="rounded-md border border-rose-200/60 bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700">
                        Deposit Due
                      </span>
                    ) : (
                      <span className="rounded-md border border-blue-200/60 bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                        Prepaid
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-700">
                    {item.source}
                  </span>
                  <div className="text-brand-900 mt-1 text-[11px] font-semibold">
                    {item.roomType || "Standard"}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Common Today's Departure Queue component (Screen 15)
 */
export function DepartureQueue({
  departures = [],
  selectedId,
  onSelectDeparture,
}) {
  const [activeTab, setActiveTab] = useState("due");
  const [query, setQuery] = useState("");

  const filtered = departures.filter((d) => {
    if (activeTab === "overstay" && !d.isOverstay) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      return (
        (d.name && d.name.toLowerCase().includes(q)) ||
        (d.room && String(d.room).toLowerCase().includes(q)) ||
        (d.bookingNo && String(d.bookingNo).toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="flex max-h-[calc(100vh-8.5rem)] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
      <div className="shrink-0 border-b border-gray-100 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">Departure Queue</h3>
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">
            {departures.length} Due
          </span>
        </div>

        <div className="mb-3 flex gap-1.5 border-b border-gray-100 pb-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("due")}
            className={`rounded-lg px-2.5 py-1 font-medium transition ${
              activeTab === "due"
                ? "bg-brand-900 font-semibold text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Due Today ({departures.filter((d) => !d.isOverstay).length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("overstay")}
            className={`rounded-lg px-2.5 py-1 font-medium transition ${
              activeTab === "overstay"
                ? "bg-rose-600 font-semibold text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Overstay ({departures.filter((d) => d.isOverstay).length})
          </button>
        </div>

        <div className="relative">
          <Search className="absolute top-2.5 left-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search room no, guest name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="focus:border-brand-900 h-9 w-full rounded-lg border border-gray-200 bg-gray-50/50 pr-3 pl-9 text-xs text-gray-900 focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* Departure List */}
      <div className="min-h-0 flex-1 divide-y divide-gray-100 overflow-y-auto">
        {filtered.map((item) => {
          const isSelected =
            selectedId != null && String(selectedId) === String(item.id);
          return (
            <div
              key={item.id}
              onClick={() => onSelectDeparture(item)}
              className={`cursor-pointer p-3.5 transition ${
                isSelected
                  ? "border-l-brand-900 border-l-4 bg-blue-50/80"
                  : "hover:bg-gray-50"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-bold text-gray-900">
                    {item.name}
                  </div>
                  <div className="text-brand-900 mt-0.5 text-xs font-semibold">
                    Room {item.room} · {item.roomType}
                  </div>
                  <div className="mt-0.5 text-[11px] text-gray-400">
                    Check-out: {item.checkoutTime || "11:00 AM"}
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      item.isOverstay
                        ? "bg-rose-100 text-rose-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {item.isOverstay ? "Overstay" : "Due Today"}
                  </span>
                  <div className="mt-1.5 text-xs font-bold text-gray-900">
                    {formatCurrency(item.totalCharges || 0)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const EMPTY_DOCS = [];

/**
 * Identity Verification Console (Screens 10, 11) - Multi-document support
 */
export function IdVerificationConsole({
  documents = EMPTY_DOCS,
  onDocumentsChange,
  isVerified = false,
  onToggleVerified,
  maxDocuments = 5,
  guestCount = 1,
}) {
  const docs =
    documents && documents.length > 0
      ? documents
      : [
          {
            idType: "Aadhaar",
            idNumber: "",
            frontImage: null,
            backImage: null,
          },
        ];

  const canAddMore = docs.length < maxDocuments;

  const handleDocChange = (index, field, value) => {
    if (!onDocumentsChange) return;
    const updated = docs.map((d, i) =>
      i === index ? { ...d, [field]: value } : d,
    );
    onDocumentsChange(updated);
  };

  const handleAddDocument = () => {
    if (!canAddMore || !onDocumentsChange) return;
    onDocumentsChange([
      ...docs,
      { idType: "Aadhaar", idNumber: "", frontImage: null, backImage: null },
    ]);
  };

  const handleRemoveDocument = (index) => {
    if (docs.length <= 1 || !onDocumentsChange) return;
    onDocumentsChange(docs.filter((_, i) => i !== index));
  };

  const triggerUpload = (docIndex, side) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,application/pdf";
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        handleDocChange(docIndex, side, reader.result);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  return (
    <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-gray-900">
              Identity Verification
            </h4>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-800">
              {docs.length} of max {maxDocuments} doc
              {maxDocuments > 1 ? "s" : ""}
            </span>
          </div>
          <p className="text-xs text-gray-500">
            Government KYC documents for {guestCount} guest
            {guestCount > 1 ? "s" : ""}. Front side is required, all back sides
            are optional.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onToggleVerified && onToggleVerified(!isVerified)}
          className={`inline-flex cursor-pointer items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold transition ${
            isVerified
              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
              : "bg-amber-100 text-amber-800 hover:bg-amber-200"
          }`}
        >
          {isVerified ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" /> ID Verified
            </>
          ) : (
            <>
              <AlertCircle className="h-3.5 w-3.5" /> Verification Pending
            </>
          )}
        </button>
      </div>

      {/* Document Cards List */}
      <div className="space-y-4">
        {docs.map((doc, index) => (
          <div
            key={
              doc.idNumber
                ? `${doc.idType}_${doc.idNumber}_${index}`
                : `doc_${index}`
            }
            className="rounded-xl border border-gray-200 bg-gray-50/40 p-4 transition"
          >
            <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-2.5">
              <div className="flex items-center gap-2">
                <FileText className="text-brand-600 h-4 w-4" />
                <span className="text-xs font-bold text-gray-900">
                  Document #{index + 1}
                </span>
                {index === 0 && (
                  <span className="bg-brand-50 text-brand-700 rounded-md px-2 py-0.5 text-[10px] font-semibold">
                    Primary Guest
                  </span>
                )}
              </div>
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => handleRemoveDocument(index)}
                  className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-semibold text-rose-500 hover:text-rose-700"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </button>
              )}
            </div>

            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-12 sm:col-span-6">
                <label
                  htmlFor={`id-type-${index}`}
                  className="mb-1 block text-xs font-semibold text-gray-700"
                >
                  ID Document Type
                </label>
                <select
                  id={`id-type-${index}`}
                  value={doc.idType || "Aadhaar"}
                  onChange={(e) =>
                    handleDocChange(index, "idType", e.target.value)
                  }
                  className="focus:border-brand-500 h-9 w-full rounded-lg border border-gray-200 bg-white px-2.5 text-xs text-gray-800 focus:outline-none"
                >
                  <option value="Aadhaar">Aadhaar Card</option>
                  <option value="Passport">Passport</option>
                  <option value="Driving Licence">Driving Licence</option>
                  <option value="PAN Card">PAN Card</option>
                  <option value="Voter ID">Voter ID</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="col-span-12 sm:col-span-6">
                <Input
                  label="ID Proof Number *"
                  placeholder="Enter ID number"
                  value={doc.idNumber || ""}
                  onChange={(e) =>
                    handleDocChange(index, "idNumber", e.target.value)
                  }
                />
              </div>
            </div>

            {/* Upload Zone Previews: Front (Required) & Back (Optional) */}
            <div className="grid grid-cols-2 gap-3 pt-3">
              {/* Front Side */}
              <div className="rounded-xl border border-gray-200 bg-white p-3 text-center transition">
                <div
                  onClick={() => triggerUpload(index, "frontImage")}
                  className="hover:border-brand-500 cursor-pointer"
                >
                  {doc.frontImage ? (
                    <div className="relative mb-2 flex h-24 w-full items-center justify-center overflow-hidden rounded-lg border border-emerald-300 bg-gray-50">
                      <img
                        src={doc.frontImage}
                        alt={`ID Front #${index + 1}`}
                        className="h-full w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="mb-2 flex h-24 w-full flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-gray-400">
                      <Upload className="mb-1 h-5 w-5" />
                      <span className="text-[10px]">Click to upload front</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="block text-left text-[11px] font-semibold text-gray-800">
                      Front Side *
                    </span>
                    <span
                      className={`block text-left text-[10px] font-medium ${doc.frontImage ? "text-emerald-600" : "text-gray-400"}`}
                    >
                      {doc.frontImage ? "✓ Uploaded" : "Required"}
                    </span>
                  </div>
                  {doc.frontImage && (
                    <button
                      type="button"
                      onClick={() => handleDocChange(index, "frontImage", null)}
                      className="cursor-pointer text-[10px] text-rose-500 hover:text-rose-700"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Back Side */}
              <div className="rounded-xl border border-gray-200 bg-white p-3 text-center transition">
                <div
                  onClick={() => triggerUpload(index, "backImage")}
                  className="hover:border-brand-500 cursor-pointer"
                >
                  {doc.backImage ? (
                    <div className="relative mb-2 flex h-24 w-full items-center justify-center overflow-hidden rounded-lg border border-emerald-300 bg-gray-50">
                      <img
                        src={doc.backImage}
                        alt={`ID Back #${index + 1}`}
                        className="h-full w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="mb-2 flex h-24 w-full flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-gray-400">
                      <Upload className="mb-1 h-5 w-5" />
                      <span className="text-[10px]">
                        Click to upload back (Optional)
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="block text-left text-[11px] font-semibold text-gray-800">
                      Back Side (Optional)
                    </span>
                    <span
                      className={`block text-left text-[10px] font-medium ${doc.backImage ? "text-emerald-600" : "text-gray-400"}`}
                    >
                      {doc.backImage ? "✓ Uploaded" : "Optional"}
                    </span>
                  </div>
                  {doc.backImage && (
                    <button
                      type="button"
                      onClick={() => handleDocChange(index, "backImage", null)}
                      className="cursor-pointer text-[10px] text-rose-500 hover:text-rose-700"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Add Another Document Button */}
        {canAddMore ? (
          <button
            type="button"
            onClick={handleAddDocument}
            className="hover:border-brand-500 hover:bg-brand-50 hover:text-brand-700 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-dashed border-gray-300 bg-gray-50 py-3 text-xs font-semibold text-gray-700 transition"
          >
            <Plus className="h-4 w-4" /> Add Another Document ({docs.length} of
            max {maxDocuments})
          </button>
        ) : (
          <p className="text-center text-xs text-gray-400">
            Maximum {maxDocuments} documents reached for this reservation.
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Clean Room Assignment list (Screen 10)
 */
export function CleanRoomSelector({
  typeBlocks = EMPTY_BLOCKS,
  selectedRoomIds = EMPTY_ROOM_IDS,
  onToggleRoom,
  targetRoomsCount = 1,
  rooms = EMPTY_ROOMS,
  selectedRoomId,
  onSelectRoom,
}) {
  const activeIds = (
    Array.isArray(selectedRoomIds) && selectedRoomIds.length > 0
      ? selectedRoomIds
      : selectedRoomId
        ? [selectedRoomId]
        : []
  ).map(String);

  // If typeBlocks not explicitly provided, synthesize from flat rooms list
  const effectiveBlocks =
    typeBlocks && typeBlocks.length > 0
      ? typeBlocks
      : [
          {
            id: "default-block",
            roomTypeCode: "all",
            roomTypeName: "Clean Room",
            requiredCount: targetRoomsCount || 1,
            availableRooms: rooms,
          },
        ];

  const totalRequired =
    typeBlocks && typeBlocks.length > 0
      ? typeBlocks.reduce((acc, b) => acc + (b.requiredCount || 1), 0)
      : targetRoomsCount || 1;

  const totalSelected = activeIds.length;
  const isAllFulfilled = totalSelected === totalRequired;
  const isMatrix = effectiveBlocks.length > 1;

  return (
    <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
      <div className="flex flex-col gap-2 border-b border-gray-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-gray-900">
              {isMatrix
                ? "Assign Matrix Rooms"
                : totalRequired > 1
                  ? "Assign Clean Rooms"
                  : "Assign Clean Room"}
            </h4>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                isAllFulfilled
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {totalSelected} of {totalRequired} Selected
            </span>
          </div>
          <p className="mt-0.5 text-xs text-gray-500">
            {isMatrix
              ? `Select required clean rooms strictly matching the ${effectiveBlocks.length} booked room types in the reservation matrix`
              : totalRequired > 1
                ? `Select ${totalRequired} clean rooms strictly matching the booked room type`
                : "Only clean & inspected vacant rooms matching the booked room type"}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {effectiveBlocks.map((block) => {
          const blockAvailable = block.availableRooms || [];
          const blockSelectedCount = blockAvailable.filter((rm) =>
            activeIds.includes(String(rm.id)),
          ).length;
          const isBlockFulfilled = blockSelectedCount === block.requiredCount;

          return (
            <div
              key={block.id || block.roomTypeCode}
              className="rounded-xl border border-gray-200 bg-gray-50/50 p-4"
            >
              <div className="mb-3 flex items-center justify-between border-b border-gray-200/60 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold tracking-wider text-gray-900 uppercase">
                    {block.roomTypeName || block.roomTypeCode}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      isBlockFulfilled
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {blockSelectedCount} of {block.requiredCount} Selected
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {blockAvailable.length} clean available
                </span>
              </div>

              <div className="max-h-[220px] space-y-2 overflow-y-auto pr-1">
                {blockAvailable.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-200 bg-white py-5 text-center text-xs text-gray-400">
                    No clean {block.roomTypeName || block.roomTypeCode} rooms
                    currently available.
                  </div>
                ) : (
                  blockAvailable.map((rm) => {
                    const rmId = String(rm.id);
                    const isSelected = activeIds.includes(rmId);
                    return (
                      <div
                        key={rm.id}
                        onClick={() => {
                          if (onToggleRoom) {
                            onToggleRoom(rmId, block.id);
                          } else if (onSelectRoom) {
                            onSelectRoom(rmId);
                          }
                        }}
                        className={`flex cursor-pointer items-center justify-between rounded-xl border bg-white p-3 transition ${
                          isSelected
                            ? "border-blue-500 bg-blue-50/70 ring-1 ring-blue-500"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              if (onToggleRoom) {
                                onToggleRoom(rmId, block.id);
                              } else if (onSelectRoom) {
                                onSelectRoom(rmId);
                              }
                            }}
                            className="text-brand-900 h-4 w-4 rounded accent-blue-600"
                          />
                          <div>
                            <span className="block text-sm font-bold text-gray-900">
                              Room {rm.roomNumber}
                            </span>
                            <span className="text-[11px] text-gray-500">
                              Floor {rm.floor} ·{" "}
                              {rm.view || rm.type || "Standard"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {rm.isPreAssigned && (
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                              Pre-assigned
                            </span>
                          )}
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                            Clean & Ready
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Charges & Security Deposit Card (Screen 10)
 */
export function ChargesDepositCard({
  roomCharges,
  taxCharges,
  extraCharges = 0,
  guest,
  depositAmount = "0",
  onDepositChange,
  paymentMode = "CASH",
  onPaymentModeChange,
}) {
  const calculatedRoomCharges =
    roomCharges !== undefined
      ? Number(roomCharges)
      : Number(guest?.roomRate || guest?.baseRate || guest?.totalAmount || 0);
  const calculatedTax =
    taxCharges !== undefined
      ? Number(taxCharges)
      : Number(guest?.taxAmount || guest?.tax || 0);
  const totalAmount = Number(
    guest?.totalAmount ||
      calculatedRoomCharges + calculatedTax + Number(extraCharges || 0),
  );
  const nights = Number(guest?.nights || 1);

  return (
    <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
      <div className="border-b border-gray-100 pb-3">
        <h4 className="text-sm font-bold text-gray-900">
          Charges & Security Deposit
        </h4>
        <p className="text-xs text-gray-500">
          Stay billing calculation and upfront deposit
        </p>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex justify-between text-gray-600">
          <span>
            Room Tariff ({nights} {nights === 1 ? "Night" : "Nights"})
          </span>
          <span className="font-semibold text-gray-900">
            {formatCurrency(calculatedRoomCharges)}
          </span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Taxes & GST</span>
          <span className="font-semibold text-gray-900">
            {formatCurrency(calculatedTax)}
          </span>
        </div>
        {Number(extraCharges) > 0 && (
          <div className="flex justify-between text-gray-600">
            <span>Extra Bed / Services</span>
            <span className="font-semibold text-gray-900">
              {formatCurrency(extraCharges)}
            </span>
          </div>
        )}
        <div className="flex justify-between rounded-lg border-t border-amber-200 bg-amber-50/70 p-2 pt-2 text-sm font-bold text-amber-950">
          <span>Total Stay Bill</span>
          <span>{formatCurrency(totalAmount)}</span>
        </div>
      </div>

      <div className="pt-2">
        <div className="mb-1 flex items-center justify-between">
          <label
            htmlFor="deposit-amount-input"
            className="text-xs font-semibold text-gray-700"
          >
            Security Deposit (To Collect)
          </label>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
            To be collected
          </span>
        </div>
        <Input
          id="deposit-amount-input"
          placeholder="0"
          value={depositAmount}
          onChange={(e) => onDepositChange && onDepositChange(e.target.value)}
        />
      </div>

      <div className="pt-1">
        <label className="mb-1.5 block text-[11px] font-semibold text-gray-700">
          Deposit Collection Method
        </label>
        <div className="grid grid-cols-3 gap-2">
          {["CASH", "CARD", "UPI"].map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onPaymentModeChange && onPaymentModeChange(mode)}
              className={`rounded-lg border py-1.5 text-xs font-semibold transition ${
                (paymentMode || "CASH") === mode
                  ? "bg-brand-900 border-brand-900 text-white shadow-2xs"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Signature Pad / Image Upload Box (Screen 10)
 */
export function SignatureCaptureBox({
  signatureImage = null,
  onSignatureChange,
  guestName = "",
}) {
  const fileInputRef = useRef(null);

  const handleSignatureUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onSignatureChange && onSignatureChange(reader.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between">
        <div>
          <span className="block text-xs font-bold tracking-wider text-gray-900 uppercase">
            Guest Signature
          </span>
          <p className="text-[11px] text-gray-500">
            Upload signature image file (PNG, JPG) or scan
          </p>
        </div>
        {signatureImage && (
          <button
            type="button"
            onClick={() => {
              if (onSignatureChange) onSignatureChange(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
            className="text-xs font-medium text-rose-600 hover:text-rose-700 hover:underline"
          >
            Remove Signature
          </button>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleSignatureUpload}
        className="hidden"
      />

      {signatureImage ? (
        <div className="relative flex min-h-[100px] flex-col items-center justify-center rounded-xl border border-dashed border-emerald-300 bg-emerald-50/30 p-4">
          <img
            src={signatureImage}
            alt="Guest Signature"
            className="max-h-24 max-w-full object-contain"
          />
          <span className="mt-2 text-[11px] font-medium text-emerald-700">
            ✓ Signature attached {guestName ? `for ${guestName}` : ""}
          </span>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="hover:border-brand-500 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50/70 p-6 text-center transition hover:bg-gray-50"
        >
          <Upload className="mb-1 h-6 w-6 text-gray-400" />
          <span className="text-xs font-semibold text-gray-700">
            Click to upload signature image
          </span>
          <span className="mt-0.5 text-[10px] text-gray-400">
            PNG, JPG, WEBP up to 5MB
          </span>
        </div>
      )}
    </div>
  );
}

const EMPTY_BLOCKS = Object.freeze([]);
const EMPTY_ROOM_IDS = Object.freeze([]);
const EMPTY_ROOMS = Object.freeze([]);

function displayOverviewVal(val, fallback = "Not specified") {
  return !val || val === "—" || val === "null" || val === "undefined"
    ? fallback
    : val;
}

/**
 * Comprehensive Reservation & Guest Overview Card (Check-in top section)
 */
export function ReservationOverviewCard({ arrival, guest, onEditClick }) {
  const data = arrival || guest;
  if (!data) return null;

  const paymentStatus = (data.paymentStatus || "unpaid").toLowerCase();
  const paymentBadgeClass =
    paymentStatus === "paid"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : paymentStatus === "partially-paid"
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-rose-50 text-rose-700 border-rose-200";

  const nights = Number(data.nights) || 1;
  const adults = Number(data.adults) || 1;
  const children = Number(data.children) || 0;
  const totalGuests = Number(data.guests) || adults + children;
  const roomsCount = Number(data.roomsCount || data.rooms || 1);

  const roomRequirements = Array.isArray(data.roomRequirements)
    ? data.roomRequirements
    : [];

  return (
    <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
      {/* 1. Header: Avatar, Name, Badges, Reservation # & Edit Action */}
      <div className="flex flex-col justify-between gap-3 border-b border-gray-100 pb-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="bg-brand-900 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-base font-bold text-white shadow-xs">
            {(data.name && data.name !== "—"
              ? data.name.slice(0, 2)
              : "GU"
            ).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-gray-900">
                {displayOverviewVal(data.name, "Valued Guest")}
              </h3>
              {data.isVip && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                  <Crown className="h-3 w-3" /> VIP
                </span>
              )}
              {data.isRepeat && (
                <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-800">
                  Repeat Guest
                </span>
              )}
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-700 uppercase">
                {data.source || "DIRECT"}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                  data.status === "confirmed"
                    ? "bg-emerald-100 text-emerald-800"
                    : data.status === "reserved"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-gray-100 text-gray-800"
                }`}
              >
                {data.status || "CONFIRMED"}
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Reservation{" "}
              <strong className="text-brand-900 font-semibold">
                {data.bookingNo ? `#${data.bookingNo}` : "Pending"}
              </strong>{" "}
              · {roomsCount} Room{roomsCount > 1 ? "s" : ""} Booked
            </p>
          </div>
        </div>

        {onEditClick && (
          <Button
            variant="outline"
            size="sm"
            icon={Pencil}
            onClick={onEditClick}
            className="gap-1.5 self-start text-xs sm:self-auto"
          >
            Edit Reservation
          </Button>
        )}
      </div>

      {/* 2. Key Stay & Booking Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Stay Duration */}
        <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500">
            <Calendar className="h-3.5 w-3.5 text-gray-400" />
            Stay Duration
          </div>
          <span className="mt-1 block text-xs font-bold text-gray-900">
            {data.checkIn && data.checkOut
              ? `${data.checkIn} → ${data.checkOut}`
              : "Pending dates"}
          </span>
          <span className="text-[11px] font-medium text-gray-500">
            {nights} Night{nights === 1 ? "" : "s"}{" "}
            {data.time ? `· Check-in ${data.time}` : ""}
          </span>
        </div>

        {/* Occupancy */}
        <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500">
            <Users className="h-3.5 w-3.5 text-gray-400" />
            Total Occupancy
          </div>
          <span className="mt-1 block text-xs font-bold text-gray-900">
            {totalGuests} Guest{totalGuests === 1 ? "" : "s"}
          </span>
          <span className="text-[11px] font-medium text-gray-500">
            {adults} Adult{adults === 1 ? "" : "s"}
            {children > 0
              ? `, ${children} Child${children === 1 ? "" : "ren"}`
              : ""}
          </span>
        </div>

        {/* Room Matrix Breakdown */}
        <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500">
            <BedDouble className="h-3.5 w-3.5 text-gray-400" />
            Room Matrix
          </div>
          {roomRequirements.length > 0 ? (
            <div className="mt-1 flex flex-wrap gap-1">
              {roomRequirements.map((r, i) => (
                <span
                  key={`${r.roomTypeCode || "req"}-${i}`}
                  className="inline-block rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-800 uppercase"
                >
                  {r.rooms}x {r.roomTypeCode}
                </span>
              ))}
            </div>
          ) : (
            <span className="mt-1 block text-xs font-bold text-gray-900 uppercase">
              {data.roomType || data.roomTypeCode || "Standard Room"}
            </span>
          )}
          <span className="mt-0.5 block text-[11px] font-medium text-gray-500">
            Total {roomsCount} Room{roomsCount > 1 ? "s" : ""}
          </span>
        </div>

        {/* Billing & Tariff */}
        <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3">
          <div className="flex items-center justify-between text-[11px] font-semibold text-gray-500">
            <span className="flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5 text-gray-400" />
              Tariff & Billing
            </span>
            <span
              className={`py-0.2 rounded-full border px-1.5 text-[9px] font-bold tracking-wider uppercase ${paymentBadgeClass}`}
            >
              {paymentStatus}
            </span>
          </div>
          <span className="text-brand-900 mt-1 block text-xs font-bold">
            {formatCurrency(data.totalAmount || 0)}
          </span>
          <span className="truncate text-[11px] font-medium text-gray-500">
            {data.ratePlan || "Standard"}{" "}
            {data.mealPlan ? `(${data.mealPlan})` : ""}
          </span>
        </div>
      </div>

      {/* 3. Guest Profile & Contact Details */}
      <div className="grid grid-cols-2 gap-3 border-t border-gray-100 pt-3 text-xs sm:grid-cols-4">
        <div>
          <span className="text-[11px] text-gray-400">Phone</span>
          <span className="mt-0.5 block truncate font-medium text-gray-900">
            {displayOverviewVal(data.phone, "Not specified")}
          </span>
        </div>
        <div>
          <span className="text-[11px] text-gray-400">Email</span>
          <span className="mt-0.5 block truncate font-medium text-gray-900">
            {displayOverviewVal(data.email, "Not specified")}
          </span>
        </div>
        <div>
          <span className="text-[11px] text-gray-400">Nationality</span>
          <span className="mt-0.5 block font-medium text-gray-900">
            {displayOverviewVal(data.nationality, "Not specified")}
          </span>
        </div>
        <div>
          <span className="text-[11px] text-gray-400">ID Info</span>
          <span className="mt-0.5 block truncate font-medium text-gray-900">
            {data.idType || "Aadhaar"}:{" "}
            {displayOverviewVal(data.idNumber, "Pending")}
          </span>
        </div>
      </div>

      {/* Address if present */}
      {data.address && data.address !== "—" && (
        <div className="flex items-center gap-1.5 text-xs text-gray-600">
          <span className="shrink-0 text-gray-400">Address:</span>
          <span className="truncate">{data.address}</span>
        </div>
      )}

      {/* Special Requests Banner */}
      {data.specialRequests && data.specialRequests !== "—" && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div>
            <strong className="font-semibold">
              Special Request / Guest Preferences:
            </strong>
            <p className="mt-0.5 text-amber-800">{data.specialRequests}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export const GuestDetailsCard = ReservationOverviewCard;
