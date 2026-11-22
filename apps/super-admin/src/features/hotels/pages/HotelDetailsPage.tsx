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
import { staffApi } from "@hotelos/api";
import { EditHotelSectionModal } from "../components/EditHotelSectionModal.tsx";
import { HotelHeroCard } from "../components/HotelHeroCard.tsx";
import { HotelStaffTab } from "../components/HotelStaffTab.tsx";
import { HotelProfileTab } from "../components/HotelProfileTab.tsx";
import { HotelSubscriptionTab } from "../components/HotelSubscriptionTab.tsx";
import { HotelKiosksTab } from "../components/HotelKiosksTab.tsx";
import { HotelStaffFormModal } from "../components/HotelStaffFormModal.tsx";
import { RestoreStaffModal } from "../components/RestoreStaffModal.tsx";
import { useHotel, useUpdateHotelStatus } from "../hooks/useHotels.js";
import { useKiosks } from "../hooks/useKiosks.ts";
import type {
  Hotel,
  HotelStaffMember,
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
  const [activeTab, setActiveTab] = useState<HotelDetailsTab>("staff");

  // Modals state
  const [activeEditSection, setActiveEditSection] =
    useState<HotelEditSection | null>(null);
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [selectedStaffForEdit, setSelectedStaffForEdit] =
    useState<HotelStaffMember | null>(null);
  const [restoreConflictStaff, setRestoreConflictStaff] =
    useState<HotelStaffMember | null>(null);
  const [staffToDelete, setStaffToDelete] = useState<HotelStaffMember | null>(
    null,
  );
  const [deletePermanent, setDeletePermanent] = useState(false);
  const [deletingStaff, setDeletingStaff] = useState(false);
  const [restoringStaff, setRestoringStaff] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  }>({
    message: "",
    type: "success",
  });

  // Query Hotel Staff
  const {
    data: staff = [],
    isLoading: staffLoading,
    refetch: refetchStaff,
  } = useQuery<HotelStaffMember[]>({
    queryKey: ["super-admin", "hotel-staff", id],
    queryFn: async () => {
      const data = await staffApi.fetchStaff({
        hotelId: id,
        includeDeleted: true,
      });
      return (data || []) as HotelStaffMember[];
    },
    enabled: !!id,
  });

  // Filter out any GUEST accounts for staff tab & count
  const hotelStaff = useMemo(() => {
    return staff.filter((s) => s.role !== "GUEST");
  }, [staff]);

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

  // Delete Staff Action (Soft or Permanent)
  async function handleDeleteStaffConfirm() {
    if (!staffToDelete) return;
    const staffId = staffToDelete.id || staffToDelete._id;
    if (!staffId) return;

    try {
      setDeletingStaff(true);
      await staffApi.deleteStaff(staffId, {
        permanent: deletePermanent,
      });
      showToast(
        deletePermanent
          ? `${staffToDelete.name || "Staff"} permanently deleted.`
          : `${staffToDelete.name || "Staff"} soft-deleted successfully.`,
      );
      setStaffToDelete(null);
      refetchStaff();
    } catch (err: unknown) {
      console.error("Delete staff error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete account.";
      showToast(errorMessage, "error");
    } finally {
      setDeletingStaff(false);
    }
  }

  // Restore Staff Action
  async function handleRestoreStaff(
    staffItem: HotelStaffMember,
    newUsername?: string,
  ) {
    const staffId = staffItem.id || staffItem._id;
    if (!staffId) return;

    try {
      setRestoringStaff(true);
      await staffApi.restoreStaff(staffId, {
        newUsername: newUsername || undefined,
      });
      showToast(`${staffItem.name || "Staff"} restored successfully.`);
      setRestoreConflictStaff(null);
      refetchStaff();
    } catch (err: unknown) {
      console.error("Restore staff error:", err);
      const apiErr = err as ApiErrorShape;
      if (
        apiErr?.status === 409 ||
        apiErr?.errorCode === "USERNAME_TAKEN" ||
        apiErr?.message?.includes("already taken") ||
        apiErr?.message?.includes("already in use")
      ) {
        setRestoreConflictStaff(staffItem);
      } else {
        showToast(apiErr?.message || "Failed to restore account.", "error");
      }
    } finally {
      setRestoringStaff(false);
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
            onClick={() => setActiveTab("staff")}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-all ${
              activeTab === "staff"
                ? "border-primary-600 text-primary-700"
                : "text-brand-600 hover:text-brand-900 border-transparent"
            }`}
          >
            <Users size={16} />
            Staff & Admins ({hotelStaff.length})
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
        {activeTab === "staff" && (
          <HotelStaffTab
            staff={hotelStaff}
            loading={staffLoading}
            onAddStaff={() => {
              setSelectedStaffForEdit(null);
              setStaffModalOpen(true);
            }}
            onEditStaff={(item) => {
              setSelectedStaffForEdit(item);
              setStaffModalOpen(true);
            }}
            onDeleteStaff={(item, permanent) => {
              setStaffToDelete(item);
              setDeletePermanent(permanent);
            }}
            onRestoreStaff={(item) => {
              handleRestoreStaff(item);
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

      {/* ADD / EDIT HOTEL STAFF & ADMIN MODAL */}
      <HotelStaffFormModal
        open={staffModalOpen}
        hotelId={id || ""}
        staff={selectedStaffForEdit}
        onClose={() => {
          setStaffModalOpen(false);
          setSelectedStaffForEdit(null);
        }}
        onSaved={(msg) => {
          showToast(msg);
          refetchStaff();
        }}
      />

      {/* RESTORE WITH NEW USERNAME MODAL (CONFLICT RESOLUTION) */}
      {restoreConflictStaff && (
        <RestoreStaffModal
          open={!!restoreConflictStaff}
          staff={restoreConflictStaff}
          onClose={() => setRestoreConflictStaff(null)}
          onConfirm={(newUsername) =>
            handleRestoreStaff(restoreConflictStaff, newUsername)
          }
          loading={restoringStaff}
        />
      )}

      {/* DELETE CONFIRM DIALOG */}
      <ConfirmDialog
        open={!!staffToDelete}
        onClose={() => {
          setStaffToDelete(null);
          setDeletePermanent(false);
        }}
        title={
          deletePermanent
            ? "Permanently Delete Staff / Admin Account?"
            : "Delete Staff / Admin Account?"
        }
        message={
          deletePermanent ? (
            <>
              Are you sure you want to <strong>permanently delete</strong> the
              account for{" "}
              <strong>{staffToDelete?.name || staffToDelete?.username}</strong>?
              This action completely purges the user from the database and
              cannot be undone.
            </>
          ) : (
            <>
              Are you sure you want to delete the account for{" "}
              <strong>{staffToDelete?.name || staffToDelete?.username}</strong>?
              They will lose dashboard access, but you can restore them later.
            </>
          )
        }
        confirmLabel={deletePermanent ? "Permanent Delete" : "Delete Account"}
        cancelLabel="Cancel"
        tone="danger"
        loading={deletingStaff}
        onConfirm={handleDeleteStaffConfirm}
      />
    </div>
  );
};

export default HotelDetailsPage;
