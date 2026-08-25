import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";

import {
  Plus,
  Search,
  MoreVertical,
  Power,
  Mail,
  Building2,
} from "lucide-react";

import Topbar from "../components/layout/Topbar.jsx";
import Button from "../components/ui/Button.jsx";
import Badge from "../components/ui/Badge.jsx";

import {
  EmptyState,
  TableSkeleton,
} from "../components/ui/States.jsx";

import CreateHotelModal from "../components/hotels/CreateHotelModal.jsx";

import {
  getHotels,
  updateHotelStatus,
} from "../services/hotel.service.js";

export default function Hotels() {
  const { onMenuClick } =
    useOutletContext();

  // =====================================================
  // STATE
  // =====================================================

  const [hotels, setHotels] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [query, setQuery] =
    useState("");

  const [createOpen, setCreateOpen] =
    useState(false);

  const [menuOpenId, setMenuOpenId] =
    useState(null);

  const [toast, setToast] =
    useState("");

  // =====================================================
  // LOAD HOTELS
  // =====================================================

  useEffect(() => {
    loadHotels();
  }, []);

  async function loadHotels() {
    setLoading(true);

    try {
      const data =
        await getHotels();

      setHotels(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (error) {
      console.error(
        "Failed to load hotels:",
        error
      );

      setToast(
        error.message ||
          "Failed to load hotels."
      );
    } finally {
      setLoading(false);
    }
  }

  // =====================================================
  // AUTO HIDE TOAST
  // =====================================================

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer =
      setTimeout(() => {
        setToast("");
      }, 3000);

    return () =>
      clearTimeout(timer);
  }, [toast]);

  // =====================================================
  // SEARCH HOTELS
  // =====================================================

  const filtered =
    useMemo(() => {
      if (!query.trim()) {
        return hotels;
      }

      const q =
        query
          .trim()
          .toLowerCase();

      return hotels.filter(
        (hotel) => {
          const name =
            hotel.name
              ?.toLowerCase() ||
            "";

          const email =
            hotel.email
              ?.toLowerCase() ||
            "";

          const city =
            hotel.city
              ?.toLowerCase() ||
            "";

          const hotelCode =
            hotel.hotelCode
              ?.toLowerCase() ||
            "";

          return (
            name.includes(q) ||
            email.includes(q) ||
            city.includes(q) ||
            hotelCode.includes(q)
          );
        }
      );
    }, [
      hotels,
      query,
    ]);

  // =====================================================
  // ACTIVATE / DEACTIVATE HOTEL
  // =====================================================

  async function handleToggleStatus(
    hotel
  ) {
    setMenuOpenId(null);

    const nextStatus =
      hotel.status === "ACTIVE"
        ? "INACTIVE"
        : "ACTIVE";

    const action =
      nextStatus === "INACTIVE"
        ? "deactivate"
        : "reactivate";

    const confirmed =
      window.confirm(
        `Are you sure you want to ${action} "${hotel.name}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      const updatedHotel =
        await updateHotelStatus(
          hotel._id,
          nextStatus
        );

      setHotels((previous) =>
        previous.map(
          (item) =>
            item._id ===
            hotel._id
              ? {
                  ...item,
                  status:
                    updatedHotel.status,
                }
              : item
        )
      );

      setToast(
        nextStatus === "INACTIVE"
          ? `${hotel.name} has been deactivated.`
          : `${hotel.name} has been reactivated.`
      );
    } catch (error) {
      console.error(
        "Failed to update hotel status:",
        error
      );

      setToast(
        error.message ||
          "Failed to update hotel status."
      );
    }
  }

  // =====================================================
  // RESEND INVITE
  // Placeholder for now
  // =====================================================

  function handleResendInvite(
    hotel
  ) {
    setMenuOpenId(null);

    setToast(
      `Resend invite for ${hotel.name} will be added next.`
    );
  }

  // =====================================================
  // FORMAT DATE
  // =====================================================

  function formatDate(date) {
    if (!date) {
      return "—";
    }

    const parsedDate =
      new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return "—";
    }

    return parsedDate.toLocaleDateString();
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <>
      {/* ===============================================
          TOPBAR
      =============================================== */}

      <Topbar
        title="Hotels"
        subtitle={`${hotels.length} propert${
          hotels.length === 1
            ? "y"
            : "ies"
        } on the platform`}
        onMenuClick={onMenuClick}
        actions={
          <Button
            icon={Plus}
            onClick={() =>
              setCreateOpen(true)
            }
          >
            Create hotel
          </Button>
        }
      />

      {/* ===============================================
          MAIN CONTENT
      =============================================== */}

      <main className="flex-1 px-5 pb-10 lg:px-8">

        {/* =============================================
            SEARCH
        ============================================= */}

        <div className="mb-5 flex items-center gap-3">
          <div className="relative w-full max-w-sm">

            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
            />

            <input
              value={query}
              onChange={(event) =>
                setQuery(
                  event.target.value
                )
              }
              placeholder="Search hotels by name, email, city or code…"
              className="w-full rounded-lg border border-line bg-white py-2.5 pl-9 pr-3 text-sm text-ink-body outline-none placeholder:text-ink-muted/70 focus:border-signal-500 focus:ring-2 focus:ring-signal-500/15"
            />
          </div>
        </div>

        {/* =============================================
            LOADING
        ============================================= */}

        {loading ? (
          <TableSkeleton
            rows={5}
            cols={6}
          />
        ) : filtered.length === 0 ? (

          /* ===========================================
              EMPTY STATE
          =========================================== */

          <EmptyState
            icon={Building2}
            title={
              query
                ? "No hotels match your search"
                : "No hotels yet"
            }
            description={
              query
                ? "Try a different name, email, city or hotel code."
                : "Create your first hotel and invite its Sub Admin."
            }
            action={
              !query && (
                <Button
                  icon={Plus}
                  onClick={() =>
                    setCreateOpen(true)
                  }
                >
                  Create hotel
                </Button>
              )
            }
          />

        ) : (

          /* ===========================================
              HOTEL TABLE
          =========================================== */

          <div className="overflow-visible rounded-2xl border border-line bg-white">

            <table className="w-full text-left text-sm">

              {/* =========================================
                  TABLE HEAD
              ========================================= */}

              <thead>
                <tr className="border-b border-line text-xs font-semibold uppercase tracking-wide text-ink-muted">

                  <th className="px-5 py-3.5 font-semibold">
                    Hotel
                  </th>

                  <th className="px-5 py-3.5 font-semibold">
                    Email
                  </th>

                  <th className="px-5 py-3.5 font-semibold">
                    Status
                  </th>

                  <th className="px-5 py-3.5 font-semibold">
                    Hotel Code
                  </th>

                  <th className="px-5 py-3.5 font-semibold">
                    Created
                  </th>

                  <th className="px-5 py-3.5 font-semibold text-right">
                    Actions
                  </th>

                </tr>
              </thead>

              {/* =========================================
                  TABLE BODY
              ========================================= */}

              <tbody className="divide-y divide-line">

                {filtered.map(
                  (hotel) => (

                    <tr
                      key={hotel._id}
                      className="group transition-colors hover:bg-canvas/60"
                    >

                      {/* HOTEL */}

                      <td className="px-5 py-4">

                        <div className="flex items-center gap-3">

                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-signal-100 text-sm font-bold text-signal-600">

                            {hotel.name
                              ?.charAt(0)
                              ?.toUpperCase() ||
                              "H"}

                          </div>

                          <div>

                            <span className="block font-semibold text-ink-body">

                              {hotel.name}

                            </span>

                            {hotel.city && (

                              <span className="block text-xs text-ink-muted">

                                {hotel.city}

                              </span>

                            )}

                          </div>

                        </div>

                      </td>

                      {/* EMAIL */}

                      <td className="px-5 py-4 text-ink-muted">

                        {hotel.email || "—"}

                      </td>

                      {/* STATUS */}

                      <td className="px-5 py-4">

                        <Badge
                          status={
                            hotel.status ===
                            "ACTIVE"
                              ? "active"
                              : "deactivated"
                          }
                        />

                      </td>

                      {/* HOTEL CODE */}

                      <td className="px-5 py-4 font-semibold text-ink-body">

                        {hotel.hotelCode ||
                          "—"}

                      </td>

                      {/* CREATED */}

                      <td className="px-5 py-4 font-mono text-xs text-ink-muted">

                        {formatDate(
                          hotel.createdAt
                        )}

                      </td>

                      {/* ACTIONS */}

                      <td className="relative px-5 py-4 text-right">

                        <button
                          type="button"
                          onClick={() =>
                            setMenuOpenId(
                              menuOpenId ===
                                hotel._id
                                ? null
                                : hotel._id
                            )
                          }
                          className="rounded-lg p-1.5 text-ink-muted hover:bg-ink-950/5 hover:text-ink-body"
                          aria-label="Hotel actions"
                        >

                          <MoreVertical
                            size={17}
                          />

                        </button>

                        {/* =================================
                            ACTION MENU
                        ================================= */}

                        {menuOpenId ===
                          hotel._id && (

                          <>

                            {/* CLOSE OVERLAY */}

                            <div
                              className="fixed inset-0 z-10"
                              onClick={() =>
                                setMenuOpenId(
                                  null
                                )
                              }
                            />

                            {/* MENU */}

                            <div className="absolute right-5 top-12 z-20 w-56 overflow-hidden rounded-xl border border-line bg-white text-left shadow-lg shadow-ink-950/10">

                              {/* RESEND INVITE */}

                              <button
                                type="button"
                                onClick={() =>
                                  handleResendInvite(
                                    hotel
                                  )
                                }
                                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-ink-body hover:bg-canvas"
                              >

                                <Mail
                                  size={15}
                                  className="text-ink-muted"
                                />

                                Resend Sub Admin invite

                              </button>

                              {/* ACTIVATE / DEACTIVATE */}

                              <button
                                type="button"
                                onClick={() =>
                                  handleToggleStatus(
                                    hotel
                                  )
                                }
                                className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium hover:bg-canvas ${
                                  hotel.status ===
                                  "ACTIVE"
                                    ? "text-rose-500"
                                    : "text-signal-600"
                                }`}
                              >

                                <Power
                                  size={15}
                                />

                                {hotel.status ===
                                "ACTIVE"
                                  ? "Deactivate hotel"
                                  : "Reactivate hotel"}

                              </button>

                            </div>

                          </>
                        )}

                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>
        )}

      </main>

      {/* ===============================================
          CREATE HOTEL MODAL
      =============================================== */}

      <CreateHotelModal
        open={createOpen}
        onClose={() =>
          setCreateOpen(false)
        }
        onCreated={(
          hotel,
          {
            invited = false,
          } = {}
        ) => {

          // Add the newly created hotel
          // immediately to the table.

          setHotels(
            (previous) => [
              hotel,
              ...previous,
            ]
          );

          setToast(
            invited
              ? `${hotel.name} created and Sub Admin invitation sent.`
              : `${hotel.name} created successfully.`
          );
        }}
      />

      {/* ===============================================
          TOAST
      =============================================== */}

      {toast && (

        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-fade-in-up rounded-lg bg-ink-950 px-4 py-2.5 text-sm font-medium text-white shadow-lg">

          {toast}

        </div>

      )}

    </>
  );
}