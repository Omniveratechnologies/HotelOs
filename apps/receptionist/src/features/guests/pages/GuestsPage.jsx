import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  Header,
  KpiTile,
  KpiTileRow,
  FilterBar,
  EmptyState,
} from "@hotelos/ui/components";
import {
  Users,
  UserCheck,
  Award,
  AlertCircle,
  Plus,
  Eye,
  Edit2,
  Trash2,
  RotateCcw,
  CalendarPlus,
  ShieldAlert,
} from "lucide-react";
import {
  useGuestDirectory,
  useSoftDeleteGuest,
  useRestoreGuest,
} from "../hooks/useGuests.js";
import GuestDetailsModal from "../components/GuestDetailsModal.jsx";
import EditGuestModal from "../components/EditGuestModal.jsx";

const avatarColors = [
  "bg-blue-600",
  "bg-indigo-600",
  "bg-violet-600",
  "bg-emerald-600",
  "bg-amber-600",
  "bg-rose-600",
];

const STATUS_SELECT_OPTIONS = [
  { value: "ALL", label: "All Statuses" },
  { value: "ACTIVE", label: "Active Profiles" },
  { value: "INACTIVE", label: "Soft Deleted" },
];

const FREQUENCY_SELECT_OPTIONS = [
  { value: "ALL", label: "All Stays" },
  { value: "REPEAT", label: "Repeat (2+ stays)" },
  { value: "VIP", label: "VIP (3+ stays)" },
  { value: "FIRST_TIME", label: "First-time (1 stay)" },
  { value: "ZERO_STAYS", label: "No Stays Recorded (0)" },
];

const COMPLETENESS_SELECT_OPTIONS = [
  { value: "ALL", label: "All Profiles" },
  { value: "COMPLETE", label: "Complete (Name, Phone, ID)" },
  { value: "INCOMPLETE", label: "Incomplete Profiles" },
];

