import React, { useState } from "react";
import { useHotelOS } from "../../../app/useHotelOS.js";
import {
  updateGuest,
  updateGuestCredentials,
} from "../../../services/guest.service.js";

export default function GuestDetailsModal({ guest, onClose, onEdit }) {
  const { refreshData } = useHotelOS();

  const [error, setError] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [credentials, setCredentials] = useState(null);

  const handleCheckout = async () => {
    setError("");
    setBusy(true);
    try {
      await updateGuest(guest.id, { status: "checked-out" });
      await refreshData();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to check out the guest.");
    } finally {
      setBusy(false);
    }
  };

  const handleRegenerate = async () => {
    setError("");
    setBusy(true);
    try {
      const result = await updateGuestCredentials(guest.id, {
        action: "regenerate",
      });
      setCredentials(result.data || null);
      setShowNewPassword(false);
    } catch (err) {
      setError(err.message || "Failed to regenerate credentials.");
    } finally {
      setBusy(false);
    }
  };

  const handleSetPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      await updateGuestCredentials(guest.id, { password: newPassword });
      setNewPassword("");
      setShowNewPassword(false);
    } catch (err) {
      setError(err.message || "Failed to update the password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        className="my-8 w-full max-w-lg rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-navy-900 flex items-center justify-between rounded-t-2xl p-5">
          <div>
            <div className="text-gold-400 text-xs font-semibold tracking-widest uppercase">
              Guest Details
            </div>
            <div className="mt-0.5 text-lg font-bold text-white">
              {guest.name}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 transition-colors hover:text-white"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-5 w-5"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="space-y-5 p-5">
          {/* Credentials banner */}
          {credentials && (
            <div className="text-navy-900 rounded-xl bg-amber-50 px-4 py-3 text-sm">
              <span className="font-semibold">New credentials:</span>{" "}
              <span className="font-mono">{credentials.username}</span> /{" "}
              <span className="font-mono">{credentials.temporaryPassword}</span>
              {credentials.emailSent
                ? " — emailed to guest."
                : " — email failed, share manually."}
            </div>
          )}

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div>
              <div className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                Room
              </div>
              <div className="text-navy-900 font-semibold">
                {guest.room
                  ? `Room ${guest.room.roomNumber} · ${guest.room.type}`
                  : "—"}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                Status
              </div>
              <div className="text-navy-900 font-semibold capitalize">
                {(guest.status || "").replace("-", " ")}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                Email
              </div>
              <div className="text-gray-600">{guest.email}</div>
            </div>
            <div>
              <div className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                Phone
              </div>
              <div className="text-gray-600">{guest.phone || "—"}</div>
            </div>
            <div>
              <div className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                Address
              </div>
              <div className="text-gray-600">{guest.address || "—"}</div>
            </div>
            <div>
              <div className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                ID
              </div>
              <div className="text-gray-600">
                {guest.idType}
                {guest.idNumber ? ` · ${guest.idNumber}` : ""}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                Stay
              </div>
              <div className="text-gray-600">
                {guest.checkIn || "—"} → {guest.checkOut || "—"}
                {guest.nights ? ` (${guest.nights}n)` : ""}
              </div>
            </div>
          </div>

          {/* Documents */}
          <div>
            <div className="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">
              Documents ({guest.documents?.length || 0})
            </div>
            {guest.documents?.length > 0 ? (
              <div className="space-y-2">
                {guest.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-2.5"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-gray-400 uppercase">
                        {doc.docType}
                      </div>
                      <div className="text-navy-900 truncate text-sm">
                        {doc.filename}
                      </div>
                    </div>
                    {doc.url && (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="border-gold-400/40 text-gold-400 rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-amber-50"
                      >
                        View
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-400">
                No documents uploaded.
              </div>
            )}
          </div>

          {/* Credential management */}
          <div className="border-t pt-4">
            <div className="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">
              Login Credentials
            </div>
            {!showNewPassword ? (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleRegenerate}
                  disabled={busy}
                  className="rounded-lg border border-amber-300 px-3 py-2 text-xs text-amber-700 hover:bg-amber-50 disabled:opacity-60"
                >
                  🔑 Regenerate & Email New Password
                </button>
                <button
                  onClick={() => setShowNewPassword(true)}
                  disabled={busy}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-60"
                >
                  Set Password Manually
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password (min 8 chars)"
                  className="focus:border-gold-400 flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-hidden"
                />
                <button
                  onClick={() => {
                    setShowNewPassword(false);
                    setNewPassword("");
                  }}
                  className="rounded-xl border border-gray-200 px-3 text-xs hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSetPassword}
                  disabled={busy}
                  className="bg-navy-900 hover:bg-navy-800 rounded-xl px-3 text-xs text-white disabled:opacity-60"
                >
                  {busy ? "..." : "Save"}
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 border-t pt-4">
            <button
              onClick={onEdit}
              className="text-navy-900 flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium hover:bg-gray-50"
            >
              ✏️ Edit
            </button>

            {guest.status !== "checked-out" && (
              <button
                onClick={handleCheckout}
                disabled={busy}
                className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-60"
              >
                ← Check Out
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
