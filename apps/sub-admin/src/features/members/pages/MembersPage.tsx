import React, { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Header, Button, ConfirmDialog } from "@hotelos/ui/components";

import { useMembers, useDeleteMember } from "../hooks/useMembers.js";
import { MemberKpiStats } from "../components/MemberKpiStats.tsx";
import { MemberTable } from "../components/MemberTable.tsx";
import { MemberFormModal } from "../components/MemberFormModal.tsx";
import { ResetMemberPasswordModal } from "../components/ResetMemberPasswordModal.tsx";
import type {
  SubAdminMember,
  MemberRoleFilter,
  MemberStatusFilter,
  MemberStats,
} from "../types.ts";

export const MembersPage: React.FC = () => {
  const [roleFilter, setRoleFilter] = useState<MemberRoleFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<MemberStatusFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const { members = [], isLoading: loading } = useMembers(roleFilter) as {
    members: SubAdminMember[];
    isLoading: boolean;
  };
  const deleteMemberMut = useDeleteMember();

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  }>({
    message: "",
    type: "success",
  });
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [selectedMemberForEdit, setSelectedMemberForEdit] =
    useState<SubAdminMember | null>(null);
  const [selectedMemberForReset, setSelectedMemberForReset] =
    useState<SubAdminMember | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<SubAdminMember | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  // Filter out any GUEST accounts for defense-in-depth
  const staffMembers = useMemo(() => {
    return members.filter((m) => m.role !== "GUEST");
  }, [members]);

  // Filter members in-memory for instant feedback
  const filteredMembers = useMemo(() => {
    return staffMembers.filter((member) => {
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
  }, [staffMembers, roleFilter, statusFilter, searchQuery]);

  // Compute staff KPIs
  const stats: MemberStats = useMemo(() => {
    return {
      total: staffMembers.length,
      receptionists: staffMembers.filter((m) => m.role === "RECEPTIONIST")
        .length,
      kitchen: staffMembers.filter((m) => m.role === "KITCHEN").length,
      active: staffMembers.filter((m) => m.isActive).length,
    };
  }, [staffMembers]);

  function showToast(message: string, type: "success" | "error" = "success") {
    setToast({ message, type });
    setTimeout(() => {
      setToast({ message: "", type: "success" });
    }, 4000);
  }

  // Handle member deletion
  const handleDeleteConfirm = async () => {
    if (!memberToDelete) return;
    const memberId = memberToDelete.id || memberToDelete._id;
    if (!memberId) return;

    try {
      setDeleting(true);
      await deleteMemberMut.mutateAsync(memberId);
      showToast(
        `${memberToDelete.name || "Member"}'s account deleted successfully.`,
      );
      setMemberToDelete(null);
    } catch (err: unknown) {
      console.error("Delete member error:", err);
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
        pageTitle="Hotel Members Management"
        pageDescription="Create, update, and manage staff accounts and dashboard credentials."
      >
        <Button
          icon={Plus}
          onClick={() => {
            setSelectedMemberForEdit(null);
            setFormModalOpen(true);
          }}
        >
          Add Member
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
        <MemberKpiStats stats={stats} />

        {/* MEMBERS TABLE & FILTERS */}
        <MemberTable
          members={filteredMembers}
          loading={loading}
          roleFilter={roleFilter}
          statusFilter={statusFilter}
          searchQuery={searchQuery}
          onRoleFilterChange={setRoleFilter}
          onStatusFilterChange={setStatusFilter}
          onSearchQueryChange={setSearchQuery}
          onAddMember={() => {
            setSelectedMemberForEdit(null);
            setFormModalOpen(true);
          }}
          onEditMember={(member) => {
            setSelectedMemberForEdit(member);
            setFormModalOpen(true);
          }}
          onResetPassword={(member) => {
            setSelectedMemberForReset(member);
          }}
          onDeleteMember={(member) => {
            setMemberToDelete(member);
          }}
        />
      </main>

      {/* CREATE / EDIT MEMBER MODAL */}
      <MemberFormModal
        open={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setSelectedMemberForEdit(null);
        }}
        member={selectedMemberForEdit}
        onSaved={(msg) => showToast(msg)}
      />

      {/* RESET PASSWORD MODAL */}
      {selectedMemberForReset && (
        <ResetMemberPasswordModal
          open={!!selectedMemberForReset}
          onClose={() => setSelectedMemberForReset(null)}
          member={selectedMemberForReset}
          onResetSuccess={(msg) => showToast(msg)}
        />
      )}

      {/* DELETE CONFIRM DIALOG */}
      <ConfirmDialog
        open={!!memberToDelete}
        onClose={() => setMemberToDelete(null)}
        title="Delete Staff Member Account?"
        message={
          <>
            Are you sure you want to delete the account for{" "}
            <strong>{memberToDelete?.name || memberToDelete?.username}</strong>?
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

export default MembersPage;
