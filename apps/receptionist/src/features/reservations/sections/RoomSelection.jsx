import { ToggleRow } from "@hotelos/ui/components";

/**
 * Room selection — Auto Assign by default; "Prefer specific room" reveals a
 * select limited to rooms of the chosen type free for the selected range.
 *
 * @param {Object} props
 * @param {boolean} props.preferSpecific - Toggle state.
 * @param {(checked: boolean) => void} props.onToggle
 * @param {{ id: string, roomNumber: string, floor?: number }[]} props.rooms - Available rooms.
 * @param {string} [props.value] - Selected room id.
 * @param {(id: string) => void} props.onChange
 * @param {boolean} [props.roomsLoading]
 * @param {boolean} [props.disabled] - No room type / dates selected yet.
 * @returns {React.ReactElement}
 */
export function RoomSelection({
  preferSpecific,
  onToggle,
  rooms,
  value,
  onChange,
  roomsLoading = false,
  disabled = false,
}) {
  return (
    <div className="border-surface-200 rounded-lg border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-brand-900 text-sm font-semibold">
          Select Specific Room (Optional)
        </span>
        <ToggleRow
          label="Prefer specific room"
          checked={preferSpecific}
          onChange={onToggle}
          disabled={disabled}
        />
      </div>
      <div className="mt-3">
        {preferSpecific ? (
          <select
            aria-label="Room number"
            value={value || ""}
            disabled={disabled || roomsLoading}
            onChange={(e) => onChange(e.target.value)}
            className="text-brand-900 focus:border-primary-500 focus:ring-primary-500/15 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm transition outline-none focus:ring-2 disabled:bg-gray-50 disabled:text-gray-500"
          >
            <option value="">
              {roomsLoading ? "Loading rooms…" : "Select a room…"}
            </option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                Room {r.roomNumber}
                {r.floor != null ? ` · Floor ${r.floor}` : ""}
              </option>
            ))}
          </select>
        ) : (
          <input
            aria-label="Room assignment"
            value="Auto Assign (System will assign)"
            disabled
            readOnly
            className="text-surface-500 h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm"
          />
        )}
      </div>
    </div>
  );
}

export default RoomSelection;
