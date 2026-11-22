import React, { useState } from "react";
import { AlertTriangle, UserCheck } from "lucide-react";
import { Modal, Input, Button } from "@hotelos/ui/components";
import type { HotelStaffMember } from "../types.ts";

export interface RestoreStaffModalProps {
  open: boolean;
  staff: HotelStaffMember | null;
  initialNewUsername?: string;
  onClose: () => void;
  onConfirm: (newUsername: string) => void;
  loading?: boolean;
}

interface RestoreStaffModalContentProps {
  staff: HotelStaffMember;
  initialNewUsername?: string;
  onClose: () => void;
  onConfirm: (newUsername: string) => void;
  loading?: boolean;
}

const RestoreStaffModalContent: React.FC<RestoreStaffModalContentProps> = ({
  staff,
  initialNewUsername = "",
  onClose,
  onConfirm,
  loading = false,
}) => {
  const originalUsername =
    staff.originalUsername ||
    staff.username?.replace(/_deleted_\d+$/, "") ||
    "user";
  const [newUsername, setNewUsername] = useState(
    () => initialNewUsername || `${originalUsername}_new`,
  );
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!newUsername.trim()) {
      setError("Please provide a new username for this account.");
      return;
    }
    if (newUsername.trim().length < 3) {
      setError("Username must be at least 3 characters.");
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(newUsername.trim())) {
      setError(
        "Username can only contain alphanumeric characters, _, -, and .",
      );
      return;
    }
    setError("");
    onConfirm(newUsername.trim().toLowerCase());
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Username Conflict - Assign New Username"
      subtitle="The original username is in use by another active account."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle size={20} className="mt-0.5 shrink-0 text-amber-600" />
          <div>
            <p className="font-semibold">Original username is unavailable</p>
            <p className="mt-1 text-xs text-amber-800">
              The username{" "}
              <strong className="font-mono">{originalUsername}</strong> has
              already been assigned to another active account. To restore{" "}
              <strong>{staff.name || "this user"}</strong>, please assign a new
              unique username.
            </p>
          </div>
        </div>

        <div>
          <Input
            label="New Unique Username"
            placeholder="e.g. chef_john_2"
            value={newUsername}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setNewUsername(e.target.value)
            }
            error={error}
            required
            hint="Alphanumeric characters, underscores, hyphens, and dots allowed."
          />
        </div>

        <div className="border-surface-200 mt-6 flex items-center justify-end gap-3 border-t pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" icon={UserCheck} loading={loading}>
            Restore with New Username
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export const RestoreStaffModal: React.FC<RestoreStaffModalProps> = ({
  open,
  staff,
  initialNewUsername = "",
  onClose,
  onConfirm,
  loading = false,
}) => {
  if (!open || !staff) return null;

  return (
    <RestoreStaffModalContent
      key={staff.id || staff._id}
      staff={staff}
      initialNewUsername={initialNewUsername}
      onClose={onClose}
      onConfirm={onConfirm}
      loading={loading}
    />
  );
};

export default RestoreStaffModal;
