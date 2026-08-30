import { useEffect, useState } from "react";

import { fetchMembers, deleteMember } from "../../services/member.service.js";

import AddMembers from "../../components/AddMembers.jsx";

export default function MembersPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Delete state
  const [memberToDelete, setMemberToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // =====================================================
  // LOAD MEMBERS
  // =====================================================

  const loadMembers = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await fetchMembers();

      setMembers(data);
    } catch (error) {
      console.error("Failed to load members:", error);

      setError(error.message || "Failed to load members");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  // =====================================================
  // DELETE MEMBER
  // =====================================================

  const handleDelete = async () => {
    if (!memberToDelete) return;

    try {
      setDeleting(true);
      setError("");
      setSuccess("");

      await deleteMember(memberToDelete.id);

      setMembers((currentMembers) =>
        currentMembers.filter((member) => member.id !== memberToDelete.id),
      );

      setSuccess(
        `${memberToDelete.name || "Member"}'s account has been deleted.`,
      );

      setMemberToDelete(null);
    } catch (error) {
      console.error("Delete member error:", error);

      setError(error.message || "Failed to delete account");
    } finally {
      setDeleting(false);
    }
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="min-h-screen bg-ivory font-body">
      <div className="px-6 py-8 lg:px-10">
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-semibold text-navy">
              Members
            </h1>

            <p className="mt-1 text-sm text-muted">
              Manage the staff members of your hotel.
            </p>
          </div>
        </div>

        {/* =================================================
            SUCCESS MESSAGE
        ================================================= */}

        {success && (
          <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        {/* =================================================
            ERROR MESSAGE
        ================================================= */}

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* =================================================
            ADD RECEPTIONIST
        ================================================= */}

        <AddMembers onInvited={loadMembers} />

        {/* =================================================
            MEMBERS CARD
        ================================================= */}

        <div className="overflow-hidden rounded-2xl border border-beige-border bg-cream shadow-card">
          <div className="border-b border-beige-border px-6 py-5">
            <h2 className="font-display text-xl font-semibold text-navy">
              Hotel Members
            </h2>

            <p className="mt-1 text-sm text-muted">
              Receptionists and staff accounts associated with your hotel.
            </p>
          </div>

          {/* =================================================
              LOADING
          ================================================= */}

          {loading && (
            <div className="px-6 py-12 text-center text-muted">
              Loading members...
            </div>
          )}

          {/* =================================================
              EMPTY
          ================================================= */}

          {!loading && members.length === 0 && (
            <div className="px-6 py-12 text-center">
              <div className="mb-3 text-4xl">👥</div>

              <h3 className="font-display text-lg font-semibold text-navy">
                No members yet
              </h3>

              <p className="mt-1 text-sm text-muted">
                Add a receptionist to your hotel to get started.
              </p>
            </div>
          )}

          {/* =================================================
              MEMBERS
          ================================================= */}

          {!loading && members.length > 0 && (
            <div className="divide-y divide-beige-border">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex flex-col gap-5 px-6 py-5 md:flex-row md:items-center md:justify-between"
                >
                  {/* MEMBER INFO */}

                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-navy font-display text-lg font-semibold text-cream">
                      {(member.name || member.email || "M")
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div>
                      <h3 className="font-semibold text-navy">
                        {member.name || "Unnamed Member"}
                      </h3>

                      <p className="text-sm text-muted">{member.email}</p>

                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-gold">
                          {member.role}
                        </span>

                        <span className="text-muted">•</span>

                        <span
                          className={`text-xs font-medium ${
                            member.isActive ? "text-green-600" : "text-red-500"
                          }`}
                        >
                          {member.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ACTION */}

                  <div>
                    <button
                      type="button"
                      onClick={() => setMemberToDelete(member)}
                      disabled={!member.isActive}
                      className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* =====================================================
          DELETE CONFIRMATION MODAL
      ===================================================== */}

      {memberToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* OVERLAY */}

          <div
            className="absolute inset-0 bg-navy/50 backdrop-blur-sm"
            onClick={() => {
              if (!deleting) {
                setMemberToDelete(null);
              }
            }}
          />

          {/* MODAL */}

          <div className="relative w-full max-w-md rounded-2xl bg-cream p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-50 text-xl text-red-600">
                !
              </div>

              <div>
                <h2 className="font-display text-xl font-semibold text-navy">
                  Delete Account?
                </h2>

                <p className="mt-2 text-sm leading-6 text-muted">
                  Are you sure you want to delete{" "}
                  <strong className="text-navy">
                    {memberToDelete.name || memberToDelete.email}
                  </strong>
                  's account?
                </p>

                <p className="mt-2 text-xs text-muted">
                  They will no longer be able to log in to HotelOS.
                </p>
              </div>
            </div>

            {/* BUTTONS */}

            <div className="mt-7 flex justify-end gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setMemberToDelete(null)}
                className="rounded-lg border border-beige-border px-5 py-2.5 text-sm font-medium text-navy transition hover:bg-ivory"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
