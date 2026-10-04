import React, { useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  Header,
  KpiTile,
  KpiTileRow,
  StatusChip,
  TabsWithCounts,
  FilterBar,
  EmptyState,
  InlineBanner,
} from "@hotelos/ui/components";
import {
  CalendarRange,
  Phone,
  Globe,
  Share2,
  Users as UsersIcon,
  Plus,
  LogIn,
  LogOut,
  DoorOpen,
} from "lucide-react";
import { formatCurrency, formatDate } from "@hotelos/utils";
import { useAllReservations } from "../hooks/useAllReservations.js";
import { useReservationStats } from "../hooks/useReservationStats.js";
import { useRoomTypes } from "../../room-types/hooks/useRoomTypes.js";
import ReservationDetailPane from "../components/ReservationDetailPane.jsx";
import {
  STATUS_VARIANT,
  STATUS_LABEL,
  sourceLabel,
  guestInitials,
} from "../reservationUi.jsx";

const SOURCE_TABS = [
  { id: "all", label: "All" },
  { id: "DIRECT", label: "Direct" },
  { id: "WEBSITE", label: "Website" },
  { id: "OTA", label: "OTA" },
];

const STATUS_FILTER_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "draft", label: "Draft" },
  { value: "checked-in", label: "Checked-in" },
  { value: "checked-out", label: "Checked-out" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no-show", label: "No-show" },
];

const OTA_CHANNEL_OPTIONS = [
  { value: "BOOKING_COM", label: "Booking.com" },
  { value: "AIRBNB", label: "Airbnb" },
  { value: "AGODA", label: "Agoda" },
  { value: "EXPEDIA", label: "Expedia" },
  { value: "GOIBIBO", label: "Goibibo" },
  { value: "MAKEMYTRIP", label: "MakeMyTrip" },
  { value: "OTHER", label: "Other" },
];

const DEFAULT_FILTERS = {
  tab: "all",
  status: "",
  otaChannel: "",
  roomType: "",
  q: "",
  from: "",
  to: "",
  page: 1,
  limit: 10,
  sort: "-createdAt",
};

