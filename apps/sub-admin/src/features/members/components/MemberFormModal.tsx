import React, { useState } from "react";
import {
  Eye,
  EyeOff,
  Sparkles,
  UtensilsCrossed,
  UserCheck,
} from "lucide-react";
import { Modal, Input, Button } from "@hotelos/ui/components";
import { useCreateMember, useUpdateMember } from "../hooks/useMembers.js";
import type {
  SubAdminMember,
  SubAdminRole,
  CreateMemberPayload,
  UpdateMemberPayload,
} from "../types.ts";

function generateSecurePassword(): string {
  const chars =
    "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*";
  let pass = "";
  for (let i = 0; i < 12; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

interface MemberFormModalContentProps {
  onClose: () => void;
  member?: SubAdminMember | null;
  onSaved?: (message: string) => void;
}

const MemberFormModalContent: React.FC<MemberFormModalContentProps> = ({
  onClose,
  member = null,
  onSaved,
}) => {
  const isEdit = !!member;
  const createMemberMut = useCreateMember();
  const updateMemberMut = useUpdateMember();

  const [name, setName] = useState(member?.name || "");
  const [role, setRole] = useState<SubAdminRole>(
    (member?.role as SubAdminRole) || "RECEPTIONIST",
  );
  const [username, setUsername] = useState(member?.username || "");
  const [email, setEmail] = useState(member?.email || "");
  const [password, setPassword] = useState(() =>
    isEdit ? "" : generateSecurePassword(),
  );
  const [showPassword, setShowPassword] = useState(false);
  const [isActive, setIsActive] = useState(
    member?.isActive !== undefined ? member.isActive : true,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function handleGeneratePassword() {
    setPassword(generateSecurePassword());
    setShowPassword(true);
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Full name is required.";
    if (!isEdit) {
      if (!username.trim()) {
        next.username = "Username is required.";
      } else if (username.trim().length < 3) {
        next.username = "Username must be at least 3 characters.";
      } else if (!/^[a-zA-Z0-9_.-]+$/.test(username.trim())) {
        next.username = "Only alphanumeric characters, _, -, and . allowed.";
      }

      if (!password.trim()) {
        next.password = "Password is required.";
      } else if (password.trim().length < 8) {
        next.password = "Password must be at least 8 characters.";
      }
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = "Please enter a valid email address.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      setErrors({});

      if (isEdit && member) {
        const payload: UpdateMemberPayload = {
          name: name.trim(),
          email: email.trim() || undefined,
          role,
          isActive,
        };
        if (password.trim()) {
          payload.password = password.trim();
        }
        await updateMemberMut.mutateAsync({
          id: member.id || member._id,
          data: payload,
        });
        onSaved?.("Staff member updated successfully.");
      } else {
        const payload: CreateMemberPayload = {
          name: name.trim(),
          role,
          username: username.trim().toLowerCase(),
          password: password.trim(),
          email: email.trim() || undefined,
          isActive,
        };
        await createMemberMut.mutateAsync(payload);
        onSaved?.("Staff member created successfully.");
      }
      onClose();
    } catch (err: unknown) {
      console.error("Member save error:", err);
      const errMessage =
        err instanceof Error ? err.message : "Failed to save staff member.";
      setErrors({ form: errMessage });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? "Edit Staff Member" : "Add New Staff Member"}
      subtitle={
        isEdit
          ? "Update details or access status for this staff member."
          : "Create dedicated login credentials for a staff member."
      }
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {errors.form && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errors.form}
          </div>
        )}

        {/* ROLE SELECTION */}
        <div>
          <label className="text-brand-900 mb-2 block text-sm font-semibold">
            Member Role <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole("RECEPTIONIST")}
              className={`flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all ${
                role === "RECEPTIONIST"
                  ? "border-primary-600 bg-primary-50/50 text-primary-900 ring-primary-500/20 ring-2"
                  : "border-surface-200 text-brand-700 hover:border-surface-300 bg-white"
              }`}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                  role === "RECEPTIONIST"
                    ? "bg-primary-600 text-white"
                    : "bg-surface-100 text-brand-600"
                }`}
              >
                <UserCheck size={20} />
              </div>
              <div>
                <span className="block text-sm font-semibold">
                  Receptionist
                </span>
                <span className="text-brand-600/70 block text-xs">
                  Front desk & guest check-ins
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setRole("KITCHEN")}
              className={`flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all ${
                role === "KITCHEN"
                  ? "border-amber-600 bg-amber-50/50 text-amber-900 ring-2 ring-amber-500/20"
                  : "border-surface-200 text-brand-700 hover:border-surface-300 bg-white"
              }`}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                  role === "KITCHEN"
                    ? "bg-amber-600 text-white"
                    : "bg-surface-100 text-brand-600"
                }`}
              >
                <UtensilsCrossed size={20} />
              </div>
              <div>
                <span className="block text-sm font-semibold">
                  Kitchen Staff
                </span>
                <span className="text-brand-600/70 block text-xs">
                  Food orders & kitchen terminal
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* FULL NAME */}
        <div>
          <Input
            label="Full Name"
            placeholder="e.g. Ramesh Kumar"
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setName(e.target.value)
            }
            error={errors.name}
            required
          />
        </div>

        {/* USERNAME */}
        <div>
          <Input
            label="Username"
            placeholder="e.g. chef_ramesh"
            value={username}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setUsername(e.target.value)
            }
            error={errors.username}
            disabled={isEdit}
            required={!isEdit}
            hint={
              isEdit
                ? "Usernames cannot be changed once created."
                : "Unique ID used to log in to the respective dashboard."
            }
          />
        </div>

        {/* PASSWORD (Only required on create) */}
        {!isEdit && (
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-brand-900 block text-sm font-semibold">
                Password <span className="text-red-500">*</span>
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
                error={errors.password}
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
        )}

        {/* EMAIL */}
        <div>
          <Input
            type="email"
            label="Email Address (Optional)"
            placeholder="staff@hotel.com"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setEmail(e.target.value)
            }
            error={errors.email}
            hint="Used for account recovery and notifications."
          />
        </div>

        {/* ACTIVE STATUS TOGGLE */}
        <div className="border-surface-200 bg-surface-50/50 flex items-center justify-between rounded-xl border p-4">
          <div>
            <span className="text-brand-900 block text-sm font-semibold">
              Account Status
            </span>
            <span className="text-brand-500 block text-xs">
              Allow this member to sign in to their dashboard.
            </span>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setIsActive(e.target.checked)
              }
              className="peer sr-only"
            />
            <div className="peer h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-emerald-600 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
          </label>
        </div>

        {/* MODAL ACTIONS */}
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
            {isEdit ? "Save Changes" : "Create Member"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export interface MemberFormModalProps {
  open: boolean;
  onClose: () => void;
  member?: SubAdminMember | null;
  onSaved?: (message: string) => void;
}

export const MemberFormModal: React.FC<MemberFormModalProps> = ({
  open,
  onClose,
  member = null,
  onSaved,
}) => {
  if (!open) return null;

  return (
    <MemberFormModalContent
      key={member?.id || member?._id || "create"}
      onClose={onClose}
      member={member}
      onSaved={onSaved}
    />
  );
};

export default MemberFormModal;
