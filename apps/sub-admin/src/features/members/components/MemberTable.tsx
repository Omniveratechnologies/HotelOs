import React from "react";
import {
  Search,
  Users,
  Plus,
  KeyRound,
  Pencil,
  Trash2,
  UtensilsCrossed,
  UserCheck,
} from "lucide-react";
import { Button } from "@hotelos/ui/components";
import type {
  SubAdminMember,
  MemberRoleFilter,
  MemberStatusFilter,
} from "../types.ts";

export interface MemberTableProps {
  members: SubAdminMember[];
  loading: boolean;
  roleFilter: MemberRoleFilter;
  statusFilter: MemberStatusFilter;
  searchQuery: string;
  onRoleFilterChange: (role: MemberRoleFilter) => void;
  onStatusFilterChange: (status: MemberStatusFilter) => void;
  onSearchQueryChange: (query: string) => void;
  onAddMember: () => void;
  onEditMember: (member: SubAdminMember) => void;
  onResetPassword: (member: SubAdminMember) => void;
  onDeleteMember: (member: SubAdminMember) => void;
}

export const MemberTable: React.FC<MemberTableProps> = ({
  members,
  loading,
  roleFilter,
  statusFilter,
  searchQuery,
  onRoleFilterChange,
  onStatusFilterChange,
  onSearchQueryChange,
  onAddMember,
  onEditMember,
  onResetPassword,
  onDeleteMember,
}) => {
  return (
    <>
      {/* SEARCH & FILTERS BAR */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* SEARCH INPUT */}
        <div className="relative w-full max-w-sm">
          <Search
            size={16}
            className="text-brand-400 pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onSearchQueryChange(e.target.value)
            }
            placeholder="Search by name, username or email..."
            className="border-surface-200 text-brand-900 placeholder:text-brand-400 focus:border-primary-500 focus:ring-primary-500/15 w-full rounded-xl border bg-white py-2.5 pr-3 pl-9 text-sm outline-none focus:ring-2"
          />
        </div>

        {/* ROLE & STATUS FILTERS */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* ROLE FILTER PILLS */}
          <div className="border-surface-200 flex items-center rounded-xl border bg-white p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => onRoleFilterChange("ALL")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                roleFilter === "ALL"
                  ? "bg-primary-600 text-white shadow-2xs"
                  : "text-brand-600 hover:text-brand-900"
              }`}
            >
              All Roles
            </button>
            <button
              type="button"
              onClick={() => onRoleFilterChange("RECEPTIONIST")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                roleFilter === "RECEPTIONIST"
                  ? "bg-primary-600 text-white shadow-2xs"
                  : "text-brand-600 hover:text-brand-900"
              }`}
            >
              Receptionists
            </button>
            <button
              type="button"
              onClick={() => onRoleFilterChange("KITCHEN")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                roleFilter === "KITCHEN"
                  ? "bg-primary-600 text-white shadow-2xs"
                  : "text-brand-600 hover:text-brand-900"
              }`}
            >
              Kitchen Staff
            </button>
          </div>

          {/* STATUS FILTER DROPDOWN */}
          <select
            value={statusFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              onStatusFilterChange(e.target.value as MemberStatusFilter)
            }
            className="border-surface-200 text-brand-700 focus:border-primary-500 focus:ring-primary-500/15 rounded-xl border bg-white px-3 py-2 text-xs font-semibold shadow-2xs outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* MEMBERS TABLE */}
      <div className="border-surface-200 overflow-hidden rounded-2xl border bg-white shadow-xs">
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-500">
            Loading members...
          </div>
        ) : members.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mb-3 flex justify-center">
              <div className="bg-surface-100 text-brand-400 flex h-12 w-12 items-center justify-center rounded-full">
                <Users size={24} />
              </div>
            </div>
            <h3 className="font-display text-brand-900 text-base font-semibold">
              No staff members found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery || roleFilter !== "ALL" || statusFilter !== "ALL"
                ? "Try adjusting your search or filters."
                : "Add your first hotel team member to get started."}
            </p>
            {!searchQuery && roleFilter === "ALL" && statusFilter === "ALL" && (
              <div className="mt-4">
                <Button icon={Plus} onClick={onAddMember}>
                  Add Member
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-surface-200 text-brand-600/70 border-b text-xs font-semibold tracking-wide uppercase">
                  <th className="px-6 py-4">Staff Member</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-surface-200 divide-y">
                {members.map((member) => (
                  <tr
                    key={member.id || member._id}
                    className="hover:bg-surface-50/60 transition-colors"
                  >
                    {/* MEMBER DETAILS */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary-100 text-primary-800 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold">
                          {(member.name || member.username || "M")
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                        <div>
                          <span className="text-brand-900 block font-semibold">
                            {member.name || "Unnamed"}
                          </span>
                          <span className="text-brand-500 font-mono text-xs">
                            @{member.username}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* ROLE BADGE */}
                    <td className="px-6 py-4">
                      {member.role === "KITCHEN" ? (
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
                      {member.isActive ? (
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
                        <button
                          type="button"
                          onClick={() => onResetPassword(member)}
                          className="border-surface-200 text-brand-600 hover:border-surface-300 hover:bg-surface-50 hover:text-brand-900 inline-flex items-center gap-1 rounded-lg border bg-white px-2.5 py-1.5 text-xs font-semibold shadow-2xs transition-colors"
                          title="Reset member password"
                        >
                          <KeyRound size={13} />
                          Reset Password
                        </button>

                        <button
                          type="button"
                          onClick={() => onEditMember(member)}
                          className="border-surface-200 text-brand-600 hover:border-surface-300 hover:bg-surface-50 hover:text-brand-900 inline-flex items-center gap-1 rounded-lg border bg-white px-2.5 py-1.5 text-xs font-semibold shadow-2xs transition-colors"
                          title="Edit member details"
                        >
                          <Pencil size={13} />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => onDeleteMember(member)}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50/50 px-2.5 py-1.5 text-xs font-semibold text-red-600 shadow-2xs transition-colors hover:bg-red-100"
                          title="Delete member account"
                        >
                          <Trash2 size={13} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export default MemberTable;
