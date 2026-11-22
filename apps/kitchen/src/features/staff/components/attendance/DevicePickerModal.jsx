import { useState } from "react";

import Modal from "@/components/ui/Modal";
import ActionButton from "@/components/ui/button/ActionButton";
import { EMPTY_ARRAY } from "@/constants/defaults.js";

const DevicePickerModal = ({
  open,
  title,
  actionLabel,
  devices = EMPTY_ARRAY,
  onClose,
  onPick,
}) => {
  // Key changes when modal opens/closes or device list changes, triggering remount
  const formKey = open ? devices.map((d) => d._id).join(",") : "closed";

  const [id, setId] = useState(() => open ? devices[0]?._id || "" : "");

  return (
    <Modal
      key={formKey}
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