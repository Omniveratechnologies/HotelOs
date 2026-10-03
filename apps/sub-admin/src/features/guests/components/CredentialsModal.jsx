import { useState } from "react";
import { Modal, Button } from "@hotelos/ui/components";
import { useUpdateGuestCredentials } from "../hooks/useGuests.js";

export default function CredentialsModal({ open, onClose, guest }) {
  const updateCredentialsMut = useUpdateGuestCredentials();

  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRegenerate = async () => {
    if (!guest) return;
    setError("");
    setSuccess("");
    try {
      const res = await updateCredentialsMut.mutateAsync({
        guestId: guest.id || guest._id,
        payload: { action: "regenerate" },
      });
      const tempPass = res?.data?.temporaryPassword || res?.temporaryPassword;
      if (tempPass) {
        setTemporaryPassword(tempPass);
      }
      setSuccess(
        res?.message || "New credentials generated and emailed to guest.",
      );
    } catch (err) {
      console.error("Credentials error:", err);
      setError(err.message || "Failed to regenerate credentials.");
    }
  };

  const handleCopy = () => {
    if (!temporaryPassword) return;
    navigator.clipboard.writeText(temporaryPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!open || !guest) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Guest Portal Credentials"
      subtitle={`Manage Harmony portal login for ${guest.name}`}
    >
      <div className="space-y-5">
        {success && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            {success}
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm">
          <div className="flex items-center justify-between py-1.5">
            <span className="text-gray-500">Username:</span>
            <span className="font-mono font-bold text-gray-800">
              {guest.username || "Not assigned"}
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-gray-200 py-1.5">
            <span className="text-gray-500">Email on file:</span>
            <span className="font-medium text-gray-700">
              {guest.email || "No email"}
            </span>
          </div>
          {temporaryPassword && (
            <div className="flex items-center justify-between border-t border-gray-200 py-1.5">
              <span className="text-gray-500">Temporary Password:</span>
              <div className="flex items-center gap-2">
                <span className="text-brand-900 font-mono font-bold">
                  {temporaryPassword}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-primary-600 rounded-md border border-gray-200 bg-white px-2 py-0.5 text-xs font-semibold hover:bg-gray-50"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-500">
          Generating a new password will invalidate the previous password and
          send an email with the new credentials to the guest.
        </p>

        <div className="flex justify-between border-t border-gray-100 pt-4">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="primary"
            onClick={handleRegenerate}
            loading={updateCredentialsMut.isPending}
          >
            Regenerate & Email Password
          </Button>
        </div>
      </div>
    </Modal>
  );
}