export default function ReservationsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [selected, setSelected] = useState(null);
  const flash = location.state?.created
    ? `Reservation ${location.state.created} created.`
    : location.state?.updated
      ? "Reservation updated."
      : "";

  const { stats } = useReservationStats();
  const { roomTypes } = useRoomTypes();
  const roomTypeOptions = useMemo(
    () =>
      (roomTypes || [])
        .filter((t) => t.active !== false)
        .map((t) => ({ value: t.roomCode, label: t.name })),
    [roomTypes],
  );
  const { reservations, pagination, isLoading, isFetching } =
    useAllReservations(
      useMemo(
        () => ({
          status: filters.tab === "drafts" ? "draft" : filters.status || "",
          source:
            filters.tab === "all" || filters.tab === "drafts"
              ? ""
              : filters.tab,
          otaChannel: filters.otaChannel,
          roomType: filters.roomType,
          q: filters.q,
          from: filters.from,
          to: filters.to,
          page: filters.page,
          limit: filters.limit,
          sort: filters.sort,
        }),
        [filters],
      ),
    );

  const setFilter = (key, value) =>
    setFilters((f) => ({
      ...f,
      [key]: value,
      page: key === "page" ? value : 1,
    }));

  const resetFilters = () => setFilters(DEFAULT_FILTERS);

  const tabCounts = {
    all: stats?.total || 0,
    DIRECT: stats?.bySource?.DIRECT || 0,
    WEBSITE: stats?.bySource?.WEBSITE || 0,
    OTA: stats?.bySource?.OTA || 0,
    drafts: stats?.byStatus?.draft || 0,
  };

  return (
    <>
      <Header
        pageTitle="All Reservations"
        pageDescription="View, search and manage all types of reservations in one place"
      >
        <button
          onClick={() => navigate("/reservations/new")}
          className="bg-brand-900 hover:bg-brand-800 inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium text-white transition-colors"
        >
          <Plus size={16} /> New Reservation
        </button>
      </Header>

      <div className="flex items-start gap-4 p-4 sm:p-6">
        <div className="min-w-0 flex-1 space-y-4">
          {flash && (
            <InlineBanner
              variant="success"
              action={
                <button
                  onClick={() => navigate(location.pathname, { replace: true })}
                  className="text-sm font-semibold underline-offset-2 hover:underline"
                >
                  Dismiss
                </button>
              }
            >
              {flash}
            </InlineBanner>
          )}

          {/* KPI tiles */}
          <KpiTileRow>
            <KpiTile
              icon={CalendarRange}
              value={stats?.total ?? "—"}
              label="Total Reservations"
              active={filters.tab === "all"}
              onClick={() => setFilter("tab", "all")}
            />
            <KpiTile
              icon={Phone}
              iconClassName="bg-blue-50 text-blue-600"
              value={tabCounts.DIRECT}
              label="Direct"
              active={filters.tab === "DIRECT"}
              onClick={() => setFilter("tab", "DIRECT")}
            />
            <KpiTile
              icon={Globe}
              iconClassName="bg-emerald-50 text-emerald-600"
              value={tabCounts.WEBSITE}
              label="Website"
              active={filters.tab === "WEBSITE"}
              onClick={() => setFilter("tab", "WEBSITE")}
            />
            <KpiTile
              icon={Share2}
              iconClassName="bg-orange-50 text-orange-600"
              value={tabCounts.OTA}
              label="OTA"
              active={filters.tab === "OTA"}
              onClick={() => setFilter("tab", "OTA")}
            />
            <KpiTile
              icon={LogIn}
              iconClassName="bg-amber-50 text-amber-600"
              value={stats?.today?.arrivals ?? "—"}
              label="Today's Arrivals"
            />
            <KpiTile
              icon={LogOut}
              iconClassName="bg-brand-50 text-brand-700"
              value={stats?.today?.departures ?? "—"}
              label="Departures"
            />
            <KpiTile
              icon={DoorOpen}
              iconClassName="bg-violet-50 text-violet-600"
              value={stats?.today?.inHouse ?? "—"}
              label="In-house"
            />
          </KpiTileRow>

          {/* Tabs */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-2xs">
            <TabsWithCounts
              className="px-3"
              tabs={SOURCE_TABS.map((t) =>
                Object.assign({}, t, { count: tabCounts[t.id] || 0 }),
              )}
              activeId={filters.tab === "drafts" ? "all" : filters.tab}
              onChange={(id) => setFilter("tab", id)}
            />

            {/* Filter bar */}
            <div className="border-t border-gray-100 p-3">
              <FilterBar
                dateRange={{ from: filters.from, to: filters.to }}
                onDateRangeChange={(r) => {
                  setFilters((f) => ({
                    ...f,
                    from: r.from,
                    to: r.to,
                    page: 1,
                  }));
                }}
                selects={[
                  {
                    key: "status",
                    label: "All Status",
                    value: filters.status,
                    options: STATUS_FILTER_OPTIONS,
                  },
                  ...(filters.tab === "OTA"
                    ? [
                        {
                          key: "otaChannel",
                          label: "All OTA Channels",
                          value: filters.otaChannel,
                          options: OTA_CHANNEL_OPTIONS,
                        },
                      ]
                    : []),
                  {
                    key: "roomType",
                    label: "All Room Types",
                    value: filters.roomType,
                    options: roomTypeOptions,
                  },
                ]}
                onSelectChange={(key, value) => setFilter(key, value)}
                search={filters.q}
                onSearchChange={(v) => setFilter("q", v)}
                searchPlaceholder="Search by name, reservation no., OTA booking id…"
                onClear={resetFilters}
              />
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                    <th className="w-10 px-4 py-3" aria-label="Select all" />
                    <th className="px-4 py-3">Res. No.</th>
                    <th className="px-4 py-3">Guest</th>
                    <th className="px-4 py-3">Source</th>
                    <th className="px-4 py-3">Check-in</th>
                    <th className="px-4 py-3">Check-out</th>
                    <th className="px-4 py-3">Nights</th>
                    <th className="px-4 py-3">Rooms</th>
                    <th className="px-4 py-3">Guests</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3" aria-label="Actions" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {isLoading ? (
                    Array.from({ length: 5 }, (rowIdx) => (
                      <tr key={rowIdx}>
                        {Array.from({ length: 12 }, (cellIdx) => (
                          <td key={cellIdx} className="px-4 py-3">
                            <div className="h-4 animate-pulse rounded bg-gray-100" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : reservations.length === 0 ? (
                    <tr>
                      <td colSpan={12}>
                        <EmptyState
                          icon={CalendarRange}
                          title="No reservations found"
                          hint="Adjust the filters, or create a new reservation."
                          action={
                            <button
                              onClick={() => navigate("/reservations/new")}
                              className="bg-brand-900 hover:bg-brand-800 inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white"
                            >
                              <Plus size={14} /> New Reservation
                            </button>
                          }
                        />
                      </td>
                    </tr>
                  ) : (
                    reservations.map((r) => (
                      <tr
                        key={r.id}
                        onClick={() => setSelected(r)}
                        className={`hover:bg-background-50 cursor-pointer transition-colors ${
                          selected?.id === r.id ? "bg-brand-50/60" : ""
                        }`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            aria-label={`Select ${r.reservationNo || r.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="border-surface-300 h-4 w-4 rounded"
                          />
                        </td>
                        <td className="text-brand-700 px-4 py-3 font-medium">
                          {r.reservationNo || r.id.slice(-6).toUpperCase()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <span className="bg-brand-100 text-brand-800 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                              {guestInitials(r.name)}
                            </span>
                            <div>
                              <p className="text-brand-900 font-medium">
                                {r.name}
                              </p>
                              <p className="text-surface-500 text-xs">
                                {r.phone || r.email || "—"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${
                              r.source === "OTA"
                                ? "border-orange-200 bg-orange-50 text-orange-700"
                                : r.source === "WEBSITE"
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : r.source === "PHONE"
                                    ? "border-amber-200 bg-amber-50 text-amber-700"
                                    : r.source === "CORPORATE"
                                      ? "border-violet-200 bg-violet-50 text-violet-700"
                                      : "border-blue-200 bg-blue-50 text-blue-700"
                            }`}
                          >
                            {sourceLabel(r)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {formatDate(r.checkIn)}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {formatDate(r.checkOut)}
                        </td>
                        <td className="text-brand-900 px-4 py-3 font-medium">
                          {r.nights ? `${r.nights}n` : "—"}
                        </td>
                        <td className="px-4 py-3">{r.rooms}</td>
                        <td className="px-4 py-3">
                          <span className="text-surface-600 inline-flex items-center gap-1">
                            <UsersIcon size={13} />
                            {r.adults + r.children}
                          </span>
                        </td>
                        <td className="text-brand-900 px-4 py-3 text-right font-semibold">
                          {formatCurrency(
                            r.grandTotal ?? r.pricing?.grandTotal ?? 0,
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <StatusChip
                            variant={STATUS_VARIANT[r.status] || "neutral"}
                          >
                            {STATUS_LABEL[r.status] || r.status}
                          </StatusChip>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            aria-label="Open reservation actions"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelected(r);
                            }}
                            className="text-surface-400 rounded-lg p-1.5 hover:bg-gray-100 hover:text-gray-700"
                          >
                            ⋮
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 px-4 py-3 text-sm text-gray-500">
              <span>
                {pagination.total === 0
                  ? "No reservations"
                  : `Showing ${(pagination.page - 1) * pagination.limit + 1}–${Math.min(
                      pagination.page * pagination.limit,
                      pagination.total,
                    )} of ${pagination.total} reservations`}
                {isFetching && !isLoading ? " · refreshing…" : ""}
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() =>
                    setFilters((f) => ({ ...f, page: f.page - 1 }))
                  }
                  className="border-surface-200 rounded-lg border bg-white px-3 py-1.5 text-xs font-medium disabled:opacity-40"
                >
                  Prev
                </button>
                {Array.from(
                  { length: Math.min(5, pagination.pages) },
                  (_, i) => i + 1,
                ).map((p) => (
                  <button
                    key={p}
                    onClick={() => setFilters((f) => ({ ...f, page: p }))}
                    className={`h-8 w-8 rounded-lg text-xs font-semibold ${
                      pagination.page === p
                        ? "bg-brand-900 text-white"
                        : "border-surface-200 border bg-white"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  disabled={pagination.page >= pagination.pages}
                  onClick={() =>
                    setFilters((f) => ({ ...f, page: f.page + 1 }))
                  }
                  className="border-surface-200 rounded-lg border bg-white px-3 py-1.5 text-xs font-medium disabled:opacity-40"
                >
                  Next
                </button>
                <select
                  aria-label="Rows per page"
                  value={filters.limit}
                  onChange={(e) => setFilter("limit", Number(e.target.value))}
                  className="border-surface-200 h-8 rounded-lg border bg-white px-2 text-xs"
                >
                  {[10, 20, 50].map((n) => (
                    <option key={n} value={n}>
                      {n} / page
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Docked detail pane (≥xl) */}
        {selected && (
          <div className="sticky top-24 hidden w-100 shrink-0 self-start xl:block">
            <ReservationDetailPane
              reservation={selected}
              variant="docked"
              onClose={() => setSelected(null)}
              onChanged={() => setSelected(null)}
            />
          </div>
        )}
      </div>

      {/* Overlay detail pane (<xl) */}
      <div className="xl:hidden">
        <ReservationDetailPane
          reservation={selected}
          variant="overlay"
          onClose={() => setSelected(null)}
          onChanged={() => setSelected(null)}
        />
      </div>
    </>
  );
}
