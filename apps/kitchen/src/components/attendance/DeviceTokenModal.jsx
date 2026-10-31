import { useState } from "react";
import { FiCheck, FiCopy } from "react-icons/fi";

import Modal from "../ui/Modal";
import ActionButton from "../ui/button/ActionButton";

const DeviceTokenModal = ({ open, device, token, onClose }) => {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Device token"
      maxWidth="max-w-md"
      footer={<ActionButton onClick={onClose}>I have saved it</ActionButton>}
    >
      <p className="text-sm text-gray-300">
        <span className="font-medium text-white">{device?.name}</span> (
        {device?.deviceCode}) uses this token to talk to the server.
      </p>
      <p className="mt-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-300">
        This is the only time the token is shown. Copy it into the device now. A
        lost token can be replaced with "New device token".
      </p>

      <div className="mt-3 flex items-center gap-2">
        <input
          readOnly
          value={token || ""}
          aria-label="Device token"
          onFocus={(event) => event.target.select()}
          className="min-w-0 flex-1 rounded-lg border border-gray-700 bg-[#0f0f0f] px-3 py-2 font-mono text-xs text-emerald-300 outline-none"
        />
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-700 px-3 py-2 text-xs text-gray-300 hover:bg-gray-800"
        >
          {copied ? <FiCheck size={13} /> : <FiCopy size={13} />}{" "}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </Modal>
  );
};

export default DeviceTokenModal;
