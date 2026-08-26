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

      setSuccess(`${memberToDelete.name || "Member"}'s account has been deleted.`);

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
      <div className="px-6 lg:px-10 py-8">
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-semibold text-navy">Members</h1>

            <p className="text-sm text-muted mt-1">Manage the staff members of your hotel.</p>
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

        <div className="bg-cream border border-beige-border rounded-2xl shadow-card overflow-hidden">
          <div className="px-6 py-5 border-b border-beige-border">
            <h2 className="font-display text-xl font-semibold text-navy">Hotel Members</h2>

            <p className="text-sm text-muted mt-1">
              Receptionists and staff accounts associated with your hotel.
            </p>
          </div>

          {/* =================================================
              LOADING
          ================================================= */}

          {loading && <div className="px-6 py-12 text-center text-muted">Loading members...</div>}

          {/* =================================================
              EMPTY
          ================================================= */}

          {!loading && members.length === 0 && (
            <div className="px-6 py-12 text-center">
              <div className="text-4xl mb-3">👥</div>

              <h3 className="font-display text-lg font-semibold text-navy">No members yet</h3>

              <p className="text-sm text-muted mt-1">
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
                  className="px-6 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-5"
                >
                  {/* MEMBER INFO */}

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-navy text-cream flex items-center justify-center font-display font-semibold text-lg">
                      {(member.name || member.email || "M").charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <h3 className="font-semibold text-navy">{member.name || "Unnamed Member"}</h3>

                      <p className="text-sm text-muted">{member.email}</p>

                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs uppercase tracking-wide text-gold font-semibold">
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
                      className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-100 transition disabled:cursor-not-allowed disabled:opacity-50"
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

          <div className="relative w-full max-w-md bg-cream rounded-2xl shadow-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600 text-xl shrink-0">
                !
              </div>

              <div>
                <h2 className="font-display text-xl font-semibold text-navy">Delete Account?</h2>

                <p className="text-sm text-muted mt-2 leading-6">
                  Are you sure you want to delete{" "}
                  <strong className="text-navy">
                    {memberToDelete.name || memberToDelete.email}
                  </strong>
                  's account?
                </p>

                <p className="text-xs text-muted mt-2">
                  They will no longer be able to log in to HotelOS.
                </p>
              </div>
            </div>

            {/* BUTTONS */}

            <div className="flex justify-end gap-3 mt-7">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setMemberToDelete(null)}
                className="rounded-lg border border-beige-border px-5 py-2.5 text-sm font-medium text-navy hover:bg-ivory transition"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition disabled:opacity-60"
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
