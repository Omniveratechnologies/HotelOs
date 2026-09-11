import { useEffect, useState } from "react";
import { SidebarToggle } from "@hotelos/ui/components/SidebarToggle";

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
    } catch (err) {
      console.error("Failed to load members:", err);

      setError(err.message || "Failed to load members");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const data = await fetchMembers();

        if (!cancelled) {
          setMembers(data);
        }
      } catch (err) {
        console.error("Failed to load members:", err);

        if (!cancelled) {
          setError(err.message || "Failed to load members");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
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
    } catch (err) {
      console.error("Delete member error:", err);

      setError(err.message || "Failed to delete account");
    } finally {
      setDeleting(false);
    }
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="bg-background-50 min-h-screen">
      <div className="px-6 py-8 lg:px-10">
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <SidebarToggle />
            <div>
              <h1 className="font-display text-brand-900 text-3xl font-semibold">
                Members
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Manage the staff members of your hotel.
              </p>
            </div>
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

        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs">
          <div className="border-b border-gray-100 px-6 py-5">
            <h2 className="font-display text-brand-900 text-xl font-semibold">
              Hotel Members
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Receptionists and staff accounts associated with your hotel.
            </p>
          </div>

          {/* =================================================
              LOADING
          ================================================= */}

          {loading && (
            <div className="px-6 py-12 text-center text-gray-500">
              Loading members...
            </div>
          )}

          {/* =================================================
              EMPTY
          ================================================= */}

          {!loading && members.length === 0 && (
            <div className="px-6 py-12 text-center">
              <div className="mb-3 text-4xl">👥</div>

              <h3 className="font-display text-brand-900 text-lg font-semibold">
                No members yet
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Add a receptionist to your hotel to get started.
              </p>
            </div>
          )}

          {/* =================================================
              MEMBERS
          ================================================= */}

          {!loading && members.length > 0 && (
            <div className="divide-y divide-gray-100">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex flex-col gap-5 px-6 py-5 md:flex-row md:items-center md:justify-between"
                >
                  {/* MEMBER INFO */}

                  <div className="flex items-center gap-4">
                    <div className="bg-brand-900 font-display flex h-12 w-12 items-center justify-center rounded-full text-lg font-semibold text-white">
                      {(member.name || member.email || "M")
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div>
                      <h3 className="text-brand-900 font-semibold">
                        {member.name || "Unnamed Member"}
                      </h3>

                      <p className="text-sm text-gray-500">{member.email}</p>

                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-primary-400 text-xs font-semibold tracking-wide uppercase">
                          {member.role}
                        </span>

                        <span className="text-gray-500">•</span>

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
            className="bg-brand-900/50 absolute inset-0 backdrop-blur-xs"
            onClick={() => {
              if (!deleting) {
                setMemberToDelete(null);
              }
            }}
          />

          {/* MODAL */}

          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-50 text-xl text-red-600">
                !
              </div>

              <div>
                <h2 className="font-display text-brand-900 text-xl font-semibold">
                  Delete Account?
                </h2>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Are you sure you want to delete{" "}
                  <strong className="text-brand-900">
                    {memberToDelete.name || memberToDelete.email}
                  </strong>
                  's account?
                </p>

                <p className="mt-2 text-xs text-gray-500">
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
                className="text-brand-900 rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium transition hover:bg-gray-50"
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
