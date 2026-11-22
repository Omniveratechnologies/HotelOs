import React, { useState, useMemo } from "react";
import {
  Users,
  ShieldCheck,
  UserCheck,
  UtensilsCrossed,
  RotateCcw,
  Search,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@hotelos/ui/components";
import type {
  HotelStaffMember,
  StaffRoleFilter,
  StaffStatusFilter,
} from "../types.ts";

export interface HotelStaffTabProps {
  staff: HotelStaffMember[];
  loading: boolean;
  onAddStaff: () => void;
  onEditStaff: (staff: HotelStaffMember) => void;
  onDeleteStaff: (staff: HotelStaffMember, permanent: boolean) => void;
  onRestoreStaff: (staff: HotelStaffMember) => void;
}

export const HotelStaffTab: React.FC<HotelStaffTabProps> = ({
  staff,
  loading,
  onAddStaff,
  onEditStaff,
  onDeleteStaff,
  onRestoreStaff,
}) => {
  const handleAdd = onAddStaff;
  const handleEdit = onEditStaff;
  const handleDelete = onDeleteStaff;
  const handleRestore = onRestoreStaff;

  const [roleFilter, setRoleFilter] = useState<StaffRoleFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StaffStatusFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter out any GUEST accounts for defense-in-depth
  const staffMembers = useMemo(() => {
    return (staff || []).filter((m) => m.role !== "GUEST");
  }, [staff]);

  const memberStats = useMemo(() => {
    return {
      total: staffMembers.length,
      subAdmins: staffMembers.filter(
        (m) => m.role === "SUB_ADMIN" && !m.isDeleted,
      ).length,
      receptionists: staffMembers.filter(
        (m) => m.role === "RECEPTIONIST" && !m.isDeleted,
      ).length,
      kitchen: staffMembers.filter((m) => m.role === "KITCHEN" && !m.isDeleted)
        .length,
      deleted: staffMembers.filter((m) => m.isDeleted).length,
    };
  }, [staffMembers]);

  const filteredMembers = useMemo(() => {
    return staffMembers.filter((member) => {
      // Role filter
      if (roleFilter !== "ALL" && member.role !== roleFilter) {
        return false;
      }
      // Status filter
      if (statusFilter === "ACTIVE" && (member.isDeleted || !member.isActive)) {
        return false;
      }
      if (
        statusFilter === "INACTIVE" &&
        (member.isDeleted || member.isActive)
      ) {
        return false;
      }
      if (statusFilter === "DELETED" && !member.isDeleted) {
        return false;
      }
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const name = (member.name || "").toLowerCase();
        const username = (member.username || "").toLowerCase();
        const email = (member.email || "").toLowerCase();
        return name.includes(q) || username.includes(q) || email.includes(q);
      }
      return true;
    });
  }, [staffMembers, roleFilter, statusFilter, searchQuery]);

  return (
    <div>
      {/* KPI STATS ROW */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="border-surface-200 flex items-center gap-3 rounded-2xl border bg-white p-4 shadow-2xs">
          <div className="bg-surface-100 text-brand-700 flex h-10 w-10 items-center justify-center rounded-xl">
            <Users size={20} />
          </div>
          <div>
            <span className="text-brand-500 block text-[11px] font-semibold uppercase">
              Total Staff
            </span>
            <span className="font-display text-brand-900 text-xl font-bold">
              {memberStats.total}
            </span>
          </div>
        </div>

        <div className="border-surface-200 flex items-center gap-3 rounded-2xl border bg-white p-4 shadow-2xs">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
            <ShieldCheck size={20} />
          </div>
          <div>
            <span className="text-brand-500 block text-[11px] font-semibold uppercase">
              Sub-Admins
            </span>
            <span className="font-display text-brand-900 text-xl font-bold">
              {memberStats.subAdmins}
            </span>
          </div>
        </div>

        <div className="border-surface-200 flex items-center gap-3 rounded-2xl border bg-white p-4 shadow-2xs">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
            <UserCheck size={20} />
          </div>
          <div>
            <span className="text-brand-500 block text-[11px] font-semibold uppercase">
              Receptionists
            </span>
            <span className="font-display text-brand-900 text-xl font-bold">
              {memberStats.receptionists}
            </span>
          </div>
        </div>

        <div className="border-surface-200 flex items-center gap-3 rounded-2xl border bg-white p-4 shadow-2xs">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <UtensilsCrossed size={20} />
          </div>
          <div>
            <span className="text-brand-500 block text-[11px] font-semibold uppercase">
              Kitchen Staff
            </span>
            <span className="font-display text-brand-900 text-xl font-bold">
              {memberStats.kitchen}
            </span>
          </div>
        </div>

        <div className="border-surface-200 flex items-center gap-3 rounded-2xl border bg-white p-4 shadow-2xs">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
            <RotateCcw size={20} />
          </div>
          <div>
            <span className="text-brand-500 block text-[11px] font-semibold uppercase">
              Soft Deleted
            </span>
            <span className="font-display text-brand-900 text-xl font-bold">
              {memberStats.deleted}
            </span>
          </div>
        </div>
      </div>

      {/* SEARCH & FILTERS BAR */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full max-w-sm">
          <Search
            size={16}
            className="text-brand-400 pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearchQuery(e.target.value)
            }
            placeholder="Search staff by name, username or email..."
            className="border-surface-200 text-brand-900 placeholder:text-brand-400 focus:border-primary-500 focus:ring-primary-500/15 w-full rounded-xl border bg-white py-2.5 pr-3 pl-9 text-sm outline-none focus:ring-2"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* ROLE FILTER */}
          <div className="border-surface-200 flex items-center rounded-xl border bg-white p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setRoleFilter("ALL")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                roleFilter === "ALL"
                  ? "bg-primary-600 text-white"
                  : "text-brand-600 hover:text-brand-900"
              }`}
            >
              All Roles
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter("SUB_ADMIN")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                roleFilter === "SUB_ADMIN"
                  ? "bg-primary-600 text-white"
                  : "text-brand-600 hover:text-brand-900"
              }`}
            >
              Sub-Admin
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter("RECEPTIONIST")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                roleFilter === "RECEPTIONIST"
                  ? "bg-primary-600 text-white"
                  : "text-brand-600 hover:text-brand-900"
              }`}
            >
              Receptionist
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter("KITCHEN")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                roleFilter === "KITCHEN"
                  ? "bg-primary-600 text-white"
                  : "text-brand-600 hover:text-brand-900"
              }`}
            >
              Kitchen
            </button>
          </div>

          {/* STATUS FILTER */}
          <select
            value={statusFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setStatusFilter(e.target.value as StaffStatusFilter)
            }
            className="border-surface-200 text-brand-700 rounded-xl border bg-white px-3 py-1.5 text-xs font-semibold shadow-2xs outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
            <option value="DELETED">Soft Deleted Only</option>
          </select>

          <Button icon={Plus} onClick={handleAdd}>
            Add Staff Member
          </Button>
        </div>
      </div>

      {/* MEMBERS TABLE */}
      <div className="border-surface-200 overflow-hidden rounded-2xl border bg-white shadow-xs">
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-500">
            Loading hotel members...
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="py-16 text-center">
            <Users size={32} className="text-brand-300 mx-auto mb-3" />
            <p className="text-brand-900 font-semibold">
              No staff members found
            </p>
            <p className="text-brand-500 mt-1 text-xs">
              {searchQuery || roleFilter !== "ALL" || statusFilter !== "ALL"
                ? "Try adjusting your search filters."
                : "Add the first staff member for this hotel."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-surface-200 text-brand-600/70 border-b text-xs font-semibold tracking-wide uppercase">
                  <th className="px-6 py-4">User Details</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-surface-200 divide-y">
                {filteredMembers.map((member) => (
                  <tr
                    key={member.id || member._id}
                    className={`transition-colors ${
                      member.isDeleted
                        ? "bg-rose-50/20 hover:bg-rose-50/40"
                        : "hover:bg-surface-50/60"
                    }`}
                  >
                    {/* DETAILS */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                            member.isDeleted
                              ? "bg-rose-100 text-rose-800"
                              : "bg-primary-100 text-primary-800"
                          }`}
                        >
                          {(member.name || member.username || "M")
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                        <div>
                          <span className="text-brand-900 block font-semibold">
                            {member.name || "Unnamed"}
                          </span>
                          <span className="text-brand-500 font-mono text-xs">
                            {member.isDeleted
                              ? `@${member.originalUsername || member.username}`
                              : `@${member.username}`}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* ROLE */}
                    <td className="px-6 py-4">
                      {member.role === "SUB_ADMIN" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-800">
                          <ShieldCheck size={13} />
                          Sub-Admin
                        </span>
                      ) : member.role === "KITCHEN" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                          <UtensilsCrossed size={13} />
                          Kitchen Staff
                        </span>
                      ) : member.role === "RECEPTIONIST" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800">
                          <UserCheck size={13} />
                          Receptionist
                        </span>
                      ) : (
                        <span className="bg-surface-100 text-brand-700 inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold">
                          {member.role}
                        </span>
                      )}
                    </td>

                    {/* EMAIL */}
                    <td className="text-brand-600 px-6 py-4">
                      {member.email || "—"}
                    </td>

                    {/* STATUS */}
                    <td className="px-6 py-4">
                      {member.isDeleted ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-800">
                          <RotateCcw size={11} />
                          Soft Deleted
                        </span>
                      ) : member.isActive ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                          Inactive
                        </span>
                      )}
                    </td>

                    {/* ACTIONS */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {member.isDeleted ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleRestore(member)}
                              className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-emerald-700 shadow-2xs transition-colors hover:bg-emerald-50"
                              title="Restore user account"
                            >
                              <RotateCcw size={13} />
                              Restore
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(member, true)}
                              className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-red-600 shadow-2xs transition-colors hover:bg-red-50"
                              title="Permanently remove from database"
                            >
                              <Trash2 size={13} />
                              Permanent Delete
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleEdit(member)}
                              className="border-surface-200 text-brand-600 hover:border-surface-300 hover:bg-surface-50 hover:text-brand-900 inline-flex items-center gap-1 rounded-lg border bg-white px-2.5 py-1.5 text-xs font-semibold shadow-2xs transition-colors"
                            >
                              <Pencil size={13} />
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(member, false)}
                              className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50/50 px-2.5 py-1.5 text-xs font-semibold text-red-600 shadow-2xs transition-colors hover:bg-red-100"
                              title="Soft delete user account"
                            >
                              <Trash2 size={13} />
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default HotelStaffTab;
