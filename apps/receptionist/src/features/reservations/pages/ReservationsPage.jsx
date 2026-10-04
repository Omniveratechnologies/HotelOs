import React, { useState } from "react";
import { useNavigate } from "react-router";
import { Header } from "@hotelos/ui/components";
import {
  useReservations,
  useUpdateReservation,
  useDeleteReservation,
} from "../hooks/useReservations.js";
import ReservationDetailsModal from "../components/ReservationDetailsModal.jsx";
import EditReservationModal from "../components/EditReservationModal.jsx";

const statusBadges = {
  "checked-in": "bg-blue-100 text-blue-700",
  reserved: "bg-amber-100 text-amber-700",
  "checked-out": "bg-gray-100 text-gray-600",
};

export default function ReservationsPage() {
  const navigate = useNavigate();
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
    <>
      <Header
        pageTitle="Reservations"
        pageDescription={`${inHouseCount} in-house • ${reservedCount} upcoming bookings`}
      >
        <button
          onClick={() => navigate("/reservations/new")}
          className="bg-brand-900 hover:bg-brand-800 rounded-xl px-4 py-2 text-sm font-medium text-white transition-colors"
        >
          + New Reservation
        </button>
      </Header>

      <div className="p-6">
        {/* KPI Stats */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
            <span className="text-xs font-medium text-gray-500">
              All Reservations
            </span>
            <div className="text-brand-900 mt-1 text-2xl font-bold">
              {totalCount}
            </div>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
            <span className="text-xs font-medium text-amber-600">
              Upcoming (Reserved)
            </span>
            <div className="mt-1 text-2xl font-bold text-amber-700">
              {reservedCount}
            </div>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
            <span className="text-xs font-medium text-blue-600">
              Currently In-House
            </span>
            <div className="mt-1 text-2xl font-bold text-blue-700">
              {inHouseCount}
            </div>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
            <span className="text-xs font-medium text-gray-500">
              Completed Stays
            </span>
            <div className="mt-1 text-2xl font-bold text-gray-700">
              {completedCount}
            </div>
          </div>
        </div>

        {/* Notifications */}
        {actionSuccess && (
          <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {actionSuccess}
          </div>
        )}
        {actionError && (
          <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {actionError}
          </div>
        )}
        {loadError && (
          <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {loadError}
          </div>
        )}

        {/* Filter bar */}
        <div className="mb-6 flex gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by guest, room, or ref ID..."
            className="focus:border-brand-900 w-64 rounded-xl border border-gray-200 px-4 py-2 text-sm focus:outline-hidden"
          />
          <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
            {[
              { id: "all", label: "All" },
              { id: "reserved", label: "Reserved" },
              { id: "checked-in", label: "Checked In" },
              { id: "checked-out", label: "Checked Out" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all ${
                  filter === tab.id
                    ? "text-brand-900 bg-white shadow-xs"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs">
          {loading ? (
            <div className="py-16 text-center text-sm text-gray-400">
              Loading reservations...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              No reservations found. Click “+ New Reservation” to create one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                    <th className="px-4 py-3">Ref ID</th>
                    <th className="px-4 py-3">Guest</th>
                    <th className="px-4 py-3">Room</th>
                    <th className="px-4 py-3">Check In</th>
                    <th className="px-4 py-3">Check Out</th>
                    <th className="px-4 py-3">Nights</th>
                    <th className="px-4 py-3">Channel</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((r) => (
                    <tr
                      key={r.id}
                      className="transition-colors hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">
                        {String(r.id).slice(-6).toUpperCase()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-brand-900 font-semibold">
                          {r.name}
                        </div>
                        <div className="text-xs text-gray-400">
                          {r.phone || r.email || "—"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {r.roomNumber ? (
                          <div>
                            <span className="text-brand-900 font-bold">
                              Room {r.roomNumber}
                            </span>
                            {r.roomType && (
                              <span className="ml-1 text-xs text-gray-400">
                                ({r.roomType})
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-amber-600">
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {r.checkIn || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {r.checkOut || "—"}
                      </td>
                      <td className="text-brand-900 px-4 py-3 text-sm font-medium">
                        {r.nights ? `${r.nights}n` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                          {r.channel || "DIRECT"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${
                            statusBadges[r.status] ||
                            "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {r.status === "reserved" && (
                            <button
                              onClick={() => handleQuickCheckIn(r)}
                              className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                            >
                              Check In
                            </button>
                          )}
                          {r.status === "checked-in" && (
                            <button
                              onClick={() => handleQuickCheckOut(r)}
                              className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                            >
                              Check Out
                            </button>
                          )}
                          <button
                            onClick={() => setViewingReservation(r)}
                            className="text-brand-900 rounded-lg border border-gray-200 px-2 py-1 text-xs transition-colors hover:bg-gray-50"
                          >
                            View
                          </button>
                          <button
                            onClick={() => setEditingReservation(r)}
                            className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-blue-600 transition-colors hover:bg-blue-50"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeletingReservation(r)}
                            className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-red-500 transition-colors hover:bg-red-50"
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

      {/* Delete / Cancel Confirmation */}
      {deletingReservation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setDeletingReservation(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-brand-900 mb-2 text-lg font-bold">
              Cancel Reservation?
            </h3>
            <p className="mb-1 text-sm text-gray-500">
              Are you sure you want to cancel the booking for{" "}
              <strong>{deletingReservation.name}</strong>?
            </p>
            <p className="mb-5 text-xs text-gray-400">
              Room {deletingReservation.roomNumber || ""} will be freed for
              other check-ins.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingReservation(null)}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Keep Stay
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600"
              >
                Cancel Stay
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
