import { useState } from "react";
import { Header, Button, NewReservationModal } from "@hotelos/ui/components";
import { useGuests, useDeleteGuest } from "../hooks/useGuests.js";
import GuestDetailsModal from "../components/GuestDetailsModal.jsx";
import EditGuestModal from "../components/EditGuestModal.jsx";
import CredentialsModal from "../components/CredentialsModal.jsx";

const avatarColors = [
  "bg-brand-500",
  "bg-blue-500",
  "bg-emerald-500",
  "bg-purple-500",
  "bg-amber-500",
  "bg-rose-500",
];

const statusBadges = {
  "checked-in": "bg-emerald-50 text-emerald-700 border-emerald-200",
  reserved: "bg-amber-50 text-amber-700 border-amber-200",
  "checked-out": "bg-gray-100 text-gray-700 border-gray-200",
};

export default function GuestsPage() {
  const {
    guests = [],
    isLoading: loading,
    error: loadError,
    refetch,
  } = useGuests();
  const deleteGuestMut = useDeleteGuest();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [viewingGuest, setViewingGuest] = useState(null);
  const [editingGuest, setEditingGuest] = useState(null);
  const [credentialsGuest, setCredentialsGuest] = useState(null);
  const [deletingGuest, setDeletingGuest] = useState(null);
  const [actionSuccess, setActionSuccess] = useState("");
  const [actionError, setActionError] = useState("");

  const filtered = guests.filter((g) => {
    if (filter === "in-house" && g.status !== "checked-in") return false;
    if (filter === "upcoming" && g.status !== "reserved") return false;
    if (filter === "past" && g.status !== "checked-out") return false;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const matchName = g.name?.toLowerCase().includes(q);
      const matchEmail = g.email?.toLowerCase().includes(q);
      const matchPhone = g.phone?.toLowerCase().includes(q);
      const matchRoom = g.room?.toLowerCase().includes(q);
      const matchId = g.idNumber?.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchPhone && !matchRoom && !matchId) {
        return false;
      }
    }
    return true;
  });

  const totalGuests = guests.length;
  const inHouseGuests = guests.filter((g) => g.status === "checked-in").length;
  const upcomingGuests = guests.filter((g) => g.status === "reserved").length;
  const docsVerified = guests.filter((g) => g.documents?.length > 0).length;

  const handleDelete = async () => {
    if (!deletingGuest) return;
    setActionError("");
    setActionSuccess("");
    try {
      const stayId = deletingGuest.currentStay?.id || deletingGuest.id;
      await deleteGuestMut.mutateAsync(stayId);
      setActionSuccess(`Guest record for ${deletingGuest.name} was removed.`);
      setDeletingGuest(null);
      if (viewingGuest?.id === deletingGuest.id) setViewingGuest(null);
    } catch (err) {
      console.error("Delete guest error:", err);
      setActionError(err.message || "Failed to remove guest record.");
    }
  };

  return (
    <div className="bg-background-50 flex min-w-0 flex-1 flex-col">
      <Header
        pageTitle="Guest Directory"
        pageDescription="Customer database, government identity records, and portal credentials."
      >
        <Button
          variant="primary"
          onClick={() => setRegisterModalOpen(true)}
          className="shrink-0"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Register Guest
        </Button>
      </Header>

      <div className="p-6 lg:p-8">
        {/* KPI Stats */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-xs">
            <span className="text-xs font-medium text-gray-500">
              Total Registered
            </span>
            <div className="text-brand-900 mt-1 text-2xl font-bold">
              {totalGuests}
            </div>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-xs">
            <span className="text-xs font-medium text-emerald-600">
              Currently In-House
            </span>
            <div className="mt-1 text-2xl font-bold text-emerald-700">
              {inHouseGuests}
            </div>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-xs">
            <span className="text-xs font-medium text-amber-600">
              Upcoming Guests
            </span>
            <div className="mt-1 text-2xl font-bold text-amber-700">
              {upcomingGuests}
            </div>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-xs">
            <span className="text-xs font-medium text-gray-500">
              Docs on File
            </span>
            <div className="text-brand-900 mt-1 text-2xl font-bold">
              {docsVerified}
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

        {/* Search & Filter Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="relative max-w-md min-w-[240px] flex-1">
            <input
              type="text"
              placeholder="Search by name, email, phone, room, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-brand-900 focus:border-primary-400 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm placeholder:text-gray-400 focus:outline-hidden"
            />
          </div>

          <div className="flex rounded-xl bg-gray-100 p-1">
            {[
              { id: "all", label: "All Guests" },
              { id: "in-house", label: "In-House" },
              { id: "upcoming", label: "Upcoming" },
              { id: "past", label: "Past Stays" },
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
              Loading guests...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center">
              <div className="text-gray-400">No guests found.</div>
              <button
                onClick={() => setRegisterModalOpen(true)}
                className="text-primary-500 hover:text-primary-600 mt-2 text-sm font-semibold"
              >
                + Register your first guest
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-xs font-semibold tracking-wider text-gray-500 uppercase">
                    <th className="px-5 py-3.5">Guest Profile</th>
                    <th className="px-5 py-3.5">Assigned Room</th>
                    <th className="px-5 py-3.5">Identity Verification</th>
                    <th className="px-5 py-3.5">Documents</th>
                    <th className="px-5 py-3.5">Stay Status</th>
                    <th className="px-5 py-3.5">Portal Account</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((g, idx) => {
                    const colorIndex =
                      Math.abs(
                        (g.name || "")
                          .split("")
                          .reduce((acc, c) => acc + c.charCodeAt(0), 0),
                      ) % avatarColors.length;

                    return (
                      <tr
                        key={g.id || idx}
                        className="transition-colors hover:bg-gray-50/70"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white ${avatarColors[colorIndex]}`}
                            >
                              {g.name ? g.name[0].toUpperCase() : "G"}
                            </div>
                            <div className="min-w-0">
                              <div className="text-brand-900 font-semibold">
                                {g.name}
                              </div>
                              <div className="text-xs text-gray-400">
                                {g.phone || g.email || "No contact"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          {g.room ? (
                            <span className="text-brand-900 font-bold">
                              Room {g.room}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">None</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-xs">
                          <span className="rounded-md bg-gray-100 px-2 py-0.5 font-medium text-gray-700">
                            {g.idType || "Aadhaar"}
                          </span>
                          {g.idNumber && (
                            <div className="mt-0.5 font-mono text-[11px] text-gray-500">
                              {g.idNumber}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-gray-600">
                          {g.documents?.length > 0 ? (
                            <span className="text-primary-600 inline-flex items-center gap-1 font-semibold">
                              <span>📄</span> {g.documents.length} doc
                              {g.documents.length > 1 ? "s" : ""}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase ${
                              statusBadges[g.status] ||
                              "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {g.status || "Registered"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-xs text-gray-600">
                          {g.username ? (
                            <span className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1">
                              {g.username}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => setViewingGuest(g)}
                              className="text-brand-900 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium transition hover:bg-gray-100"
                            >
                              View
                            </button>
                            <button
                              onClick={() => setEditingGuest(g)}
                              className="text-primary-600 hover:bg-primary-50 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium transition"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setCredentialsGuest(g)}
                              className="text-brand-700 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium transition hover:bg-gray-100"
                              title="Manage Guest Portal Login"
                            >
                              Credentials
                            </button>
                            <button
                              onClick={() => setDeletingGuest(g)}
                              disabled={g.status === "checked-in"}
                              title={
                                g.status === "checked-in"
                                  ? "Check guest out before deleting"
                                  : "Delete guest record"
                              }
                              className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Delete
                            </button>
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
      </div>

      {/* Modals */}
      <NewReservationModal
        open={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        onCreated={() => {
          refetch();
          setActionSuccess("Guest registered successfully.");
        }}
      />

      <GuestDetailsModal
        open={!!viewingGuest}
        onClose={() => setViewingGuest(null)}
        guest={viewingGuest}
        onEdit={(g) => setEditingGuest(g)}
        onManageCredentials={(g) => setCredentialsGuest(g)}
      />

      <EditGuestModal
        open={!!editingGuest}
        onClose={() => setEditingGuest(null)}
        guest={editingGuest}
        onSaved={() => {
          refetch();
          setActionSuccess("Guest profile updated successfully.");
        }}
      />

      <CredentialsModal
        open={!!credentialsGuest}
        onClose={() => setCredentialsGuest(null)}
        guest={credentialsGuest}
      />

      {/* Delete Confirmation Modal */}
      {deletingGuest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-brand-900 text-lg font-bold">
              Remove Guest Account?
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Are you sure you want to remove the record for{" "}
              <strong>{deletingGuest.name}</strong>?
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Their portal login credentials and uploaded documents will be
              deleted.
            </p>
            <div className="mt-5 flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setDeletingGuest(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={handleDelete}
                loading={deleteGuestMut.isPending}
              >
                Yes, Remove
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
