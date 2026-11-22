import React, { useState } from "react";
import { Eye, EyeOff, Sparkles, KeyRound } from "lucide-react";
import { Modal, Input, Button } from "@hotelos/ui/components";
import { useResetMemberPassword } from "../hooks/useMembers.js";
import type { SubAdminMember } from "../types.ts";

function generateSecurePassword(): string {
  const chars =
    "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*";
  let pass = "";
  for (let i = 0; i < 12; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

interface ResetMemberPasswordModalContentProps {
  onClose: () => void;
  member: SubAdminMember;
  onResetSuccess?: (message: string) => void;
}

const ResetMemberPasswordModalContent: React.FC<
  ResetMemberPasswordModalContentProps
> = ({ onClose, member, onResetSuccess }) => {
  const resetPasswordMut = useResetMemberPassword();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleGeneratePassword() {
    setPassword(generateSecurePassword());
    setShowPassword(true);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!password.trim()) {
      setError("Please enter a new password.");
      return;
    }
    if (password.trim().length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    const memberId = member.id || member._id;
    if (!memberId) {
      setError("Member ID is missing.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      await resetPasswordMut.mutateAsync({
        id: memberId,
        password: password.trim(),
      });
      onResetSuccess?.(`Password for ${member.name} reset successfully.`);
      onClose();
    } catch (err: unknown) {
      console.error("Password reset error:", err);
      const errMessage =
        err instanceof Error ? err.message : "Failed to reset password.";
      setError(errMessage);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Reset Staff Password"
      subtitle={`Set a new login password for ${member.name || "staff member"}.`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* MEMBER DETAILS BRIEF */}
        <div className="border-surface-200 bg-surface-50 flex items-center gap-3 rounded-xl border p-3.5">
          <div className="bg-primary-100 text-primary-700 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
            <KeyRound size={20} />
          </div>
          <div>
            <span className="text-brand-900 block text-sm font-semibold">
              {member.name}
            </span>
            <span className="text-brand-500 block text-xs">
              @{member.username} · {member.role}
            </span>
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-brand-900 block text-sm font-semibold">
              New Password <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={handleGeneratePassword}
              className="text-primary-600 hover:text-primary-700 inline-flex items-center gap-1 text-xs font-semibold"
            >
              <Sparkles size={13} />
              Generate Strong
            </button>
          </div>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="At least 8 characters"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPassword(e.target.value)
              }
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-brand-400 hover:text-brand-600 absolute top-2.5 right-3 p-1"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div className="border-surface-200 mt-6 flex items-center justify-end gap-3 border-t pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            Reset Password
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export interface ResetMemberPasswordModalProps {
  open: boolean;
  onClose: () => void;
  member: SubAdminMember | null;
  onResetSuccess?: (message: string) => void;
}

export const ResetMemberPasswordModal: React.FC<
  ResetMemberPasswordModalProps
> = ({ open, onClose, member, onResetSuccess }) => {
  if (!open || !member) return null;

  return (
    <ResetMemberPasswordModalContent
      key={member.id || member._id}
      onClose={onClose}
      member={member}
      onResetSuccess={onResetSuccess}
    />
  );
};

export default ResetMemberPasswordModal;
