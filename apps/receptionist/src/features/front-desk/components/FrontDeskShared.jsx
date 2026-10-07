import React, { useState, useRef } from "react";
import {
  Search,
  CheckCircle2,
  AlertCircle,
  Upload,
  Crown,
  Pencil,
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
    { id: "all", label: "Expected" },
    { id: "express", label: "Express" },
    { id: "repeat", label: "Repeat" },
  ],
}) {
  const handleItemSelect = onSelectArrival || onSelect || (() => {});
  const [activeTab, setActiveTab] = useState("all");
  const [query, setQuery] = useState("");

  const filtered = arrivals.filter((a) => {
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
        <div className="mb-3 flex gap-1.5 border-b border-gray-100 pb-2 text-xs">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`rounded-lg px-2.5 py-1 font-medium transition ${
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
          const isSelected = selectedId === item.id;
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
          const isSelected = selectedId === item.id;
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

/**
 * Identity Verification Console (Screens 10, 11)
 */
export function IdVerificationConsole({
  idType = "Aadhaar",
  onIdTypeChange,
  idNumber = "",
  onIdNumberChange,
  frontImage = null,
  onFrontImageChange,
  backImage = null,
  onBackImageChange,
  isVerified = false,
  onToggleVerified,
}) {
  const frontInputRef = useRef(null);
  const backInputRef = useRef(null);

  const handleFrontUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () =>
      onFrontImageChange && onFrontImageChange(reader.result);
    reader.readAsDataURL(file);
  };

  const handleBackUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onBackImageChange && onBackImageChange(reader.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div>
          <h4 className="text-sm font-bold text-gray-900">
            Identity Verification
          </h4>
          <p className="text-xs text-gray-500">
            Government ID capture and matching
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

      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-12 sm:col-span-6">
          <label
            htmlFor="id-type-select"
            className="mb-1 block text-xs font-semibold text-gray-700"
          >
            ID Document Type
          </label>
          <select
            id="id-type-select"
            value={idType}
            onChange={(e) => onIdTypeChange && onIdTypeChange(e.target.value)}
            className="focus:border-brand-500 h-9 w-full rounded-lg border border-gray-200 bg-white px-2.5 text-xs text-gray-800 focus:outline-none"
          >
            <option value="Aadhaar">Aadhaar Card</option>
            <option value="Passport">Passport</option>
            <option value="Driving Licence">Driving Licence</option>
            <option value="PAN Card">PAN Card</option>
          </select>
        </div>

        <div className="col-span-12 sm:col-span-6">
          <Input
            label="ID Proof Number"
            placeholder="Enter ID number"
            value={idNumber}
            onChange={(e) =>
              onIdNumberChange && onIdNumberChange(e.target.value)
            }
          />
        </div>
      </div>

      <input
        type="file"
        ref={frontInputRef}
        accept="image/*"
        onChange={handleFrontUpload}
        className="hidden"
      />
      <input
        type="file"
        ref={backInputRef}
        accept="image/*"
        onChange={handleBackUpload}
        className="hidden"
      />

      {/* ID Thumbnail Preview Cards */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <div
          onClick={() => frontInputRef.current?.click()}
          className="hover:border-brand-500 cursor-pointer rounded-xl border border-gray-200 bg-gray-50/70 p-3 text-center transition"
        >
          {frontImage ? (
            <div className="mb-2 flex h-20 w-full items-center justify-center overflow-hidden rounded-lg border border-emerald-300 bg-white">
              <img
                src={frontImage}
                alt="ID Front"
                className="h-full w-full object-contain"
              />
            </div>
          ) : (
            <div className="mb-2 flex h-20 w-full flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-100 text-gray-400">
              <Upload className="mb-1 h-5 w-5" />
              <span className="text-[10px]">Click to upload</span>
            </div>
          )}
          <span className="block text-[11px] font-semibold text-gray-700">
            ID Front Side
          </span>
          <span
            className={`text-[10px] font-medium ${frontImage ? "text-emerald-600" : "text-gray-400"}`}
          >
            {frontImage ? "✓ Uploaded" : "Not uploaded"}
          </span>
        </div>

        <div
          onClick={() => backInputRef.current?.click()}
          className="hover:border-brand-500 cursor-pointer rounded-xl border border-gray-200 bg-gray-50/70 p-3 text-center transition"
        >
          {backImage ? (
            <div className="mb-2 flex h-20 w-full items-center justify-center overflow-hidden rounded-lg border border-emerald-300 bg-white">
              <img
                src={backImage}
                alt="ID Back"
                className="h-full w-full object-contain"
              />
            </div>
          ) : (
            <div className="mb-2 flex h-20 w-full flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-100 text-gray-400">
              <Upload className="mb-1 h-5 w-5" />
              <span className="text-[10px]">Click to upload</span>
            </div>
          )}
          <span className="block text-[11px] font-semibold text-gray-700">
            ID Back Side
          </span>
          <span
            className={`text-[10px] font-medium ${backImage ? "text-emerald-600" : "text-gray-400"}`}
          >
            {backImage ? "✓ Uploaded" : "Not uploaded"}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Clean Room Assignment list (Screen 10)
 */
export function CleanRoomSelector({
  rooms = [],
  selectedRoomId,
  onSelectRoom,
}) {
  return (
    <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div>
          <h4 className="text-sm font-bold text-gray-900">Assign Clean Room</h4>
          <p className="text-xs text-gray-500">
            Only Clean & Inspected vacant rooms
          </p>
        </div>
        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
          {rooms.length} Clean Available
        </span>
      </div>

      <div className="max-h-[220px] space-y-2 overflow-y-auto pr-1">
        {rooms.map((rm) => {
          const isSelected = selectedRoomId === rm.id;
          return (
            <div
              key={rm.id}
              onClick={() => onSelectRoom(rm.id)}
              className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition ${
                isSelected
                  ? "border-blue-500 bg-blue-50/70 ring-1 ring-blue-500"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="clean-room"
                  checked={isSelected}
                  onChange={() => onSelectRoom(rm.id)}
                  className="text-brand-900 h-4 w-4"
                />
                <div>
                  <span className="block text-sm font-bold text-gray-900">
                    Room {rm.roomNumber}
                  </span>
                  <span className="text-[11px] text-gray-500">
                    Floor {rm.floor} · {rm.view || "City View"}
                  </span>
                </div>
              </div>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                Clean & Ready
              </span>
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

/**
 * Guest Profile & Reservation Summary Card (Screen 10)
 */
export function GuestDetailsCard({ guest, onEditClick }) {
  if (!guest) return null;

  const displayVal = (val, fallback = "Not specified") =>
    !val || val === "—" || val === "null" ? fallback : val;

  return (
    <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
      <div className="flex flex-col justify-between gap-3 border-b border-gray-100 pb-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="bg-brand-100 text-brand-800 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold">
            {(guest.name && guest.name !== "—"
              ? guest.name.slice(0, 2)
              : "GU"
            ).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-gray-900">
                {displayVal(guest.name, "Unassigned Guest")}
              </h3>
              {guest.isVip && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                  <Crown className="h-3 w-3" /> VIP
                </span>
              )}
              {guest.isRepeat && (
                <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-800">
                  Repeat Guest
                </span>
              )}
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-700">
                {guest.source || "DIRECT"}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-gray-500">
              Booking{" "}
              {guest.bookingNo && guest.bookingNo !== "—"
                ? `#${guest.bookingNo}`
                : "pending"}{" "}
              · {guest.roomType || "Room unassigned"}
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={Pencil}
          onClick={onEditClick}
          className="gap-1.5 self-start text-xs sm:self-auto"
        >
          Edit Details
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 text-xs sm:grid-cols-4">
        <div>
          <span className="block text-[11px] text-gray-400">Phone</span>
          <span className="mt-0.5 block truncate font-medium text-gray-900">
            {displayVal(guest.phone, "Not specified")}
          </span>
        </div>
        <div>
          <span className="block text-[11px] text-gray-400">Email</span>
          <span className="mt-0.5 block truncate font-medium text-gray-900">
            {displayVal(guest.email, "Not specified")}
          </span>
        </div>
        <div>
          <span className="block text-[11px] text-gray-400">Nationality</span>
          <span className="mt-0.5 block font-medium text-gray-900">
            {displayVal(guest.nationality, "Not specified")}
          </span>
        </div>
        <div>
          <span className="block text-[11px] text-gray-400">Stay Dates</span>
          <span className="mt-0.5 block font-medium text-gray-900">
            {guest.checkIn && guest.checkOut
              ? `${guest.checkIn} → ${guest.checkOut} (${guest.nights || 1}n)`
              : "Dates not set"}
          </span>
        </div>
      </div>

      {guest.address && guest.address !== "—" && (
        <div className="flex items-center gap-1.5 border-t border-gray-50 pt-2 text-xs text-gray-600">
          <span className="shrink-0 text-gray-400">Address:</span>
          <span className="truncate">{guest.address}</span>
        </div>
      )}
      {guest.specialRequests && guest.specialRequests !== "—" && (
        <div className="rounded-lg border border-amber-100 bg-amber-50/70 p-2.5 text-xs text-amber-900">
          <strong>Special Request:</strong> {guest.specialRequests}
        </div>
      )}
    </div>
  );
}
