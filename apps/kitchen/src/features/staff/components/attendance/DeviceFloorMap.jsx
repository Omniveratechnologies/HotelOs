import { useRef, useState } from "react";
import { FiEdit2, FiMapPin, FiSave, FiX } from "react-icons/fi";

import { STATUS_COLORS } from "../../utils/deviceFormat.js";

const W = 100;
const H = 62.5;

const Plan = ({ imageUrl }) =>
  imageUrl ? (
    <image
      href={imageUrl}
      x="0"
      y="0"
      width={W}
      height={H}
      preserveAspectRatio="xMidYMid slice"
      opacity="0.9"
    />
  ) : (
    <g fill="none" stroke="#2a2a2a" strokeWidth="0.3">
      <rect x="3" y="3" width="94" height="56.5" rx="1.5" />
      <path d="M3 22 H62 M62 3 V40 M62 40 H97 M30 22 V59.5 M62 40 V59.5 M80 40 V59.5" />
      <g fill="#3a3a3a" stroke="none" fontSize="1.5">
        <text x="6" y="8">
          Main Lobby
        </text>
        <text x="66" y="8">
          Restaurant
        </text>
        <text x="6" y="27">
          Offices
        </text>
        <text x="33" y="27">
          Kitchen
        </text>
        <text x="65" y="45">
          Housekeeping
        </text>
        <text x="83" y="45">
          Security
        </text>
      </g>
    </g>
  );

