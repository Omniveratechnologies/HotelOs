import { useState } from "react";
import {
  Plus,
  Trash2,
  BedDouble,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@hotelos/ui/components";

const EMPTY_ARRAY = Object.freeze([]);

const getRoomTypeCode = (t) => t?.roomTypeCode || t?.roomCode || "";

/**
 * Reusable Room Requirements Matrix for Multi-Room Bookings across all reservation wizards:
 * Direct/New, Corporate, Phone, Website, Repeat Guest, and Group reservations.
 *
 * @param {Object} props
 * @param {Array} props.roomRequirements - Array of room block requirements.
 * @param {(reqs: Array) => void} props.onChange - Handler called with updated requirements array.
 * @param {Array} props.roomTypes - List of hotel room types.
 * @param {number} [props.targetRooms] - Optional target room count from stay details.
 * @param {string} [props.title] - Custom section heading.
 * @param {boolean} [props.compact] - Compact mode flag.
 */
export function RoomRequirementsMatrix({
  roomRequirements = EMPTY_ARRAY,
  onChange,
  roomTypes = EMPTY_ARRAY,
  targetRooms,
  title = "Room Type Matrix",
  compact = false,
}) {
  const [newReq, setNewReq] = useState({
    roomTypeCode: "",
    rooms: 1,
    adultsPerRoom: 2,
    childrenPerRoom: 0,
    notes: "",
  });

  const effectiveTypeCode =
    newReq.roomTypeCode || getRoomTypeCode(roomTypes[0]);

  const handleAddRequirement = () => {
    if (!effectiveTypeCode) return;
    const blockRooms = Math.max(1, Number(newReq.rooms) || 1);
    const blockAdults = Math.max(1, Number(newReq.adultsPerRoom) || 1);
    const blockChildren = Math.max(0, Number(newReq.childrenPerRoom) || 0);

    const addedBlock = {
      id: `req-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      roomTypeCode: effectiveTypeCode,
      rooms: blockRooms,
      adultsPerRoom: blockAdults,
      childrenPerRoom: blockChildren,
      notes: newReq.notes?.trim() || "",
    };

    onChange?.([...roomRequirements, addedBlock]);

    setNewReq({
      roomTypeCode: effectiveTypeCode,
      rooms: 1,
      adultsPerRoom: 2,
      childrenPerRoom: 0,
      notes: "",
    });
  };

  const handleRemoveRequirement = (idx) => {
    const next = [...roomRequirements];
    next.splice(idx, 1);
    onChange?.(next);
  };

  const totalRooms = roomRequirements.reduce(
    (acc, r) => acc + Number(r.rooms || 0),
    0,
  );
  const totalGuests = roomRequirements.reduce(
    (acc, r) => acc + Number(r.rooms || 0) * Number(r.adultsPerRoom || 1),
    0,
  );

  const isMatched =
    targetRooms != null && targetRooms > 0 && totalRooms === targetRooms;
  const isUnder =
    targetRooms != null && targetRooms > 0 && totalRooms < targetRooms;
  const isOver =
    targetRooms != null && targetRooms > 0 && totalRooms > targetRooms;

  return (
    <div className={`space-y-4 ${compact ? "text-xs" : ""}`}>
      {/* Header with counts and match status badge */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BedDouble className="text-brand-700 h-4 w-4" />
          <h4 className="text-sm font-bold text-gray-900">
            {title} ({totalRooms} room{totalRooms === 1 ? "" : "s"} for ~
            {totalGuests} guest{totalGuests === 1 ? "" : "s"})
          </h4>
        </div>

        {targetRooms != null && targetRooms > 0 && (
          <div>
            {isMatched && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" /> All {targetRooms} rooms
                allocated
              </span>
            )}
            {isUnder && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                <AlertCircle className="h-3.5 w-3.5" /> {totalRooms} of{" "}
                {targetRooms} rooms allocated ({targetRooms - totalRooms}{" "}
                remaining)
              </span>
            )}
            {isOver && (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
                <AlertCircle className="h-3.5 w-3.5" /> {totalRooms} rooms
                allocated (exceeds stay count of {targetRooms})
              </span>
            )}
          </div>
        )}
      </div>

      {/* Matrix Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200">
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
            {roomRequirements.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-6 text-center text-gray-400 italic"
                >
                  No room blocks added yet. Use the controls below to configure
                  required room types.
                </td>
              </tr>
            ) : (
              roomRequirements.map((r, idx) => {
                const typeObj = roomTypes.find(
                  (t) => getRoomTypeCode(t) === r.roomTypeCode,
                );
                return (
                  <tr
                    key={r.id || `req-${idx}`}
                    className="transition-colors hover:bg-gray-50/80"
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
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add Row Controls */}
      <div className="grid grid-cols-12 items-end gap-3 rounded-xl border border-gray-200 bg-gray-50/70 p-3 text-xs">
        <div className="col-span-12 sm:col-span-3">
          <label
            htmlFor="matrix-room-type-select"
            className="mb-1 block font-medium text-gray-700"
          >
            Room Type
          </label>
          <select
            id="matrix-room-type-select"
            value={effectiveTypeCode}
            onChange={(e) =>
              setNewReq({ ...newReq, roomTypeCode: e.target.value })
            }
            className="focus:border-brand-500 h-9 w-full rounded-lg border border-gray-200 bg-white px-2.5 text-xs text-gray-800 focus:outline-hidden"
          >
            {roomTypes.map((t) => {
              const code = getRoomTypeCode(t);
              return (
                <option key={code} value={code}>
                  {t.name || code}
                </option>
              );
            })}
          </select>
        </div>

        <div className="col-span-6 sm:col-span-2">
          <label
            htmlFor="matrix-rooms-input"
            className="mb-1 block font-medium text-gray-700"
          >
            Rooms
          </label>
          <input
            id="matrix-rooms-input"
            type="number"
            min="1"
            max="50"
            value={newReq.rooms}
            onChange={(e) =>
              setNewReq({
                ...newReq,
                rooms: Math.max(1, Number(e.target.value) || 1),
              })
            }
            className="h-9 w-full rounded-lg border border-gray-200 bg-white px-2.5 text-xs text-gray-800"
          />
        </div>

        <div className="col-span-6 sm:col-span-2">
          <label
            htmlFor="matrix-adults-input"
            className="mb-1 block font-medium text-gray-700"
          >
            Adults/Room
          </label>
          <input
            id="matrix-adults-input"
            type="number"
            min="1"
            max="10"
            value={newReq.adultsPerRoom}
            onChange={(e) =>
              setNewReq({
                ...newReq,
                adultsPerRoom: Math.max(1, Number(e.target.value) || 1),
              })
            }
            className="h-9 w-full rounded-lg border border-gray-200 bg-white px-2.5 text-xs text-gray-800"
          />
        </div>

        <div className="col-span-6 sm:col-span-2">
          <label
            htmlFor="matrix-children-input"
            className="mb-1 block font-medium text-gray-700"
          >
            Children/Room
          </label>
          <input
            id="matrix-children-input"
            type="number"
            min="0"
            max="6"
            value={newReq.childrenPerRoom}
            onChange={(e) =>
              setNewReq({
                ...newReq,
                childrenPerRoom: Math.max(0, Number(e.target.value) || 0),
              })
            }
            className="h-9 w-full rounded-lg border border-gray-200 bg-white px-2.5 text-xs text-gray-800"
          />
        </div>

        <div className="col-span-6 sm:col-span-3">
          <label
            htmlFor="matrix-notes-input"
            className="mb-1 block font-medium text-gray-700"
          >
            Special Notes
          </label>
          <input
            id="matrix-notes-input"
            type="text"
            placeholder="e.g. VIP, high floor, quiet"
            value={newReq.notes}
            onChange={(e) => setNewReq({ ...newReq, notes: e.target.value })}
            className="h-9 w-full rounded-lg border border-gray-200 bg-white px-2.5 text-xs text-gray-800"
          />
        </div>

        <div className="col-span-12 flex justify-end pt-1 sm:col-span-12">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddRequirement}
            className="text-brand-900 border-brand-200 hover:bg-brand-50 h-9 gap-1.5 px-4 font-semibold"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Room Block
          </Button>
        </div>
      </div>
    </div>
  );
}

export default RoomRequirementsMatrix;
