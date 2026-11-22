import React, { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Header, Button, ConfirmDialog } from "@hotelos/ui/components";

import { useStaff, useDeleteStaff } from "../hooks/useStaff.ts";
import { StaffKpiStats } from "../components/StaffKpiStats.tsx";
import { StaffTable } from "../components/StaffTable.tsx";
import { StaffFormModal } from "../components/StaffFormModal.tsx";
import { ResetStaffPasswordModal } from "../components/ResetStaffPasswordModal.tsx";
import type {
  SubAdminStaff,
  StaffRoleFilter,
  StaffStatusFilter,
  StaffStats,
} from "../types.ts";

export const StaffPage: React.FC = () => {
  const [roleFilter, setRoleFilter] = useState<StaffRoleFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StaffStatusFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const { staff = [], isLoading: loading } = useStaff(roleFilter) as {
    staff: SubAdminStaff[];
    isLoading: boolean;
  };
  const deleteStaffMut = useDeleteStaff();

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  }>({
    message: "",
    type: "success",
  });
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [selectedStaffForEdit, setSelectedStaffForEdit] =
    useState<SubAdminStaff | null>(null);
  const [selectedStaffForReset, setSelectedStaffForReset] =
    useState<SubAdminStaff | null>(null);
  const [staffToDelete, setStaffToDelete] = useState<SubAdminStaff | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  // Filter out any GUEST or SUB_ADMIN accounts for defense-in-depth
  const operationalStaff = useMemo(() => {
    return staff.filter((s) => s.role !== "GUEST" && s.role !== "SUB_ADMIN");
  }, [staff]);

  // Filter staff in-memory for instant feedback
  const filteredStaff = useMemo(() => {
    return operationalStaff.filter((member) => {
      // Role filter
      if (roleFilter !== "ALL" && member.role !== roleFilter) {
        return false;
      }
      // Status filter
      if (statusFilter === "ACTIVE" && !member.isActive) {
        return false;
      }
      if (statusFilter === "INACTIVE" && member.isActive) {
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
  }, [operationalStaff, roleFilter, statusFilter, searchQuery]);

  // Compute staff KPIs
  const stats: StaffStats = useMemo(() => {
    return {
      total: operationalStaff.length,
      receptionists: operationalStaff.filter((m) => m.role === "RECEPTIONIST")
        .length,
      kitchen: operationalStaff.filter((m) => m.role === "KITCHEN").length,
      active: operationalStaff.filter((m) => m.isActive).length,
    };
  }, [operationalStaff]);

  function showToast(message: string, type: "success" | "error" = "success") {
    setToast({ message, type });
    setTimeout(() => {
      setToast({ message: "", type: "success" });
    }, 4000);
  }

  // Handle staff deletion
  const handleDeleteConfirm = async () => {
    if (!staffToDelete) return;
    const staffId = staffToDelete.id || staffToDelete._id;
    if (!staffId) return;

    try {
      setDeleting(true);
      await deleteStaffMut.mutateAsync(staffId);
      showToast(
        `${staffToDelete.name || "Staff member"}'s account deleted successfully.`,
      );
      setStaffToDelete(null);
    } catch (err: unknown) {
      console.error("Delete staff error:", err);
      const errMessage =
        err instanceof Error ? err.message : "Failed to delete account.";
      showToast(errMessage, "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-background-50 min-h-screen">
      <Header
        pageTitle="Hotel Staff Management"
        pageDescription="Create, update, and manage hotel operational staff accounts and credentials."
      >
        <Button
          icon={Plus}
          onClick={() => {
            setSelectedStaffForEdit(null);
            setFormModalOpen(true);
          }}
        >
          Add Staff Member
        </Button>
      </Header>

      <main className="px-6 py-8 lg:px-10">
        {/* TOAST NOTIFICATION */}
        {toast.message && (
          <div
            className={`mb-6 flex items-center justify-between rounded-xl border p-4 text-sm font-medium shadow-sm transition-all ${
              toast.type === "error"
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-800"
            }`}
          >
            <span>{toast.message}</span>
            <button
              type="button"
              onClick={() => setToast({ message: "", type: "success" })}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        )}

        {/* KPI STATS ROW */}
        <StaffKpiStats stats={stats} />

        {/* STAFF TABLE & FILTERS */}
        <StaffTable
          staff={filteredStaff}
          loading={loading}
          roleFilter={roleFilter}
          statusFilter={statusFilter}
          searchQuery={searchQuery}
          onRoleFilterChange={setRoleFilter}
          onStatusFilterChange={setStatusFilter}
          onSearchQueryChange={setSearchQuery}
          onAddStaff={() => {
            setSelectedStaffForEdit(null);
            setFormModalOpen(true);
          }}
          onEditStaff={(item) => {
            setSelectedStaffForEdit(item);
            setFormModalOpen(true);
          }}
          onResetPassword={(item) => {
            setSelectedStaffForReset(item);
          }}
          onDeleteStaff={(item) => {
            setStaffToDelete(item);
          }}
        />
      </main>

      {/* CREATE / EDIT STAFF MODAL */}
      <StaffFormModal
        open={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setSelectedStaffForEdit(null);
        }}
        staff={selectedStaffForEdit}
        onSaved={(msg) => showToast(msg)}
      />

      {/* RESET PASSWORD MODAL */}
      {selectedStaffForReset && (
        <ResetStaffPasswordModal
          open={!!selectedStaffForReset}
          onClose={() => setSelectedStaffForReset(null)}
          staff={selectedStaffForReset}
          onResetSuccess={(msg) => showToast(msg)}
        />
      )}

      {/* DELETE CONFIRM DIALOG */}
      <ConfirmDialog
        open={!!staffToDelete}
        onClose={() => setStaffToDelete(null)}
        title="Delete Staff Member Account?"
        message={
          <>
            Are you sure you want to delete the account for{" "}
            <strong>{staffToDelete?.name || staffToDelete?.username}</strong>?
            They will immediately lose access to their dashboard.
          </>
        }
        confirmLabel="Delete Account"
        cancelLabel="Cancel"
        tone="danger"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
};

export default StaffPage;
