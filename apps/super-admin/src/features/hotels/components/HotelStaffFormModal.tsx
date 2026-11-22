import React, { useState } from "react";
import {
  Eye,
  EyeOff,
  Sparkles,
  UtensilsCrossed,
  UserCheck,
  ShieldCheck,
} from "lucide-react";
import { Modal, Input, Button } from "@hotelos/ui/components";
import { staffApi } from "@hotelos/api";
import type { HotelStaffMember, StaffRole } from "../types.ts";

function generateSecurePassword(): string {
  const chars =
    "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*";
  let pass = "";
  for (let i = 0; i < 12; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

interface HotelStaffFormModalContentProps {
  hotelId: string;
  staff?: HotelStaffMember | null;
  onClose: () => void;
  onSaved?: (message: string) => void;
}

const HotelStaffFormModalContent: React.FC<HotelStaffFormModalContentProps> = ({
  hotelId,
  staff = null,
  onClose,
  onSaved,
}) => {
  const isEdit = !!staff;

  const [name, setName] = useState(staff?.name || "");
  const [role, setRole] = useState<StaffRole>(staff?.role || "SUB_ADMIN");
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

  function validate() {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Full name is required.";
    if (!isEdit && !username.trim()) errs.username = "Username is required.";
    if (!isEdit && username.trim().length < 3) {
      errs.username = "Username must be at least 3 characters.";
    }
    if (!isEdit && !/^[a-zA-Z0-9_.-]+$/.test(username.trim())) {
      errs.username =
        "Username can only contain alphanumeric characters, _, -, and .";
    }
    if (!email.trim()) {
      errs.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = "Please enter a valid email address.";
    }
    if (!isEdit && !password.trim()) {
      errs.password = "Password is required.";
    }
    if (!isEdit && password.trim().length < 8) {
      errs.password = "Password must be at least 8 characters.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      if (isEdit && staff) {
        const payload: {
          name: string;
          email: string;
          role: StaffRole;
          isActive: boolean;
          password?: string;
        } = {
          name: name.trim(),
          email: email.trim(),
          role,
          isActive,
        };
        if (password.trim()) {
          payload.password = password.trim();
        }
        await staffApi.updateStaff(staff.id || staff._id || "", payload);
        onSaved?.("Staff member updated successfully.");
      } else {
        const payload = {
          hotelId,
          name: name.trim(),
          username: username.trim().toLowerCase(),
          password: password.trim(),
          email: email.trim(),
          role,
          isActive,
        };
        await staffApi.createStaff(payload);
        onSaved?.("Staff member created successfully.");
      }
      onClose();
    } catch (err: unknown) {
      const msg = (err as Error)?.message || "Failed to save user account.";
      setErrors({ form: msg });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? "Edit Staff / Admin Account" : "Add Hotel Staff / Admin"}
      subtitle={
        isEdit
          ? "Update account details and role permissions."
          : "Create a new user account assigned to this hotel property."
      }
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.form && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {errors.form}
          </div>
        )}

        {/* ROLE SELECTION */}
        <div>
          <label className="text-brand-900 block text-xs font-semibold tracking-wider uppercase">
            Account Role
          </label>
          <div className="mt-1.5 grid grid-cols-3 gap-3">
            {[
              {
                value: "SUB_ADMIN" as const,
                label: "Sub-Admin",
                desc: "Full property manager",
                icon: ShieldCheck,
                color: "text-purple-600 bg-purple-50 border-purple-200",
                selectedColor: "border-purple-600 ring-2 ring-purple-600/20",
              },
              {
                value: "RECEPTIONIST" as const,
                label: "Receptionist",
                desc: "Front desk & check-in",
                icon: UserCheck,
                color: "text-blue-600 bg-blue-50 border-blue-200",
                selectedColor: "border-blue-600 ring-2 ring-blue-600/20",
              },
              {
                value: "KITCHEN" as const,
                label: "Kitchen Staff",
                desc: "KDS & food orders",
                icon: UtensilsCrossed,
                color: "text-amber-600 bg-amber-50 border-amber-200",
                selectedColor: "border-amber-600 ring-2 ring-amber-600/20",
              },
            ].map((r) => {
              const Icon = r.icon;
              const isSelected = role === r.value;
              return (
                <button
                  type="button"
                  key={r.value}
                  onClick={() => setRole(r.value)}
                  className={`flex flex-col items-center rounded-xl border p-3 text-center transition-all ${
                    isSelected
                      ? `${r.color} ${r.selectedColor} font-semibold`
                      : "border-surface-200 hover:border-surface-300 text-brand-600 bg-white"
                  }`}
                >
                  <Icon size={20} className="mb-1" />
                  <span className="text-xs">{r.label}</span>
                  <span className="text-brand-400 mt-0.5 text-[10px]">
                    {r.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* FULL NAME */}
        <div>
          <Input
            label="Full Name *"
            placeholder="e.g. John Doe"
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
            label="Username *"
            placeholder="e.g. jdoe_staff"
            value={username}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setUsername(e.target.value)
            }
            error={errors.username}
            disabled={isEdit}
            required
            hint={
              isEdit
                ? "Username cannot be changed once created."
                : "Alphanumeric characters, underscores, hyphens, and dots allowed."
            }
          />
        </div>

        {/* EMAIL ADDRESS */}
        <div>
          <Input
            label="Email Address *"
            type="email"
            placeholder="e.g. john@hotel.com"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setEmail(e.target.value)
            }
            error={errors.email}
            required
            hint="Mandatory for notifications, invitations, and password reset."
          />
        </div>

        {/* PASSWORD */}
        <div>
          <label className="text-brand-900 block text-xs font-semibold tracking-wider uppercase">
            {isEdit ? "Set New Password (Optional)" : "Password *"}
          </label>
          <div className="relative mt-1">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder={
                isEdit ? "Leave blank to keep current password" : "••••••••••••"
              }
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPassword(e.target.value)
              }
              error={errors.password}
              required={!isEdit}
            />
            <div className="absolute top-2 right-2 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-brand-400 hover:text-brand-600 rounded p-1 transition-colors"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded p-1 transition-colors"
                title="Generate secure password"
              >
                <Sparkles size={16} />
              </button>
            </div>
          </div>
          {isEdit && (
            <p className="text-brand-400 mt-1 text-xs">
              Leave blank to keep existing password unchanged.
            </p>
          )}
        </div>

        {/* ACTIVE STATUS TOGGLE */}
        <div className="border-surface-200 bg-surface-50/50 flex items-center justify-between rounded-xl border p-3">
          <div>
            <span className="text-brand-900 text-sm font-semibold">
              Account Active
            </span>
            <p className="text-brand-500 text-xs">
              Active accounts can log into the operational dashboard.
            </p>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="peer sr-only"
            />
            <div className="peer-focus:ring-primary-300 peer bg-surface-300 peer-checked:bg-primary-600 h-6 w-11 rounded-full peer-focus:outline-hidden after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
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
            {isEdit ? "Save Changes" : "Create Account"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export interface HotelStaffFormModalProps {
  open: boolean;
  hotelId: string;
  staff?: HotelStaffMember | null;
  onClose: () => void;
  onSaved?: (message: string) => void;
}

export const HotelStaffFormModal: React.FC<HotelStaffFormModalProps> = ({
  open,
  hotelId,
  staff = null,
  onClose,
  onSaved,
}) => {
  if (!open) return null;

  return (
    <HotelStaffFormModalContent
      key={staff?.id || staff?._id || "create"}
      hotelId={hotelId}
      staff={staff}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
};

export default HotelStaffFormModal;
