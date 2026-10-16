import React, { useState } from "react";
import { Users, BedDouble, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { SectionCard, Button, Input } from "@hotelos/ui/components";
import { formatCurrency } from "@hotelos/utils";

/**
 * Step 1: Group Details
 */
export function GroupDetailsSection({ form, onChange, errors = {} }) {
  return (
    <SectionCard
      title="Group Information"
      subtitle="Organizer contact details and event metadata"
      icon={Users}
    >
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 sm:col-span-6">
          <Input
            label="Group Name *"
            name="groupName"
            placeholder="e.g. Infosys Annual Conference 2026"
            value={form.groupName || ""}
            onChange={(e) => onChange("groupName", e.target.value)}
            error={errors.groupName}
          />
        </div>

        <div className="col-span-12 sm:col-span-6">
          <label
            htmlFor="group-type-select"
            className="text-brand-900 mb-1.5 block text-sm font-semibold"
          >
            Group Type *
          </label>
          <select
            id="group-type-select"
            value={form.groupType || "Corporate"}
            onChange={(e) => onChange("groupType", e.target.value)}
            className="text-brand-900 focus:border-primary-500 focus:ring-primary-500/15 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm transition outline-none focus:ring-2"
          >
            <option value="Corporate">Corporate Conference / Offsite</option>
            <option value="Tour / Travel">Tour / Travel Group</option>
            <option value="Wedding">Wedding Party</option>
            <option value="Sports / Delegations">Sports / Delegation</option>
            <option value="Family Gathering">Family Gathering</option>
          </select>
        </div>

        <div className="col-span-12 sm:col-span-6">
          <Input
            label="Organizer Name *"
            name="organizerName"
            placeholder="e.g. Sunita Rao"
            value={form.organizerName || ""}
            onChange={(e) => onChange("organizerName", e.target.value)}
            error={errors.organizerName}
          />
        </div>

        <div className="col-span-12 sm:col-span-6">
          <label
            htmlFor="organizer-phone"
            className="text-brand-900 mb-1.5 block text-sm font-semibold"
          >
            Organizer Phone *
          </label>
          <div className="flex">
            <span className="flex items-center rounded-l-lg border border-r-0 border-gray-200 bg-gray-50 px-3 text-sm text-gray-500">
              +91
            </span>
            <input
              id="organizer-phone"
              type="tel"
              placeholder="98765 43210"
              value={form.organizerPhone || ""}
              onChange={(e) => onChange("organizerPhone", e.target.value)}
              className="text-brand-900 focus:border-primary-500 focus:ring-primary-500/15 h-10 flex-1 rounded-r-lg border border-gray-200 bg-white px-3 text-sm transition outline-none focus:ring-2"
            />
          </div>
          {errors.organizerPhone && (
            <p className="mt-1.5 text-xs font-medium text-rose-500">
              {errors.organizerPhone}
            </p>
          )}
        </div>

        <div className="col-span-12 sm:col-span-6">
          <Input
            label="Organizer Email"
            type="email"
            name="organizerEmail"
            placeholder="organizer@organization.com"
            value={form.organizerEmail || ""}
            onChange={(e) => onChange("organizerEmail", e.target.value)}
          />
        </div>

        <div className="col-span-12 sm:col-span-6">
          <Input
            label="Company / Organization"
            name="companyName"
            placeholder="e.g. Infosys Ltd"
            value={form.companyName || ""}
            onChange={(e) => onChange("companyName", e.target.value)}
          />
        </div>

        <div className="col-span-12 sm:col-span-6">
          <Input
            label="Event / Purpose"
            name="eventPurpose"
            placeholder="e.g. Annual Leadership Summit"
            value={form.eventPurpose || ""}
            onChange={(e) => onChange("eventPurpose", e.target.value)}
          />
        </div>

        <div className="col-span-12 sm:col-span-6">
          <label
            htmlFor="group-source-select"
            className="text-brand-900 mb-1.5 block text-sm font-semibold"
          >
            Inquiry Source
          </label>
          <select
            id="group-source-select"
            value={form.source || "GROUP"}
            onChange={(e) => onChange("source", e.target.value)}
            className="text-brand-900 focus:border-primary-500 focus:ring-primary-500/15 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm transition outline-none focus:ring-2"
          >
            <option value="GROUP">Direct Group Inquiry</option>
            <option value="CORPORATE">Corporate Sales Representative</option>
            <option value="TRAVEL_AGENT">Travel Agent / Partner</option>
            <option value="EVENT_PLANNER">Event Planner</option>
          </select>
        </div>

        <div className="col-span-12">
          <label
            htmlFor="group-special-requests"
            className="text-brand-900 mb-1.5 block text-sm font-semibold"
          >
            Special Group Requests & Instructions
          </label>
          <textarea
            id="group-special-requests"
            rows={2}
            placeholder="e.g. Rooms on same floor, welcome drink on arrival, early check-in for keynote speakers"
            value={form.specialRequests || ""}
            onChange={(e) => onChange("specialRequests", e.target.value)}
            className="text-brand-900 focus:border-primary-500 focus:ring-primary-500/15 w-full rounded-lg border border-gray-200 bg-white p-3 text-sm transition outline-none placeholder:text-gray-400 focus:ring-2"
          />
        </div>
      </div>
    </SectionCard>
  );
}

/**
 * Step 2: Stay & Room Requirements Matrix
 */
export function GroupRequirementsSection({
  form,
  onChange,
  roomRequirements = [],
  onRequirementsChange,
  roomTypes = [],
}) {
  const [newReq, setNewReq] = useState({
    roomTypeCode: roomTypes[0]?.roomCode || "EXEC",
    rooms: 1,
    adultsPerRoom: 2,
    childrenPerRoom: 0,
    notes: "",
  });

  const handleAddRequirement = () => {
    onRequirementsChange([
      ...roomRequirements,
      {
        id: `gr-${Date.now()}`,
        ...newReq,
      },
    ]);
  };

  const handleRemoveRequirement = (idx) => {
    const next = [...roomRequirements];
    next.splice(idx, 1);
    onRequirementsChange(next);
  };

  const totalRooms = roomRequirements.reduce(
    (acc, r) => acc + Number(r.rooms || 0),
    0,
  );
  const totalGuests = roomRequirements.reduce(
    (acc, r) => acc + Number(r.rooms || 0) * Number(r.adultsPerRoom || 1),
    0,
  );

  return (
    <SectionCard
      title="Stay & Room Requirements"
      subtitle="Define date range, required room types and block capacities"
      icon={BedDouble}
    >
      <div className="space-y-6">
        {/* Date Row */}
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 sm:col-span-6">
            <Input
              label="Check-in Date *"
              type="date"
              value={form.checkIn}
              onChange={(e) => onChange("checkIn", e.target.value)}
            />
          </div>
          <div className="col-span-12 sm:col-span-6">
            <Input
              label="Check-out Date *"
              type="date"
              value={form.checkOut}
              onChange={(e) => onChange("checkOut", e.target.value)}
            />
          </div>
        </div>

        {/* Room Requirement Matrix Table */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-bold text-gray-900">
              Room Type Matrix ({totalRooms} rooms for ~{totalGuests} guests)
            </h4>
          </div>

          <div className="mb-4 overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-gray-200 bg-gray-50 font-semibold tracking-wider text-gray-600 uppercase">
                <tr>
                  <th className="px-4 py-3">Room Type</th>
                  <th className="px-4 py-3">No. of Rooms</th>
                  <th className="px-4 py-3">Adults/Room</th>
                  <th className="px-4 py-3">Children</th>
                  <th className="px-4 py-3">Notes</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {roomRequirements.map((r, idx) => {
                  const typeObj = roomTypes.find(
                    (t) => t.roomCode === r.roomTypeCode,
                  );
                  return (
                    <tr
                      key={r.id || `req-${idx}`}
                      className="hover:bg-gray-50/80"
                    >
                      <td className="px-4 py-3 font-semibold text-gray-900">
                        {typeObj?.name || r.roomTypeCode}
                      </td>
                      <td className="text-brand-900 px-4 py-3 font-bold">
                        {r.rooms}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {r.adultsPerRoom}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {r.childrenPerRoom || 0}
                      </td>
                      <td className="px-4 py-3 text-gray-500 italic">
                        {r.notes || "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveRequirement(idx)}
                          className="p-1 text-gray-400 transition hover:text-rose-600"
                          title="Remove block"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Add Row Controls */}
          <div className="grid grid-cols-12 items-end gap-3 rounded-xl border border-gray-200 bg-gray-50/70 p-3 text-xs">
            <div className="col-span-12 sm:col-span-3">
              <label
                htmlFor="req-room-type-select"
                className="mb-1 block font-medium text-gray-700"
              >
                Room Type
              </label>
              <select
                id="req-room-type-select"
                value={newReq.roomTypeCode}
                onChange={(e) =>
                  setNewReq({ ...newReq, roomTypeCode: e.target.value })
                }
                className="h-9 w-full rounded-lg border border-gray-200 bg-white px-2.5 text-xs text-gray-800"
              >
                {roomTypes.map((t) => (
                  <option key={t.roomCode} value={t.roomCode}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-4 sm:col-span-2">
              <label
                htmlFor="req-rooms-input"
                className="mb-1 block font-medium text-gray-700"
              >
                Rooms
              </label>
              <input
                id="req-rooms-input"
                type="number"
                min="1"
                value={newReq.rooms}
                onChange={(e) =>
                  setNewReq({ ...newReq, rooms: Number(e.target.value) || 1 })
                }
                className="h-9 w-full rounded-lg border border-gray-200 bg-white px-2.5 text-xs"
              />
            </div>
            <div className="col-span-4 sm:col-span-2">
              <label
                htmlFor="req-adults-input"
                className="mb-1 block font-medium text-gray-700"
              >
                Adults/Room
              </label>
              <input
                id="req-adults-input"
                type="number"
                min="1"
                value={newReq.adultsPerRoom}
                onChange={(e) =>
                  setNewReq({
                    ...newReq,
                    adultsPerRoom: Number(e.target.value) || 1,
                  })
                }
                className="h-9 w-full rounded-lg border border-gray-200 bg-white px-2.5 text-xs"
              />
            </div>
            <div className="col-span-12 sm:col-span-3">
              <label
                htmlFor="req-notes-input"
                className="mb-1 block font-medium text-gray-700"
              >
                Special Notes
              </label>
              <input
                id="req-notes-input"
                type="text"
                placeholder="e.g. VIP speaker suite"
                value={newReq.notes}
                onChange={(e) =>
                  setNewReq({ ...newReq, notes: e.target.value })
                }
                className="h-9 w-full rounded-lg border border-gray-200 bg-white px-2.5 text-xs"
              />
            </div>
            <div className="col-span-12 sm:col-span-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddRequirement}
                className="h-9 w-full gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Block
              </Button>
            </div>
          </div>
        </div>

        {/* Rate Plan & Discount info */}
        <div className="grid grid-cols-12 gap-4 border-t border-gray-100 pt-3">
          <div className="col-span-12 sm:col-span-6">
            <label
              htmlFor="group-rate-plan-select"
              className="text-brand-900 mb-1.5 block text-sm font-semibold"
            >
              Group Rate Plan
            </label>
            <select
              id="group-rate-plan-select"
              value={form.ratePlanName || "Group Corporate Rate"}
              onChange={(e) => onChange("ratePlanName", e.target.value)}
              className="text-brand-900 focus:border-primary-500 focus:ring-primary-500/15 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm transition outline-none focus:ring-2"
            >
              <option value="Group Corporate Rate">
                Group Corporate Rate (Negotiated)
              </option>
              <option value="Best Available Rate">Best Available Rate</option>
              <option value="Conference Package AP">
                Conference Full Board (AP)
              </option>
              <option value="Wedding Block CP">
                Wedding Continental Plan (CP)
              </option>
            </select>
          </div>

          <div className="col-span-12 sm:col-span-6">
            <Input
              label="Group Discount (% applied before tax)"
              type="number"
              name="discount"
              placeholder="5"
              value={form.discount || "5"}
              onChange={(e) => onChange("discount", e.target.value)}
            />
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

/**
 * Step 3 & 4: Guest List and Room Assignment Preview
 */
export function GroupGuestListSection({
  guests = [],
  onAddGuest,
  onRemoveGuest,
  onAutoAssign,
}) {
  const [newGuest, setNewGuest] = useState({
    name: "",
    designation: "",
    phone: "",
    email: "",
    roomType: "Executive",
    assignedRoom: "",
  });

  const handleAdd = () => {
    if (!newGuest.name.trim()) return;
    onAddGuest({
      id: `gg-${Date.now()}`,
      ...newGuest,
      idStatus: "Verified",
    });
    setNewGuest({
      name: "",
      designation: "",
      phone: "",
      email: "",
      roomType: "Executive",
      assignedRoom: "",
    });
  };

  return (
    <SectionCard
      title="Group Guest Roster"
      subtitle="Guest participants, identification status and room assignment"
      icon={Users}
      action={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onAutoAssign}
            className="text-brand-900 border-brand-200 bg-brand-50 hover:bg-brand-100 gap-1.5"
          >
            <CheckCircle2 className="text-brand-700 h-4 w-4" />
            Auto Assign Rooms
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Quick Add Line */}
        <div className="grid grid-cols-12 items-end gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3.5 text-xs">
          <div className="col-span-12 sm:col-span-3">
            <Input
              label="Guest Name"
              placeholder="e.g. Anand Mahindra"
              value={newGuest.name}
              onChange={(e) =>
                setNewGuest({ ...newGuest, name: e.target.value })
              }
            />
          </div>
          <div className="col-span-12 sm:col-span-3">
            <Input
              label="Designation / Role"
              placeholder="e.g. Delegate"
              value={newGuest.designation}
              onChange={(e) =>
                setNewGuest({ ...newGuest, designation: e.target.value })
              }
            />
          </div>
          <div className="col-span-12 sm:col-span-3">
            <Input
              label="Phone"
              placeholder="e.g. 98765 43210"
              value={newGuest.phone}
              onChange={(e) =>
                setNewGuest({ ...newGuest, phone: e.target.value })
              }
            />
          </div>
          <div className="col-span-12 flex gap-2 sm:col-span-3">
            <Button
              variant="primary"
              size="sm"
              onClick={handleAdd}
              disabled={!newGuest.name.trim()}
              className="h-10 w-full gap-1"
            >
              <Plus className="h-4 w-4" />
              Add to List
            </Button>
          </div>
        </div>

        {/* Table of Guests */}
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-200 bg-gray-50 font-semibold tracking-wider text-gray-600 uppercase">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Guest Name</th>
                <th className="px-4 py-3">Designation</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Room Type</th>
                <th className="px-4 py-3">Assigned Room</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {guests.map((g, idx) => (
                <tr
                  key={g.id || `group-guest-${idx}`}
                  className="hover:bg-gray-50/80"
                >
                  <td className="px-4 py-3 font-medium text-gray-400">
                    {idx + 1}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    {g.name}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {g.designation || "Delegate"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{g.phone || "—"}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {g.roomType || "Executive"}
                  </td>
                  <td className="text-brand-900 px-4 py-3 font-semibold">
                    {g.assignedRoom ? `Room ${g.assignedRoom}` : "Pending"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                      {g.idStatus || "Verified"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => onRemoveGuest(idx)}
                      className="p-1 text-gray-400 transition hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </SectionCard>
  );
}

/**
 * Right Column: Group Allocation & Financial Summary
 */
export function GroupAllocationSummary({
  form,
  roomRequirements = [],
  nights = 1,
}) {
  const totalRooms = roomRequirements.reduce(
    (acc, r) => acc + Number(r.rooms || 0),
    0,
  );
  const totalGuests = roomRequirements.reduce(
    (acc, r) => acc + Number(r.rooms || 0) * Number(r.adultsPerRoom || 1),
    0,
  );

  // Fallback estimates if backend quote is loading
  const baseRateEstimate = totalRooms * 2499 * nights;
  const discountRate = Number(form.discount || 5) / 100;
  const discountAmount = Math.round(baseRateEstimate * discountRate);
  const taxable = baseRateEstimate - discountAmount;
  const taxAmount = Math.round(taxable * 0.12);
  const totalAmount = taxable + taxAmount;

  return (
    <div className="space-y-6">
      {/* Group Summary Card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
        <h4 className="text-brand-900 mb-3 text-xs font-bold tracking-wider uppercase">
          Group Booking Summary
        </h4>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">Group Name</span>
            <span className="font-semibold text-gray-900">
              {form.groupName || "Untitled Group"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Organizer</span>
            <span className="font-medium text-gray-900">
              {form.organizerName || "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Total Rooms</span>
            <span className="text-brand-900 font-semibold">
              {totalRooms} Rooms
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Total Guests</span>
            <span className="font-medium text-gray-900">
              {totalGuests} Guests
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Duration</span>
            <span className="font-medium text-gray-900">{nights} Night(s)</span>
          </div>
        </div>
      </div>

      {/* Room Allocation Matrix breakdown */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
        <h4 className="mb-3 text-xs font-bold tracking-wider text-gray-600 uppercase">
          Room Allocation
        </h4>
        <div className="space-y-2.5 text-xs">
          {roomRequirements.map((r, i) => (
            <div
              key={r.id || `alloc-${i}`}
              className="flex items-center justify-between border-b border-gray-100 py-1 last:border-0"
            >
              <span className="font-medium text-gray-800">
                {r.roomTypeCode}
              </span>
              <span className="text-gray-600">
                {r.rooms} room(s) · {r.rooms * r.adultsPerRoom} guests
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Financial Summary */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-xs">
        <h4 className="mb-3 text-xs font-bold tracking-wider text-amber-900 uppercase">
          Financial Summary
        </h4>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-amber-800">
              Room Charges ({nights} Nights)
            </span>
            <span className="font-medium text-amber-950">
              {formatCurrency(baseRateEstimate)}
            </span>
          </div>
          <div className="flex justify-between text-rose-600">
            <span>Group Discount ({form.discount || 5}%)</span>
            <span>- {formatCurrency(discountAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-amber-800">Taxes (GST 12%)</span>
            <span className="font-medium text-amber-950">
              {formatCurrency(taxAmount)}
            </span>
          </div>
          <div className="flex justify-between border-t border-amber-200 pt-2 text-sm font-bold text-amber-950">
            <span>Grand Total</span>
            <span>{formatCurrency(totalAmount)}</span>
          </div>
        </div>

        <div className="mt-4 space-y-1 border-t border-amber-200 pt-3 text-xs text-amber-800">
          <div>
            <strong>Billing Mode:</strong> Master Folio (Company Pays)
          </div>
          <div>
            <strong>Advance Deposit:</strong> ₹20,000 (Adjusted in bill)
          </div>
          <div>
            <strong>Terms:</strong> 30 Days from Check-out
          </div>
        </div>
      </div>
    </div>
  );
}
