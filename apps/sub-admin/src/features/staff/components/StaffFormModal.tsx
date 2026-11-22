import React, { useState } from "react";
import {
  Eye,
  EyeOff,
  Sparkles,
  UtensilsCrossed,
  UserCheck,
} from "lucide-react";
import { Modal, Input, Button } from "@hotelos/ui/components";
import { useCreateStaff, useUpdateStaff } from "../hooks/useStaff.ts";
import type {
  SubAdminStaff,
  SubAdminRole,
  CreateStaffPayload,
  UpdateStaffPayload,
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

interface StaffFormModalContentProps {
  onClose: () => void;
  staff?: SubAdminStaff | null;
  onSaved?: (message: string) => void;
}

const StaffFormModalContent: React.FC<StaffFormModalContentProps> = ({
  onClose,
  staff = null,
  onSaved,
}) => {
  const isEdit = !!staff;
  const createStaffMut = useCreateStaff();
  const updateStaffMut = useUpdateStaff();

  const [name, setName] = useState(staff?.name || "");
  const [role, setRole] = useState<SubAdminRole>(
    (staff?.role as SubAdminRole) || "RECEPTIONIST",
  );
  const [username, setUsername] = useState(staff?.username || "");
  const [email, setEmail] = useState(staff?.email || "");
  const [password, setPassword] = useState(() =>
    isEdit ? "" : generateSecurePassword(),
  );
  const [showPassword, setShowPassword] = useState(false);
  const [isActive, setIsActive] = useState(
    staff?.isActive !== undefined ? staff.isActive : true,
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

    if (!email.trim()) {
      next.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
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

      if (isEdit && staff) {
        const payload: UpdateStaffPayload = {
          name: name.trim(),
          email: email.trim(),
          role,
          isActive,
        };
        if (password.trim()) {
          payload.password = password.trim();
        }
        await updateStaffMut.mutateAsync({
          id: (staff.id || staff._id) as string,
          data: payload,
        });
        if (onSaved) onSaved("Staff member updated successfully.");
      } else {
        const payload: CreateStaffPayload = {
          name: name.trim(),
          username: username.trim().toLowerCase(),
          password: password.trim(),
          email: email.trim(),
          role,
          isActive,
        };
        await createStaffMut.mutateAsync(payload);
        if (onSaved) onSaved("Staff member created successfully.");
      }
      onClose();
    } catch (err: unknown) {
      const msg = (err as Error)?.message || "Failed to save staff member.";
      setErrors({ form: msg });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={
        isEdit ? `Edit Staff Member: ${staff?.name}` : "Add New Staff Member"
      }
      subtitle={
        isEdit
          ? "Modify login credentials, assigned role, or account status."
          : "Assign an operational role, username, and password for front desk or kitchen staff."
      }
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {errors.form && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
            {errors.form}
          </div>
        )}

        {/* ROLE SELECTION */}
        <div>
          <label className="text-brand-900 mb-1.5 block text-xs font-bold tracking-wider uppercase">
            Staff Role & Department <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole("RECEPTIONIST")}
              className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                role === "RECEPTIONIST"
                  ? "border-primary-500 bg-primary-50/50 ring-primary-500/20 ring-2"
                  : "border-surface-200 hover:border-surface-300 bg-white"
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
                <span className="text-brand-900 block text-sm font-bold">
                  Receptionist
                </span>
                <span className="text-brand-600/70 block text-xs">
                  Front desk & check-in
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setRole("KITCHEN")}
              className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                role === "KITCHEN"
                  ? "border-primary-500 bg-primary-50/50 ring-primary-500/20 ring-2"
                  : "border-surface-200 hover:border-surface-300 bg-white"
              }`}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                  role === "KITCHEN"
                    ? "bg-primary-600 text-white"
                    : "bg-surface-100 text-brand-600"
                }`}
              >
                <UtensilsCrossed size={20} />
              </div>
              <div>
                <span className="text-brand-900 block text-sm font-bold">
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

        {/* EMAIL - MANDATORY */}
        <div>
          <Input
            type="email"
            label="Email Address"
            placeholder="staff@hotel.com"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setEmail(e.target.value)
            }
            error={errors.email}
            required
            hint="Mandatory for account authentication, recovery, and alerts."
          />
        </div>

        {/* ACTIVE STATUS TOGGLE */}
        <div className="border-surface-200 bg-surface-50/50 flex items-center justify-between rounded-xl border p-4">
          <div>
            <span className="text-brand-900 block text-sm font-semibold">
              Account Status
            </span>
            <span className="text-brand-500 block text-xs">
              Allow this staff member to sign in to their dashboard.
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
            {isEdit ? "Save Changes" : "Create Staff Member"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export interface StaffFormModalProps {
  open: boolean;
  onClose: () => void;
  staff?: SubAdminStaff | null;
  onSaved?: (message: string) => void;
}

export const StaffFormModal: React.FC<StaffFormModalProps> = ({
  open,
  onClose,
  staff = null,
  onSaved,
}) => {
  if (!open) return null;

  return (
    <StaffFormModalContent
      key={staff?.id || staff?._id || "create"}
      onClose={onClose}
      staff={staff}
      onSaved={onSaved}
    />
  );
};

export default StaffFormModal;
