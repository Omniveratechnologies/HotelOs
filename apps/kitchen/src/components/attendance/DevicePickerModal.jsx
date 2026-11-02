import { useEffect, useState } from "react";

import Modal from "../ui/Modal";
import ActionButton from "../ui/button/ActionButton";

const DevicePickerModal = ({
  open,
  title,
  actionLabel,
  devices = [],
  onClose,
  onPick,
}) => {
  const [id, setId] = useState("");

  useEffect(() => {
    if (open) setId(devices[0]?._id || "");
  }, [open, devices]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      maxWidth="max-w-sm"
      footer={
        <>
          <ActionButton variant="outline" onClick={onClose}>
            Cancel
          </ActionButton>
          <ActionButton
            disabled={!id}
            onClick={() => onPick(devices.find((device) => device._id === id))}
          >
            {actionLabel}
          </ActionButton>
        </>
      }
    >
      {devices.length === 0 ? (
        <p className="text-sm text-gray-400">
          No device is available for this action.
        </p>
      ) : (
        <label className="block text-xs text-gray-400">
          <span className="mb-1.5 block font-medium text-gray-300">Device</span>
          <select
            value={id}
            onChange={(event) => setId(event.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-[#0f0f0f] px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
          >
            {devices.map((device) => (
              <option key={device._id} value={device._id}>
                {device.name} ({device.deviceCode})
              </option>
            ))}
          </select>
        </label>
      )}
    </Modal>
  );
};

export default DevicePickerModal;
