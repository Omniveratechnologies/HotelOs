import { useEffect, useState } from "react";

import Modal from "../ui/Modal";
import ActionButton from "../ui/button/ActionButton";
import { DeviceStatusBadge, DeviceTypePill } from "./DeviceBadges.jsx";
import { fetchDevice } from "../../services/deviceApi.js";
import { formatLastSync, timeAgo } from "../../utils/deviceFormat.js";

const Row = ({ label, children }) => (
  <div>
    <dt className="text-[10px] tracking-wide text-gray-500 uppercase">
      {label}
    </dt>
    <dd className="mt-0.5 text-sm text-gray-200">{children || "-"}</dd>
  </div>
);

const DeviceDetailModal = ({
  open,
  device,
  onClose,
  onCommand,
  onEdit,
  onRegenerate,
  onRemove,
  refreshKey = 0,
}) => {
  const [events, setEvents] = useState([]);
  const [fresh, setFresh] = useState(null);

  useEffect(() => {
    if (!open || !device) return;
    let cancelled = false;
    fetchDevice(device._id)
      .then((detail) => {
        if (cancelled) return;
        setFresh(detail);
        setEvents(detail.events || []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open, device, refreshKey]);

  useEffect(() => {
    if (!open) {
      setFresh(null);
      setEvents([]);
    }
  }, [open]);

  if (!device) return null;
  const current = fresh || device;
  const live = current.status !== "OFFLINE";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={current.name}
      maxWidth="max-w-xl"
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <DeviceStatusBadge status={current.status} />
        <DeviceTypePill type={current.type} />
        <span className="font-mono text-[11px] text-gray-500">
          {current.deviceCode}
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-3.5 sm:grid-cols-3">
        <Row label="Location">{current.location}</Row>
        <Row label="IP Address">{current.ipAddress}</Row>
        <Row label="Firmware">{current.firmwareVersion}</Row>
        <Row label="Last Seen">
          {current.lastSeenAt ? timeAgo(current.lastSeenAt) : "Never"}
        </Row>
        <Row label="Last Sync">{formatLastSync(current.lastSyncAt)}</Row>
        <Row label="Sync Errors">
          {String(current.consecutiveSyncErrors ?? 0)}
        </Row>
      </dl>

      <div className="mt-5 flex flex-wrap gap-2">
        {[
          ["TEST_CONNECTION", "Test Connection"],
          ["SYNC_NOW", "Sync Now"],
          ["RESTART", "Restart"],
        ].map(([type, label]) => (
          <ActionButton
            key={type}
            variant="outline"
            disabled={!live}
            onClick={() => onCommand(current, type)}
          >
            {label}
          </ActionButton>
        ))}
        {!live && (
          <span className="self-center text-[11px] text-gray-500">
            Commands need the device to be online.
          </span>
        )}
      </div>

      <h3 className="mt-5 mb-2 text-xs font-semibold text-gray-300">
        Recent events
      </h3>
      {events.length === 0 ? (
        <p className="text-xs text-gray-500">No events yet.</p>
      ) : (
        <ul className="max-h-40 space-y-2 overflow-y-auto pr-1">
          {events.slice(0, 8).map((event) => (
            <li key={event._id} className="flex justify-between gap-3 text-xs">
              <span className="text-gray-300">{event.message}</span>
              <span className="shrink-0 text-gray-500">
                {timeAgo(event.createdAt || event.at)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5 flex flex-wrap justify-between gap-2 border-t border-gray-800 pt-4">
        <div className="flex gap-2">
          <ActionButton variant="outline" onClick={() => onEdit(current)}>
            Edit
          </ActionButton>
          <ActionButton variant="outline" onClick={() => onRegenerate(current)}>
            New device token
          </ActionButton>
        </div>
        <ActionButton variant="danger" onClick={() => onRemove(current)}>
          Remove
        </ActionButton>
      </div>
    </Modal>
  );
};

export default DeviceDetailModal;
