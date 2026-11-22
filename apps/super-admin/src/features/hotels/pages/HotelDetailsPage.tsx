import React, { useState, useMemo } from "react";
import { useParams, Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Power,
  Mail,
  Building2,
  Users,
  Calendar,
  Monitor,
} from "lucide-react";

import { Header, Button, ConfirmDialog } from "@hotelos/ui/components";
import { membersApi } from "@hotelos/api";
import { EditHotelSectionModal } from "../components/EditHotelSectionModal.tsx";
import { HotelHeroCard } from "../components/HotelHeroCard.tsx";
import { HotelMembersTab } from "../components/HotelMembersTab.tsx";
import { HotelProfileTab } from "../components/HotelProfileTab.tsx";
import { HotelSubscriptionTab } from "../components/HotelSubscriptionTab.tsx";
import { HotelKiosksTab } from "../components/HotelKiosksTab.tsx";
import { HotelMemberFormModal } from "../components/HotelMemberFormModal.tsx";
import { RestoreMemberModal } from "../components/RestoreMemberModal.tsx";
import { useHotel, useUpdateHotelStatus } from "../hooks/useHotels.js";
import { useKiosks } from "../hooks/useKiosks.ts";
import type {
  Hotel,
  HotelMember,
  KioskDevice,
  HotelDetailsTab,
  HotelEditSection,
} from "../types.ts";

interface ApiErrorShape {
  status?: number;
  errorCode?: string;
  message?: string;
}