export default function GuestsPage() {
  const navigate = useNavigate();

  // Search and Filter state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [frequencyFilter, setFrequencyFilter] = useState("ALL");
  const [completenessFilter, setCompletenessFilter] = useState("ALL");

  // Selection & modal state
  const [viewingGuest, setViewingGuest] = useState(null);
  const [editingGuest, setEditingGuest] = useState(null);
  const [deletingGuest, setDeletingGuest] = useState(null);
  const [actionError, setActionError] = useState("");

  // Data fetching
  const {
    guests = [],
    isLoading,
    error: loadError,
    refetch,
  } = useGuestDirectory({
    status: statusFilter === "ALL" ? "all" : statusFilter.toLowerCase(),
  });

  const softDeleteMutation = useSoftDeleteGuest();
  const restoreMutation = useRestoreGuest();

  // Ensure viewingGuest remains current with fresh query data
  const activeViewingGuest = useMemo(() => {
    if (!viewingGuest) return null;
    const vId = viewingGuest.id || viewingGuest._id || viewingGuest.guestId;
    return (
      guests.find((g) => (g.id || g._id || g.guestId) === vId) || viewingGuest
    );
  }, [viewingGuest, guests]);

  // Overall KPI stats
  const stats = useMemo(() => {
    const total = guests.length;
    let active = 0;
    let repeat = 0;
    let incomplete = 0;

    for (const g of guests) {
      if (g.isActive !== false) active += 1;
      const stayCount =
        typeof g.totalStays === "number" ? g.totalStays : g.stays?.length || 0;
      if (stayCount >= 2) repeat += 1;
      const isComplete = Boolean(
        g.name &&
        g.phone &&
        (g.idNumber || (g.documents && g.documents.length > 0)),
      );
      if (!isComplete) incomplete += 1;
    }

    return { total, active, repeat, incomplete };
  }, [guests]);

  // Filtered guest list strictly based on guest metadata and stay count
  const filteredGuests = useMemo(() => {
    const query = search.trim().toLowerCase();

    return guests.filter((g) => {
      // 1. Status Filter
      if (statusFilter === "ACTIVE" && g.isActive === false) return false;
      if (statusFilter === "INACTIVE" && g.isActive !== false) return false;

      // 2. Stay Frequency Filter
      const stayCount =
        typeof g.totalStays === "number" ? g.totalStays : g.stays?.length || 0;
      if (frequencyFilter === "REPEAT" && stayCount < 2) return false;
      if (frequencyFilter === "VIP" && stayCount < 3) return false;
      if (frequencyFilter === "FIRST_TIME" && stayCount !== 1) return false;
      if (frequencyFilter === "ZERO_STAYS" && stayCount !== 0) return false;

      // 3. Completeness Filter
      const isComplete = Boolean(
        g.name &&
        g.phone &&
        (g.idNumber || (g.documents && g.documents.length > 0)),
      );
      if (completenessFilter === "COMPLETE" && !isComplete) return false;
      if (completenessFilter === "INCOMPLETE" && isComplete) return false;

      // 4. Text Search (name, phone, email, idNumber, address, nationality)
      if (query) {
        const matchesName = (g.name || "").toLowerCase().includes(query);
        const matchesPhone = (g.phone || "").toLowerCase().includes(query);
        const matchesEmail = (g.email || "").toLowerCase().includes(query);
        const matchesId = (g.idNumber || "").toLowerCase().includes(query);
        const matchesAddress = (g.address || "").toLowerCase().includes(query);
        const matchesNationality = (g.nationality || "")
          .toLowerCase()
          .includes(query);
        const matchesUsername = (g.username || "")
          .toLowerCase()
          .includes(query);

        if (
          !matchesName &&
          !matchesPhone &&
          !matchesEmail &&
          !matchesId &&
          !matchesAddress &&
          !matchesNationality &&
          !matchesUsername
        ) {
          return false;
        }
      }

      return true;
    });
  }, [guests, search, statusFilter, frequencyFilter, completenessFilter]);

  // Soft Delete Handler
  const handleConfirmDelete = async () => {
    if (!deletingGuest) return;
    setActionError("");
    const targetId =
      deletingGuest.id || deletingGuest._id || deletingGuest.guestId;

    try {
      await softDeleteMutation.mutateAsync(targetId);
      if (
        viewingGuest &&
        (viewingGuest.id || viewingGuest._id || viewingGuest.guestId) ===
          targetId
      ) {
        setViewingGuest((prev) => (prev ? { ...prev, isActive: false } : null));
      }
      setDeletingGuest(null);
    } catch (err) {
      console.error("Failed to soft-delete guest:", err);
      setActionError(
        err.message ||
          "Failed to soft delete guest profile. Active checked-in stays must be checked out first.",
      );
    }
  };

  // Restore Handler
  const handleRestore = async (g, e) => {
    if (e) e.stopPropagation();
    setActionError("");
    const targetId = g.id || g._id || g.guestId;

    try {
      await restoreMutation.mutateAsync(targetId);
      if (
        viewingGuest &&
        (viewingGuest.id || viewingGuest._id || viewingGuest.guestId) ===
          targetId
      ) {
        setViewingGuest((prev) => (prev ? { ...prev, isActive: true } : null));
      }
    } catch (err) {
      console.error("Failed to restore guest:", err);
      setActionError(err.message || "Failed to restore guest profile.");
    }
  };

  // Pre-fill Repeat Guest Booking Navigation
  const handleNewReservation = (guestItem, e) => {
    if (e) e.stopPropagation();
    const gId = guestItem.id || guestItem._id || guestItem.guestId;
    const phone = guestItem.phone ? encodeURIComponent(guestItem.phone) : "";
    navigate(`/reservations/repeat/new?guestId=${gId}&phone=${phone}`);
  };

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setFrequencyFilter("ALL");
    setCompletenessFilter("ALL");
  };

  return (
    <>
      <Header
        pageTitle="Guest Directory"
        pageDescription={`${stats.total} guest profiles registered • ${stats.repeat} repeat guests`}
      >
        <button
          onClick={() => navigate("/reservations/repeat/new")}
          className="bg-brand-900 hover:bg-brand-800 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors"
        >
          <Plus size={16} />
          <span>New Reservation</span>
        </button>
      </Header>

      <div className="space-y-6 p-6">
        {/* KPI Tiles Row */}
        <KpiTileRow>
          <KpiTile
            icon={Users}
            iconClassName="bg-blue-50 text-blue-700"
            label="Total Profiles"
            value={stats.total}
            delta={`${stats.total} lifetime profiles`}
            active={
              statusFilter === "ALL" &&
              frequencyFilter === "ALL" &&
              completenessFilter === "ALL"
            }
            onClick={handleClearFilters}
          />
          <KpiTile
            icon={UserCheck}
            iconClassName="bg-emerald-50 text-emerald-700"
            label="Active Profiles"
            value={stats.active}
            delta={`${stats.total - stats.active} soft deleted`}
            active={statusFilter === "ACTIVE"}
            onClick={() => {
              setStatusFilter((prev) => (prev === "ACTIVE" ? "ALL" : "ACTIVE"));
            }}
          />
          <KpiTile
            icon={Award}
            iconClassName="bg-amber-50 text-amber-700"
            label="Repeat Guests"
            value={stats.repeat}
            delta="2+ historical stays"
            active={frequencyFilter === "REPEAT"}
            onClick={() => {
              setFrequencyFilter((prev) =>
                prev === "REPEAT" ? "ALL" : "REPEAT",
              );
            }}
          />
          <KpiTile
            icon={AlertCircle}
            iconClassName="bg-rose-50 text-rose-700"
            label="Incomplete Profiles"
            value={stats.incomplete}
            delta="Missing mandatory ID/phone"
            active={completenessFilter === "INCOMPLETE"}
            onClick={() => {
              setCompletenessFilter((prev) =>
                prev === "INCOMPLETE" ? "ALL" : "INCOMPLETE",
              );
            }}
          />
        </KpiTileRow>

        {/* Action / Error Banner */}
        {actionError && (
          <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="h-5 w-5 shrink-0 text-red-600" />
              <span>{actionError}</span>
            </div>
            <button
              onClick={() => setActionError("")}
              className="text-xs font-semibold underline hover:no-underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {loadError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Failed to load guests directory: {loadError}
          </div>
        )}

        {/* Filter Bar with Relative Filters */}
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by name, phone, email, ID number, address, nationality..."
          selects={[
            {
              key: "status",
              label: "Status",
              value: statusFilter,
              options: STATUS_SELECT_OPTIONS,
            },
            {
              key: "frequency",
              label: "Stay Frequency",
              value: frequencyFilter,
              options: FREQUENCY_SELECT_OPTIONS,
            },
            {
              key: "completeness",
              label: "Completeness",
              value: completenessFilter,
              options: COMPLETENESS_SELECT_OPTIONS,
            },
          ]}
          onSelectChange={(key, value) => {
            if (key === "status") setStatusFilter(value);
            if (key === "frequency") setFrequencyFilter(value);
            if (key === "completeness") setCompletenessFilter(value);
          }}
          onClear={handleClearFilters}
        />

        {/* Guest Directory Table (Strictly Guest Details + Total Stays) */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
          <div className="border-b border-gray-100 bg-gray-50/70 px-6 py-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
                Showing {filteredGuests.length} of {guests.length} Guests
              </span>
              <span className="text-xs text-gray-400">
                Click any row to open full profile & stay history
              </span>
            </div>
          </div>

          {isLoading ? (
            <div className="py-20 text-center text-sm text-gray-400">
              Loading guest directory...
            </div>
          ) : filteredGuests.length === 0 ? (
            <EmptyState
              title="No Guests Found"
              description="No guest profiles match the selected filters or search terms."
              actionLabel="Reset All Filters"
              onAction={handleClearFilters}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50 text-[11px] font-bold tracking-wider text-gray-500 uppercase">
                    <th className="px-6 py-3.5">Guest Profile</th>
                    <th className="px-4 py-3.5">Contact Details</th>
                    <th className="px-4 py-3.5">Identity / Documents</th>
                    <th className="px-4 py-3.5">Location</th>
                    <th className="px-4 py-3.5 text-center">Total Stays</th>
                    <th className="px-4 py-3.5 text-center">Profile Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {filteredGuests.map((guest, idx) => {
                    const guestId = guest.id || guest._id || guest.guestId;
                    const totalStays =
                      typeof guest.totalStays === "number"
                        ? guest.totalStays
                        : guest.stays?.length || 0;
                    const isVip = totalStays >= 3;
                    const isRepeat = totalStays >= 2;
                    const isDeleted = guest.isActive === false;
                    const isComplete = Boolean(
                      guest.name &&
                      guest.phone &&
                      (guest.idNumber ||
                        (guest.documents && guest.documents.length > 0)),
                    );

                    return (
                      <tr
                        key={guestId || idx}
                        onClick={() => setViewingGuest(guest)}
                        className={`group cursor-pointer transition-colors ${
                          isDeleted
                            ? "bg-gray-50/60 opacity-70 hover:bg-gray-100/60"
                            : "hover:bg-blue-50/40"
                        }`}
                      >
                        {/* Guest Profile (Avatar, Name, Username) */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-white shadow-2xs ${
                                avatarColors[idx % avatarColors.length]
                              }`}
                            >
                              {guest.name
                                ? guest.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .substring(0, 2)
                                    .toUpperCase()
                                : "?"}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-brand-900 font-semibold tracking-tight">
                                  {guest.name || "Unnamed Guest"}
                                </span>
                                {isVip && (
                                  <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                                    VIP
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-400">
                                {guest.username
                                  ? `@${guest.username}`
                                  : guestId
                                    ? `ID: ${String(guestId).slice(-6)}`
                                    : "—"}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Contact Details */}
                        <td className="px-4 py-4">
                          <div className="space-y-0.5 text-xs">
                            <div className="font-medium text-gray-700">
                              {guest.phone || (
                                <span className="text-gray-400 italic">
                                  No phone
                                </span>
                              )}
                            </div>
                            <div className="truncate text-gray-400">
                              {guest.email || (
                                <span className="text-gray-300 italic">
                                  No email
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Identity / Documents */}
                        <td className="px-4 py-4">
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-gray-700">
                                {guest.idType || "ID"}
                              </span>
                              <span className="text-gray-500">
                                {guest.idNumber || "—"}
                              </span>
                            </div>
                            {guest.documents?.length > 0 ? (
                              <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                                📎 {guest.documents.length} document
                                {guest.documents.length > 1 ? "s" : ""}
                              </span>
                            ) : (
                              <span className="text-[11px] text-gray-300 italic">
                                No documents
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Location */}
                        <td className="px-4 py-4">
                          <div className="space-y-0.5 text-xs text-gray-600">
                            <div>{guest.nationality || "—"}</div>
                            <div
                              className="max-w-[180px] truncate text-gray-400"
                              title={guest.address}
                            >
                              {guest.address || "—"}
                            </div>
                          </div>
                        </td>

                        {/* Total Stays Count */}
                        <td className="px-4 py-4 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                totalStays >= 3
                                  ? "bg-amber-100 text-amber-800"
                                  : totalStays >= 2
                                    ? "bg-blue-100 text-blue-800"
                                    : totalStays === 1
                                      ? "bg-gray-100 text-gray-700"
                                      : "bg-gray-100 text-gray-400"
                              }`}
                            >
                              {totalStays} {totalStays === 1 ? "Stay" : "Stays"}
                            </span>
                            {isRepeat && (
                              <span className="mt-0.5 text-[10px] font-medium text-blue-600">
                                Returning
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Profile Status */}
                        <td className="px-4 py-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            {isDeleted ? (
                              <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700">
                                Soft Deleted
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                                Active Profile
                              </span>
                            )}
                            <span
                              className={`text-[10px] font-medium ${
                                isComplete ? "text-gray-400" : "text-amber-600"
                              }`}
                            >
                              {isComplete
                                ? "Profile Complete"
                                : "Incomplete Info"}
                            </span>
                          </div>
                        </td>

                        {/* Row Actions */}
                        <td className="px-6 py-4 text-right">
                          <div
                            className="flex items-center justify-end gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* View / Open details */}
                            <button
                              onClick={() => setViewingGuest(guest)}
                              title="View Guest Details & Stays"
                              className="rounded-lg border border-gray-200 p-1.5 text-gray-600 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:text-gray-900"
                            >
                              <Eye size={14} />
                            </button>

                            {/* Edit guest details */}
                            <button
                              onClick={() => setEditingGuest(guest)}
                              title="Edit Guest Details"
                              className="rounded-lg border border-gray-200 p-1.5 text-gray-600 transition-colors hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700"
                            >
                              <Edit2 size={14} />
                            </button>

                            {/* Pre-fill Repeat Guest Booking */}
                            <button
                              onClick={(e) => handleNewReservation(guest, e)}
                              title="New Reservation for Guest"
                              className="text-brand-900 hover:border-brand-200 hover:bg-brand-50 rounded-lg border border-gray-200 p-1.5 transition-colors"
                            >
                              <CalendarPlus size={14} />
                            </button>

                            {/* Soft Delete or Restore */}
                            {isDeleted ? (
                              <button
                                onClick={(e) => handleRestore(guest, e)}
                                title="Restore Guest Profile"
                                className="rounded-lg border border-emerald-200 bg-emerald-50 p-1.5 text-emerald-700 transition-colors hover:bg-emerald-100"
                              >
                                <RotateCcw size={14} />
                              </button>
                            ) : (
                              <button
                                onClick={() => setDeletingGuest(guest)}
                                title="Soft Delete Guest Profile"
                                className="rounded-lg border border-gray-200 p-1.5 text-red-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Guest Details Modal (Includes Profile, Credentials, and All Stays List with detailed drilldown) */}
        {activeViewingGuest && (
          <GuestDetailsModal
            guest={activeViewingGuest}
            onClose={() => setViewingGuest(null)}
            onEdit={() => {
              setEditingGuest(activeViewingGuest);
            }}
            onRefresh={refetch}
          />
        )}

        {/* Edit Guest Profile Modal */}
        {editingGuest && (
          <EditGuestModal
            guest={editingGuest}
            onClose={() => setEditingGuest(null)}
            onSaved={() => {
              setEditingGuest(null);
              refetch();
            }}
          />
        )}

        {/* Soft Delete Confirmation Modal */}
        {deletingGuest && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
            onClick={() =>
              !softDeleteMutation.isPending && setDeletingGuest(null)
            }
          >
            <div
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
                  <Trash2 size={20} />
                </div>
                <div>
                  <h3 className="text-brand-900 text-lg font-bold">
                    Soft Delete Guest Profile?
                  </h3>
                  <p className="text-xs text-gray-500">
                    Profile can be restored at any time
                  </p>
                </div>
              </div>

              <p className="mb-2 text-sm text-gray-600">
                Are you sure you want to deactivate{" "}
                <strong>{deletingGuest.name || "this guest"}</strong>?
              </p>
              <p className="mb-6 text-xs text-gray-500">
                Their stay history and records will remain preserved. If the
                guest currently has an active checked-in stay, soft deletion
                will be safely prevented until check-out.
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setDeletingGuest(null)}
                  disabled={softDeleteMutation.isPending}
                  className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={softDeleteMutation.isPending}
                  className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {softDeleteMutation.isPending
                    ? "Deactivating..."
                    : "Confirm Deactivation"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
