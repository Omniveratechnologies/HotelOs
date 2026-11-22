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
import { membersApi } from "@hotelos/api";
import type { HotelMember, MemberRole } from "../types.ts";

function generateSecurePassword(): string {
  const chars =
    "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*";
  let pass = "";
  for (let i = 0; i < 12; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

interface HotelMemberFormModalContentProps {
  hotelId: string;
  member?: HotelMember | null;
  onClose: () => void;
  onSaved?: (message: string) => void;
}

const HotelMemberFormModalContent: React.FC<
  HotelMemberFormModalContentProps
> = ({ hotelId, member = null, onClose, onSaved }) => {
  const isEdit = !!member;

  const [name, setName] = useState(member?.name || "");
  const [role, setRole] = useState<MemberRole>(member?.role || "SUB_ADMIN");
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
        const payload: {
          name: string;
          email?: string;
          role: MemberRole;
          isActive: boolean;
          password?: string;
        } = {
          name: name.trim(),
          email: email.trim() || undefined,
          role,
          isActive,
        };
        if (password.trim()) {
          payload.password = password.trim();
        }
        await membersApi.updateMember(member.id || member._id, payload);
        onSaved?.("Member updated successfully.");
      } else {
        const payload = {
          hotelId,
          name: name.trim(),
          role,
          username: username.trim().toLowerCase(),
          password: password.trim(),
          email: email.trim() || undefined,
          isActive,
        };
        await membersApi.createMember(payload);
        onSaved?.("Member created successfully.");
      }
      onClose();
    } catch (err: unknown) {
      console.error("Super Admin member save error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to save member account.";
      setErrors({ form: errorMessage });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? "Edit Hotel Staff" : "Add Hotel Staff Member"}
      subtitle={
        isEdit
          ? "Update details or access status for this account."
          : "Create dedicated login credentials for a staff member of this hotel."
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
            Select Member Role <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => setRole("SUB_ADMIN")}
              className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all ${
                role === "SUB_ADMIN"
                  ? "border-purple-600 bg-purple-50/50 text-purple-900 ring-2 ring-purple-500/20"
                  : "border-surface-200 text-brand-700 hover:border-surface-300 bg-white"
              }`}
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                  role === "SUB_ADMIN"
                    ? "bg-purple-600 text-white"
                    : "bg-surface-100 text-brand-600"
                }`}
              >
                <ShieldCheck size={18} />
              </div>
              <div>
                <span className="block text-xs font-semibold">Sub-Admin</span>
                <span className="text-brand-500/80 block text-[10px]">
                  Hotel Manager
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setRole("RECEPTIONIST")}
              className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all ${
                role === "RECEPTIONIST"
                  ? "border-primary-600 bg-primary-50/50 text-primary-900 ring-primary-500/20 ring-2"
                  : "border-surface-200 text-brand-700 hover:border-surface-300 bg-white"
              }`}
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                  role === "RECEPTIONIST"
                    ? "bg-primary-600 text-white"
                    : "bg-surface-100 text-brand-600"
                }`}
              >
                <UserCheck size={18} />
              </div>
              <div>
                <span className="block text-xs font-semibold">
                  Receptionist
                </span>
                <span className="text-brand-500/80 block text-[10px]">
                  Front Desk
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setRole("KITCHEN")}
              className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all ${
                role === "KITCHEN"
                  ? "border-amber-600 bg-amber-50/50 text-amber-900 ring-2 ring-amber-500/20"
                  : "border-surface-200 text-brand-700 hover:border-surface-300 bg-white"
              }`}
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                  role === "KITCHEN"
                    ? "bg-amber-600 text-white"
                    : "bg-surface-100 text-brand-600"
                }`}
              >
                <UtensilsCrossed size={18} />
              </div>
              <div>
                <span className="block text-xs font-semibold">Kitchen</span>
                <span className="text-brand-500/80 block text-[10px]">
                  Orders & Food
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* FULL NAME */}
        <div>
          <Input
            label="Full Name"
            placeholder="e.g. Anand Sharma"
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
            placeholder="e.g. anand_admin"
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
                : "Unique username for signing in."
            }
          />
        </div>

        {/* PASSWORD */}
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
            placeholder="member@example.com"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setEmail(e.target.value)
            }
            error={errors.email}
            hint="Used for communication and password resets."
          />
        </div>

        {/* ACTIVE STATUS TOGGLE */}
        <div className="border-surface-200 bg-surface-50/50 flex items-center justify-between rounded-xl border p-4">
          <div>
            <span className="text-brand-900 block text-sm font-semibold">
              Account Active
            </span>
            <span className="text-brand-500 block text-xs">
              Allow this user to access their dashboard.
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

export interface HotelMemberFormModalProps {
  open: boolean;
  hotelId: string;
  member?: HotelMember | null;
  onClose: () => void;
  onSaved?: (message: string) => void;
}

export const HotelMemberFormModal: React.FC<HotelMemberFormModalProps> = ({
  open,
  hotelId,
  member = null,
  onClose,
  onSaved,
}) => {
  if (!open) return null;

  return (
    <HotelMemberFormModalContent
      key={member?.id || member?._id || "create"}
      hotelId={hotelId}
      member={member}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
};

export default HotelMemberFormModal;
