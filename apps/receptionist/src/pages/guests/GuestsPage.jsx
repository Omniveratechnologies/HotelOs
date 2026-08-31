import React, { useState } from "react";
import { useHotelOS } from "../../app/providers.jsx";
import AddGuestModal from "./_components/AddGuestModal.jsx";
import GuestDetailsModal from "./_components/GuestDetailsModal.jsx";
import EditGuestModal from "./_components/EditGuestModal.jsx";

const statusBadge = {
  "checked-in": "bg-blue-100 text-blue-700",
  reserved: "bg-amber-100 text-amber-700",
  "checked-out": "bg-gray-100 text-gray-600",
};

const avatarColors = [
  "bg-purple-500",
  "bg-blue-500",
  "bg-green-500",
  "bg-red-500",
  "bg-orange-500",
  "bg-pink-500",
];

export default function GuestsPage() {
  const { guests, guestsLoading, guestsError, removeGuest, refreshData } =
    useHotelOS();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [pageError, setPageError] = useState("");

  // Keep the viewed/edited guest fresh after data refreshes
  const liveGuest = viewing
    ? guests.find((g) => g.id === viewing.id) || viewing
    : null;

  const filtered = guests.filter((g) => {
    if (filter !== "all" && g.status !== filter) return false;
    if (
      search &&
      !g.name.toLowerCase().includes(search.toLowerCase()) &&
      !(g.room && g.room.includes(search))
    )
      return false;
    return true;
  });

  const handleDelete = async () => {
    if (!deleting) return;
    setPageError("");
    setDeleteBusy(true);
    try {
      await removeGuest(deleting.id);
      if (viewing?.id === deleting.id) setViewing(null);
      if (editing?.id === deleting.id) setEditing(null);
      setDeleting(null);
    } catch (err) {
      console.error("Failed to delete guest:", err);
      setPageError(err.message || "Failed to delete the guest.");
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-navy-900 text-2xl font-bold">
            Guest Directory
          </h1>
          <p className="text-sm text-gray-500">
            {guests.filter((g) => g.status === "checked-in").length} checked in
            · {guests.filter((g) => g.status === "reserved").length} upcoming
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-navy-900 hover:bg-navy-800 rounded-xl px-4 py-2 text-sm font-medium text-white transition-colors"
        >
          + Add Guest
        </button>
      </div>

      <div className="mb-6 flex gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search guests..."
          className="focus:border-gold-400 w-64 rounded-xl border border-gray-200 px-4 py-2 text-sm focus:outline-hidden"
        />
        <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
          {["all", "checked-in", "reserved", "checked-out"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all ${filter === s ? "text-navy-900 bg-white shadow-xs" : "text-gray-500 hover:text-gray-700"}`}
            >
              {s.replace("-", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Loading / errors */}
      {guestsLoading && (
        <div className="py-16 text-center text-sm text-gray-400">
          Loading guests...
        </div>
      )}
      {!guestsLoading && guestsError && (
        <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {guestsError}
        </div>
      )}
      {pageError && (
        <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {pageError}
        </div>
      )}

      {!guestsLoading && !guestsError && (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-500 uppercase">
                  Guest
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-500 uppercase">
                  Room
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-500 uppercase">
                  Check In
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-500 uppercase">
                  Check Out
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-500 uppercase">
                  Nights
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-500 uppercase">
                  ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-500 uppercase">
                  Docs
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((g, idx) => {
                return (
                  <tr key={g.id} className="transition-colors hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-9 w-9 rounded-xl ${avatarColors[idx % avatarColors.length]} flex items-center justify-center text-sm font-bold text-white`}
                        >
                          {g.name ? g.name[0].toUpperCase() : "?"}
                        </div>
                        <div>
                          <div className="text-navy-900 text-sm font-semibold">
                            {g.name}
                          </div>
                          <div className="text-xs text-gray-400">{g.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-navy-900 font-bold">{g.room}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {g.checkIn || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {g.checkOut || "—"}
                    </td>
                    <td className="text-navy-900 px-4 py-3 text-sm font-medium">
                      {g.nights ? `${g.nights}n` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                        {g.idType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {g.documents?.length > 0
                        ? `📄 ${g.documents.length}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge[g.status]}`}
                      >
                        {(g.status || "").replace("-", " ").toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => setViewing(g)}
                          className="text-navy-900 rounded-lg border border-gray-200 px-2 py-1 text-xs transition-colors hover:bg-gray-50"
                        >
                          View
                        </button>
                        <button
                          onClick={() => setEditing(g)}
                          className="text-gold-400 rounded-lg border border-gray-200 px-2 py-1 text-xs transition-colors hover:bg-amber-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleting(g)}
                          disabled={g.status !== "checked-out"}
                          title={
                            g.status !== "checked-out"
                              ? "Check the guest out before deleting their account"
                              : ""
                          }
                          className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-red-500 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
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
          {filtered.length === 0 && (
            <div className="py-12 text-center text-gray-400">
              No guests found. Register your first guest with “+ Add Guest”.
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showAdd && (
        <AddGuestModal
          onClose={() => setShowAdd(false)}
          onRegistered={() => refreshData()}
        />
      )}

      {liveGuest && !editing && (
        <GuestDetailsModal
          guest={liveGuest}
          onClose={() => setViewing(null)}
          onEdit={() => setEditing(liveGuest)}
        />
      )}

      {editing && (
        <EditGuestModal
          guest={editing}
          onClose={() => setEditing(null)}
          onSaved={() => setEditing(null)}
        />
      )}

      {deleting && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !deleteBusy && setDeleting(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-navy-900 mb-2 text-lg font-bold">
              Delete Guest Account?
            </h3>
            <p className="mb-1 text-sm text-gray-500">
              This permanently removes <strong>{deleting.name}</strong>, their
              login account and uploaded documents.
            </p>
            <p className="mb-5 text-xs text-gray-400">
              The room will be freed for new check-ins.
            </p>

            {pageError && (
              <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                {pageError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setDeleting(null)}
                disabled={deleteBusy}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteBusy}
                className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60"
              >
                {deleteBusy ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
