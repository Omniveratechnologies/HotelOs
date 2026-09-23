import { useState } from "react";
import { Header } from "@hotelos/ui/components/Header";
import Button from "../../../components/ui/Button.jsx";
import {
  useReservations,
  useUpdateReservation,
  useDeleteReservation,
} from "../hooks/useReservations.js";
import NewReservationModal from "../components/NewReservationModal.jsx";
import ReservationDetailsModal from "../components/ReservationDetailsModal.jsx";
import EditReservationModal from "../components/EditReservationModal.jsx";

const statusBadges = {
  "checked-in": "bg-emerald-50 text-emerald-700 border-emerald-200",
  reserved: "bg-amber-50 text-amber-700 border-amber-200",
  "checked-out": "bg-gray-100 text-gray-700 border-gray-200",
};

export default function ReservationsPage() {
  const {
    reservations = [],
    isLoading: loading,
    error: loadError,
    refetch,
  } = useReservations();

  const updateReservationMut = useUpdateReservation();
  const deleteReservationMut = useDeleteReservation();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const [newModalOpen, setNewModalOpen] = useState(false);
  const [viewingReservation, setViewingReservation] = useState(null);
  const [editingReservation, setEditingReservation] = useState(null);
  const [deletingReservation, setDeletingReservation] = useState(null);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  const filtered = reservations.filter((r) => {
    if (filter !== "all" && r.status !== filter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const matchName = r.name?.toLowerCase().includes(q);
      const matchRoom = r.roomNumber?.toLowerCase().includes(q);
      const matchPhone = r.phone?.toLowerCase().includes(q);
      const matchEmail = r.email?.toLowerCase().includes(q);
      const matchRef = r.id?.toLowerCase().includes(q);
      if (!matchName && !matchRoom && !matchPhone && !matchEmail && !matchRef) {
        return false;
      }
    }
    return true;
  });

  const totalCount = reservations.length;
  const reservedCount = reservations.filter(
    (r) => r.status === "reserved",
  ).length;
  const inHouseCount = reservations.filter(
    (r) => r.status === "checked-in",
  ).length;
  const completedCount = reservations.filter(
    (r) => r.status === "checked-out",
  ).length;

  const handleQuickCheckIn = async (reservation) => {
    setActionError("");
    setActionSuccess("");
    try {
      await updateReservationMut.mutateAsync({
        id: reservation.id,
        updates: { status: "checked-in" },
      });
      setActionSuccess(
        `Checked in ${reservation.name} to Room ${reservation.roomNumber || ""}.`,
      );
    } catch (err) {
      console.error("Check-in error:", err);
      setActionError(err.message || "Failed to check in guest.");
    }
  };

  const handleQuickCheckOut = async (reservation) => {
    setActionError("");
    setActionSuccess("");
    try {
      await updateReservationMut.mutateAsync({
        id: reservation.id,
        updates: { status: "checked-out" },
      });
      setActionSuccess(
        `Checked out ${reservation.name}. Room freed for cleaning.`,
      );
    } catch (err) {
      console.error("Check-out error:", err);
      setActionError(err.message || "Failed to check out guest.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingReservation) return;
    setActionError("");
    setActionSuccess("");
    try {
      await deleteReservationMut.mutateAsync(deletingReservation.id);
      setActionSuccess(
        `Reservation for ${deletingReservation.name} was removed.`,
      );
      setDeletingReservation(null);
    } catch (err) {
      console.error("Delete reservation error:", err);
      setActionError(err.message || "Failed to delete reservation.");
    }
  };

  return (
    <div className="bg-background-50 flex min-w-0 flex-1 flex-col">
      <Header
        pageTitle="Reservations"
        pageDescription="Manage room bookings, guest check-ins, stays, and channels."
      >
        <Button
          variant="primary"
          onClick={() => setNewModalOpen(true)}
          className="shrink-0"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 5v14M5 12h14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          New Reservation
        </Button>
      </Header>

      <div className="p-6 lg:p-8">
        {/* KPI Stats */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-xs">
            <span className="text-xs font-medium text-gray-500">
              Total Bookings
            </span>
            <div className="text-brand-900 mt-1 text-2xl font-bold">
              {totalCount}
            </div>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-xs">
            <span className="text-xs font-medium text-amber-600">
              Upcoming (Reserved)
            </span>
            <div className="mt-1 text-2xl font-bold text-amber-700">
              {reservedCount}
            </div>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-xs">
            <span className="text-xs font-medium text-emerald-600">
              Currently In-House
            </span>
            <div className="mt-1 text-2xl font-bold text-emerald-700">
              {inHouseCount}
            </div>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-xs">
            <span className="text-xs font-medium text-gray-500">
              Completed Stays
            </span>
            <div className="mt-1 text-2xl font-bold text-gray-700">
              {completedCount}
            </div>
          </div>
        </div>

        {/* Action Notifications */}
        {actionSuccess && (
          <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {actionSuccess}
          </div>
        )}
        {actionError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {actionError}
          </div>
        )}
        {loadError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {loadError}
          </div>
        )}

        {/* Search & Status Filters */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="relative max-w-md min-w-[240px] flex-1">
            <input
              type="text"
              placeholder="Search by guest, room, or ref ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-brand-900 focus:border-primary-400 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm placeholder:text-gray-400 focus:outline-hidden"
            />
          </div>

          <div className="flex rounded-xl bg-gray-100 p-1">
            {[
              { id: "all", label: "All" },
              { id: "reserved", label: "Reserved" },
              { id: "checked-in", label: "Checked In" },
              { id: "checked-out", label: "Checked Out" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                  filter === tab.id
                    ? "text-brand-900 bg-white shadow-xs"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs">
          {loading ? (
            <div className="py-20 text-center text-sm text-gray-400">
              Loading reservations...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center">
              <div className="text-gray-400">No reservations found.</div>
              <button
                onClick={() => setNewModalOpen(true)}
                className="text-primary-500 hover:text-primary-600 mt-2 text-sm font-semibold"
              >
                + Create the first reservation
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-xs font-semibold tracking-wider text-gray-500 uppercase">
                    <th className="px-5 py-3.5">Ref ID</th>
                    <th className="px-5 py-3.5">Guest</th>
                    <th className="px-5 py-3.5">Room</th>
                    <th className="px-5 py-3.5">Stay Dates</th>
                    <th className="px-5 py-3.5">Nights</th>
                    <th className="px-5 py-3.5">Channel</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((res) => (
                    <tr
                      key={res.id}
                      className="transition-colors hover:bg-gray-50/70"
                    >
                      <td className="px-5 py-3.5 font-mono text-xs font-semibold text-gray-500">
                        {String(res.id).slice(-6).toUpperCase()}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="text-brand-900 font-semibold">
                          {res.name}
                        </div>
                        <div className="text-xs text-gray-400">
                          {res.phone || res.email || "No contact"}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {res.roomNumber ? (
                          <div>
                            <span className="text-brand-900 font-bold">
                              Room {res.roomNumber}
                            </span>
                            {res.roomType && (
                              <span className="ml-1.5 rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600">
                                {res.roomType}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-amber-600">
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-600">
                        <div>In: {res.checkIn || "—"}</div>
                        <div>Out: {res.checkOut || "—"}</div>
                      </td>
                      <td className="text-brand-900 px-5 py-3.5 text-xs font-medium">
                        {res.nights ? `${res.nights}n` : "—"}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                          {res.channel || "DIRECT"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase ${
                            statusBadges[res.status] ||
                            "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {res.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {res.status === "reserved" && (
                            <button
                              onClick={() => handleQuickCheckIn(res)}
                              className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                            >
                              Check In
                            </button>
                          )}
                          {res.status === "checked-in" && (
                            <button
                              onClick={() => handleQuickCheckOut(res)}
                              className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
                            >
                              Check Out
                            </button>
                          )}
                          <button
                            onClick={() => setViewingReservation(res)}
                            className="text-brand-900 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium transition hover:bg-gray-100"
                          >
                            View
                          </button>
                          <button
                            onClick={() => setEditingReservation(res)}
                            className="text-primary-600 hover:bg-primary-50 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeletingReservation(res)}
                            className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50"
                          >
                            Cancel
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
      </div>

      {/* Modals */}
      <NewReservationModal
        open={newModalOpen}
        onClose={() => setNewModalOpen(false)}
        onCreated={() => {
          refetch();
          setActionSuccess("New reservation created successfully.");
        }}
      />

      <ReservationDetailsModal
        open={!!viewingReservation}
        onClose={() => setViewingReservation(null)}
        reservation={viewingReservation}
        onCheckIn={(r) => handleQuickCheckIn(r)}
        onCheckOut={(r) => handleQuickCheckOut(r)}
        onEdit={(r) => setEditingReservation(r)}
      />

      <EditReservationModal
        open={!!editingReservation}
        onClose={() => setEditingReservation(null)}
        reservation={editingReservation}
        onSaved={() => {
          refetch();
          setActionSuccess("Reservation updated successfully.");
        }}
      />

      {/* Delete / Cancel Confirmation Modal */}
      {deletingReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-brand-900 text-lg font-bold">
              Cancel Reservation?
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Are you sure you want to cancel the booking for{" "}
              <strong>{deletingReservation.name}</strong>?
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Room {deletingReservation.roomNumber || ""} will be freed for
              other bookings.
            </p>
            <div className="mt-5 flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setDeletingReservation(null)}
              >
                Keep Stay
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={handleConfirmDelete}
                loading={deleteReservationMut.isPending}
              >
                Yes, Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
