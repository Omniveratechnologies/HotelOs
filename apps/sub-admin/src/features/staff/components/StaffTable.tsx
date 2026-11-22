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
  SubAdminStaff,
  StaffRoleFilter,
  StaffStatusFilter,
} from "../types.ts";

export interface StaffTableProps {
  staff: SubAdminStaff[];
  loading: boolean;
  roleFilter: StaffRoleFilter;
  statusFilter: StaffStatusFilter;
  searchQuery: string;
  onRoleFilterChange: (role: StaffRoleFilter) => void;
  onStatusFilterChange: (status: StaffStatusFilter) => void;
  onSearchQueryChange: (query: string) => void;
  onAddStaff: () => void;
  onEditStaff: (staff: SubAdminStaff) => void;
  onResetPassword: (staff: SubAdminStaff) => void;
  onDeleteStaff: (staff: SubAdminStaff) => void;
}

export const StaffTable: React.FC<StaffTableProps> = ({
  staff,
  loading,
  roleFilter,
  statusFilter,
  searchQuery,
  onRoleFilterChange,
  onStatusFilterChange,
  onSearchQueryChange,
  onAddStaff,
  onEditStaff,
  onResetPassword,
  onDeleteStaff,
}) => {
  const staffList = staff || [];
  const handleAdd = onAddStaff;
  const handleEdit = onEditStaff;
  const handleDelete = onDeleteStaff;

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
            placeholder="Search staff by name, username, or email..."
            className="border-surface-200 placeholder:text-brand-400 text-brand-900 focus:border-primary-500 focus:ring-primary-500/15 w-full rounded-xl border bg-white py-2 pr-4 pl-9 text-xs shadow-2xs transition-all outline-none"
          />
        </div>

        {/* ROLE & STATUS FILTERS */}
        <div className="flex flex-wrap items-center gap-2">
          {/* ROLE SEGMENTED CONTROL */}
          <div className="border-surface-200 bg-surface-100/80 flex items-center rounded-xl border p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => onRoleFilterChange("ALL")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                roleFilter === "ALL"
                  ? "bg-primary-600 text-white shadow-2xs"
                  : "text-brand-600 hover:text-brand-900"
              }`}
            >
              All Staff
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
              onStatusFilterChange(e.target.value as StaffStatusFilter)
            }
            className="border-surface-200 text-brand-700 focus:border-primary-500 focus:ring-primary-500/15 rounded-xl border bg-white px-3 py-2 text-xs font-semibold shadow-2xs outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* STAFF TABLE */}
      <div className="border-surface-200 overflow-hidden rounded-2xl border bg-white shadow-xs">
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-500">
            Loading staff members...
          </div>
        ) : staffList.length === 0 ? (
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
                : "Add your first hotel staff member to get started."}
            </p>
            {!searchQuery && roleFilter === "ALL" && statusFilter === "ALL" && (
              <div className="mt-4">
                <Button icon={Plus} onClick={handleAdd}>
                  Add Staff Member
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
                {staffList.map((item) => (
                  <tr
                    key={item.id || item._id}
                    className="hover:bg-surface-50/60 transition-colors"
                  >
                    {/* STAFF DETAILS */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-surface-100 text-brand-700 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold">
                          {item.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="text-brand-900 block font-semibold">
                            {item.name}
                          </span>
                          <span className="text-brand-500 font-mono text-xs">
                            @{item.username}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* ROLE BADGE */}
                    <td className="px-6 py-4">
                      {item.role === "RECEPTIONIST" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                          <UserCheck size={13} />
                          Receptionist
                        </span>
                      ) : item.role === "KITCHEN" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                          <UtensilsCrossed size={13} />
                          Kitchen Staff
                        </span>
                      ) : (
                        <span className="bg-surface-100 text-brand-700 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold">
                          {item.role}
                        </span>
                      )}
                    </td>

                    {/* EMAIL */}
                    <td className="text-brand-600 px-6 py-4 text-xs font-medium">
                      {item.email || "—"}
                    </td>

                    {/* STATUS */}
                    <td className="px-6 py-4">
                      {item.isActive ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                          Active
                        </span>
                      ) : (
                        <span className="bg-surface-100 text-brand-600 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold">
                          <span className="bg-surface-400 h-1.5 w-1.5 rounded-full"></span>
                          Inactive
                        </span>
                      )}
                    </td>

                    {/* ACTIONS */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onResetPassword(item)}
                          className="hover:bg-surface-100 text-brand-500 hover:text-brand-700 rounded-lg p-2 transition-colors"
                          title="Reset Password"
                        >
                          <KeyRound size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          className="hover:bg-surface-100 text-brand-500 hover:text-brand-700 rounded-lg p-2 transition-colors"
                          title="Edit Staff Member"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50 hover:text-red-700"
                          title="Remove Staff Member"
                        >
                          <Trash2 size={15} />
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

export default StaffTable;