export const HotelDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const {
    data: hotel,
    isLoading: hotelLoading,
    error: hotelError,
    refetch: refetchHotel,
  } = useHotel(id) as {
    data: Hotel | undefined;
    isLoading: boolean;
    error: unknown;
    refetch: () => void;
  };
  const updateHotelStatusMutation = useUpdateHotelStatus();

  // Active Tab
  const [activeTab, setActiveTab] = useState<HotelDetailsTab>("members");

  // Modals state
  const [activeEditSection, setActiveEditSection] =
    useState<HotelEditSection | null>(null);
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [selectedMemberForEdit, setSelectedMemberForEdit] =
    useState<HotelMember | null>(null);
  const [restoreConflictMember, setRestoreConflictMember] =
    useState<HotelMember | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<HotelMember | null>(
    null,
  );
  const [deletePermanent, setDeletePermanent] = useState(false);
  const [deletingMember, setDeletingMember] = useState(false);
  const [restoringMember, setRestoringMember] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  }>({
    message: "",
    type: "success",
  });

  // Query Hotel Members
  const {
    data: members = [],
    isLoading: membersLoading,
    refetch: refetchMembers,
  } = useQuery<HotelMember[]>({
    queryKey: ["super-admin", "hotel-members", id],
    queryFn: async () => {
      const data = await membersApi.fetchMembers({
        hotelId: id,
        includeDeleted: true,
      });
      return (data || []) as HotelMember[];
    },
    enabled: !!id,
  });

  // Filter out any GUEST accounts for staff tab & count
  const staffMembers = useMemo(() => {
    return members.filter((m) => m.role !== "GUEST");
  }, [members]);

  // Query Hotel Kiosks via useKiosks
  const {
    devices: kiosks = [],
    stats: kiosksStats = {
      total: 0,
      online: 0,
      offline: 0,
      maintenance: 0,
      disabled: 0,
    },
  } = useKiosks({ hotelId: id }) as {
    devices: KioskDevice[];
    stats: {
      total: number;
      online: number;
      offline: number;
      maintenance: number;
      disabled: number;
    };
  };

  function showToast(message: string, type: "success" | "error" = "success") {
    setToast({ message, type });
    setTimeout(() => {
      setToast({ message: "", type: "success" });
    }, 4000);
  }

  // Hotel Status Toggle Action
  async function handleToggleStatus() {
    if (!hotel) return;
    const nextStatus = hotel.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const action = nextStatus === "INACTIVE" ? "deactivate" : "reactivate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} "${hotel.name}"? This affects all staff logins.`,
    );
    if (!confirmed) return;

    try {
      await updateHotelStatusMutation.mutateAsync({
        id: hotel._id,
        status: nextStatus,
      });
      showToast(
        nextStatus === "INACTIVE"
          ? `${hotel.name} has been deactivated.`
          : `${hotel.name} has been reactivated.`,
      );
      refetchHotel();
    } catch (err: unknown) {
      console.error("Status update error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update status.";
      showToast(errorMessage, "error");
    }
  }

  // Resend Sub-Admin Invite Action
  function handleResendInvite() {
    showToast(
      `Sub-Admin invitation email resent for ${hotel?.name || "hotel"}.`,
    );
  }

  // Delete Member Action (Soft or Permanent)
  async function handleDeleteMemberConfirm() {
    if (!memberToDelete) return;
    const memberId = memberToDelete.id || memberToDelete._id;
    if (!memberId) return;

    try {
      setDeletingMember(true);
      await membersApi.deleteMember(memberId, {
        permanent: deletePermanent,
      });
      showToast(
        deletePermanent
          ? `${memberToDelete.name || "Member"} permanently deleted.`
          : `${memberToDelete.name || "Member"} soft-deleted successfully.`,
      );
      setMemberToDelete(null);
      refetchMembers();
    } catch (err: unknown) {
      console.error("Delete member error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete account.";
      showToast(errorMessage, "error");
    } finally {
      setDeletingMember(false);
    }
  }

  // Restore Member Action
  async function handleRestoreMember(
    member: HotelMember,
    newUsername?: string,
  ) {
    const memberId = member.id || member._id;
    if (!memberId) return;

    try {
      setRestoringMember(true);
      await membersApi.restoreMember(memberId, {
        newUsername: newUsername || undefined,
      });
      showToast(`${member.name || "Member"} restored successfully.`);
      setRestoreConflictMember(null);
      refetchMembers();
    } catch (err: unknown) {
      console.error("Restore member error:", err);
      const apiErr = err as ApiErrorShape;
      if (
        apiErr?.status === 409 ||
        apiErr?.errorCode === "USERNAME_TAKEN" ||
        apiErr?.message?.includes("already taken") ||
        apiErr?.message?.includes("already in use")
      ) {
        setRestoreConflictMember(member);
      } else {
        showToast(apiErr?.message || "Failed to restore account.", "error");
      }
    } finally {
      setRestoringMember(false);
    }
  }

  if (hotelLoading) {
    return (
      <div className="bg-surface-50 text-brand-600 flex min-h-screen items-center justify-center">
        Loading hotel details...
      </div>
    );
  }

  if (hotelError || !hotel) {
    return (
      <div className="bg-surface-50 flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <Building2 size={48} className="text-brand-400 mb-4" />
        <h2 className="font-display text-brand-900 text-xl font-bold">
          Hotel Not Found
        </h2>
        <p className="text-brand-600 mt-1 text-sm">
          The requested hotel does not exist or you do not have permission to
          view it.
        </p>
        <Link
          to="/hotels"
          className="bg-primary-600 hover:bg-primary-700 mt-5 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-2xs"
        >
          <ArrowLeft size={16} />
          Back to Hotels
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-background-50 min-h-screen">
      {/* BREADCRUMB & HEADER */}
      <Header
        pageTitle={hotel.name}
        pageDescription={`${hotel.city ? `${hotel.city}, ` : ""}${hotel.state || "India"} · Code: ${hotel.hotelCode || "—"}`}
      >
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/hotels"
            className="border-surface-200 text-brand-700 hover:bg-background-50 inline-flex items-center gap-1.5 rounded-lg border bg-white px-3 py-2 text-xs font-semibold shadow-2xs transition-all"
          >
            <ArrowLeft size={14} />
            Hotels
          </Link>

          {/* HEADER ACTIONS */}
          <Button variant="secondary" icon={Mail} onClick={handleResendInvite}>
            Resend Invite
          </Button>

          <Button
            variant={hotel.status === "ACTIVE" ? "danger" : "secondary"}
            icon={Power}
            onClick={handleToggleStatus}
          >
            {hotel.status === "ACTIVE"
              ? "Deactivate Hotel"
              : "Reactivate Hotel"}
          </Button>
        </div>
      </Header>

      <main className="px-6 py-8 lg:px-10">
        {/* TOAST MESSAGE */}
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

        {/* HOTEL HERO OVERVIEW CARD */}
        <HotelHeroCard hotel={hotel} />

        {/* CATEGORIZED MANAGEMENT TABS */}
        <div className="border-surface-200 mb-6 flex border-b">
          <button
            type="button"
            onClick={() => setActiveTab("members")}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-all ${
              activeTab === "members"
                ? "border-primary-600 text-primary-700"
                : "text-brand-600 hover:text-brand-900 border-transparent"
            }`}
          >
            <Users size={16} />
            Staff & Members ({staffMembers.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-all ${
              activeTab === "profile"
                ? "border-primary-600 text-primary-700"
                : "text-brand-600 hover:text-brand-900 border-transparent"
            }`}
          >
            <Building2 size={16} />
            Profile & Operations
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("subscription")}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-all ${
              activeTab === "subscription"
                ? "border-primary-600 text-primary-700"
                : "text-brand-600 hover:text-brand-900 border-transparent"
            }`}
          >
            <Calendar size={16} />
            Subscription & Billing
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("kiosks")}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-all ${
              activeTab === "kiosks"
                ? "border-primary-600 text-primary-700"
                : "text-brand-600 hover:text-brand-900 border-transparent"
            }`}
          >
            <Monitor size={16} />
            Kiosks & Hardware ({kiosksStats?.total || kiosks.length})
          </button>
        </div>

        {/* TAB CONTENTS */}
        {activeTab === "members" && (
          <HotelMembersTab
            members={staffMembers}
            loading={membersLoading}
            onAddMember={() => {
              setSelectedMemberForEdit(null);
              setMemberModalOpen(true);
            }}
            onEditMember={(member) => {
              setSelectedMemberForEdit(member);
              setMemberModalOpen(true);
            }}
            onDeleteMember={(member, permanent) => {
              setMemberToDelete(member);
              setDeletePermanent(permanent);
            }}
            onRestoreMember={(member) => {
              handleRestoreMember(member);
            }}
          />
        )}

        {activeTab === "profile" && (
          <HotelProfileTab
            hotel={hotel}
            onEditSection={(section) => setActiveEditSection(section)}
          />
        )}

        {activeTab === "subscription" && (
          <HotelSubscriptionTab
            hotel={hotel}
            onEditSection={(section) => setActiveEditSection(section)}
          />
        )}

        {activeTab === "kiosks" && (
          <HotelKiosksTab hotelId={hotel._id} hotelName={hotel.name} />
        )}
      </main>

      {/* PER-SECTION EDIT HOTEL MODAL */}
      {activeEditSection && (
        <EditHotelSectionModal
          open={Boolean(activeEditSection)}
          section={activeEditSection}
          hotel={hotel}
          onClose={() => setActiveEditSection(null)}
          onSaved={() => {
            showToast("Hotel updated successfully.");
            refetchHotel();
          }}
        />
      )}

      {/* ADD / EDIT HOTEL MEMBER MODAL */}
      <HotelMemberFormModal
        open={memberModalOpen}
        hotelId={id || ""}
        member={selectedMemberForEdit}
        onClose={() => {
          setMemberModalOpen(false);
          setSelectedMemberForEdit(null);
        }}
        onSaved={(msg) => {
          showToast(msg);
          refetchMembers();
        }}
      />

      {/* RESTORE WITH NEW USERNAME MODAL (CONFLICT RESOLUTION) */}
      {restoreConflictMember && (
        <RestoreMemberModal
          open={!!restoreConflictMember}
          member={restoreConflictMember}
          onClose={() => setRestoreConflictMember(null)}
          onConfirm={(newUsername) =>
            handleRestoreMember(restoreConflictMember, newUsername)
          }
          loading={restoringMember}
        />
      )}

      {/* DELETE CONFIRM DIALOG */}
      <ConfirmDialog
        open={!!memberToDelete}
        onClose={() => {
          setMemberToDelete(null);
          setDeletePermanent(false);
        }}
        title={
          deletePermanent
            ? "Permanently Delete Member?"
            : "Delete Member Account?"
        }
        message={
          deletePermanent ? (
            <>
              Are you sure you want to <strong>permanently delete</strong> the
              account for{" "}
              <strong>
                {memberToDelete?.name || memberToDelete?.username}
              </strong>
              ? This action completely purges the user from the database and
              cannot be undone.
            </>
          ) : (
            <>
              Are you sure you want to delete the account for{" "}
              <strong>
                {memberToDelete?.name || memberToDelete?.username}
              </strong>
              ? They will lose dashboard access, but you can restore them later.
            </>
          )
        }
        confirmLabel={deletePermanent ? "Permanent Delete" : "Delete Member"}
        cancelLabel="Cancel"
        tone="danger"
        loading={deletingMember}
        onConfirm={handleDeleteMemberConfirm}
      />
    </div>
  );
};

export default HotelDetailsPage;