const DeviceFloorMap = ({
  devices = [],
  imageUrl,
  onSelect,
  onSavePins,
  saving = false,
}) => {
  const svgRef = useRef(null);
  const drag = useRef(null);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({});
  const [picked, setPicked] = useState(null);

  const pinOf = (device) =>
    device._id in draft
      ? draft[device._id]
      : device.mapX === null
        ? null
        : { mapX: device.mapX, mapY: device.mapY };
  const placed = devices.filter((device) => pinOf(device));
  const waiting = devices.filter((device) => !pinOf(device));
  const dirty = Object.keys(draft).length > 0;

  const toPercent = (event) => {
    const rect = svgRef.current.getBoundingClientRect();
    const clamp = (value) => Math.min(100, Math.max(0, value));
    return {
      mapX:
        Math.round(
          clamp(((event.clientX - rect.left) / rect.width) * 100) * 10,
        ) / 10,
      mapY:
        Math.round(
          clamp(((event.clientY - rect.top) / rect.height) * 100) * 10,
        ) / 10,
    };
  };

  const startEdit = () => {
    setDraft({});
    setPicked(null);
    setEditing(true);
  };
  const stopEdit = () => {
    setDraft({});
    setPicked(null);
    setEditing(false);
  };

  const save = async () => {
    const changes = Object.entries(draft).map(([id, pin]) => ({
      id,
      mapX: pin ? pin.mapX : null,
      mapY: pin ? pin.mapY : null,
    }));
    if (changes.length === 0) return stopEdit();
    const ok = await onSavePins?.(changes);
    if (ok !== false) stopEdit();
  };

  const onPlanClick = (event) => {
    if (!editing || !picked || event.target.closest?.("[data-pin]")) return;
    setDraft((previous) => ({ ...previous, [picked]: toPercent(event) }));
    setPicked(null);
  };

  const onPinDown = (event, device) => {
    if (!editing) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    drag.current = { id: device._id, moved: false };
    setPicked(null);
  };

  const onPinMove = (event) => {
    if (!drag.current) return;
    drag.current.moved = true;
    const { id } = drag.current;
    setDraft((previous) => ({ ...previous, [id]: toPercent(event) }));
  };

  const onPinUp = (event, device) => {
    const wasDrag = drag.current?.moved;
    drag.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    if (!editing && !wasDrag) onSelect?.(device);
  };

  return (
    <section
      aria-label="Device locations"
      className="rounded-xl border border-gray-800 bg-[#111111] p-4"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-white">Device Locations</h2>

        {editing ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={stopEdit}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-800"
            >
              <FiX size={13} /> Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              <FiSave size={13} /> {saving ? "Saving..." : "Save layout"}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={startEdit}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-800"
          >
            <FiEdit2 size={13} /> Edit pins
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-800 bg-[#0c0c0c]">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label="Floor plan with device pins"
          onClick={onPlanClick}
          className={`block aspect-[16/10] w-full touch-none select-none ${editing && picked ? "cursor-crosshair" : ""}`}
        >
          <Plan imageUrl={imageUrl} />

          {placed.map((device) => {
            const pin = pinOf(device);
            const x = (pin.mapX / 100) * W;
            const y = (pin.mapY / 100) * H;
            const color = STATUS_COLORS[device.status] || "#6b7280";

            return (
              <g
                key={device._id}
                data-pin={device.deviceCode}
                transform={`translate(${x} ${y})`}
                onPointerDown={(event) => onPinDown(event, device)}
                onPointerMove={onPinMove}
                onPointerUp={(event) => onPinUp(event, device)}
                tabIndex={0}
                role="button"
                aria-label={`${device.name}, ${device.status.toLowerCase()}`}
                onKeyDown={(event) =>
                  (event.key === "Enter" || event.key === " ") &&
                  !editing &&
                  onSelect?.(device)
                }
                className={editing ? "cursor-grab" : "cursor-pointer"}
              >
                {device.status === "ONLINE" && (
                  <circle r="1.5" fill={color} opacity="0.25" />
                )}
                <circle
                  r="0.9"
                  fill={color}
                  stroke="#0c0c0c"
                  strokeWidth="0.3"
                />
                <title>{`${device.name} (${device.deviceCode})`}</title>
                <text
                  y="-1.7"
                  textAnchor="middle"
                  fontSize="1.3"
                  fill="#d1d5db"
                >
                  {device.deviceCode.split("-").slice(1).join("-")}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-gray-400">
        {Object.entries({
          ONLINE: "Online",
          WARNING: "Warning",
          OFFLINE: "Offline",
        }).map(([key, label]) => (
          <span key={key} className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: STATUS_COLORS[key] }}
            />{" "}
            {label}
          </span>
        ))}
        {!editing && (
          <span className="ml-auto text-gray-500">
            {placed.length} of {devices.length} placed · click a pin for details
          </span>
        )}
      </div>

      {editing && (
        <div className="mt-3 rounded-lg border border-gray-800 p-3">
          <p className="mb-2 text-xs text-gray-400">
            Drag a pin to move it. To place a device, pick it below, then click
            the plan.
          </p>

          {waiting.length === 0 ? (
            <p className="text-xs text-gray-500">Every device is placed.</p>
          ) : (
            <div className="flex flex-wrap gap-2" aria-label="Not placed">
              {waiting.map((device) => (
                <button
                  key={device._id}
                  type="button"
                  onClick={() =>
                    setPicked(picked === device._id ? null : device._id)
                  }
                  aria-pressed={picked === device._id}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] transition ${
                    picked === device._id
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
                      : "border-gray-700 text-gray-300 hover:bg-gray-800"
                  }`}
                >
                  <FiMapPin size={11} /> {device.name}
                </button>
              ))}
            </div>
          )}

          {placed.length > 0 && (
            <div
              className="mt-3 flex flex-wrap gap-2 border-t border-gray-800 pt-3"
              aria-label="Placed"
            >
              {placed.map((device) => (
                <span
                  key={device._id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-800 px-3 py-1 text-[11px] text-gray-400"
                >
                  {device.name}
                  <button
                    type="button"
                    aria-label={`Remove pin of ${device.name}`}
                    onClick={() =>
                      setDraft((previous) => ({
                        ...previous,
                        [device._id]: null,
                      }))
                    }
                    className="text-gray-500 hover:text-red-400"
                  >
                    <FiX size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}
          {dirty && (
            <p className="mt-2 text-[11px] text-yellow-400">Unsaved changes</p>
          )}
        </div>
      )}
    </section>
  );
};

export default DeviceFloorMap;
