import { useState } from "react";
import { useNavigate } from "react-router";
import {
  DetailDrawer,
  StatusChip,
  InlineBanner,
  Button,
  ConfirmDialog,
  Input,
} from "@hotelos/ui/components";
import {
  BedDouble,
  Pencil,
  XCircle,
  RefreshCcw,
  BedSingle,
  ArrowRight,
} from "lucide-react";
import { formatCurrency, formatDate, formatTime } from "@hotelos/utils";
import { useReservation } from "../hooks/useReservations.js";
import { useReservationHistory } from "../hooks/useAllReservations.js";
import { useAvailableRooms } from "../hooks/useAvailableRooms.js";
import {
  useCancelReservation,
  useReconfirmReservation,
  useChangeReservationRoom,
  useExtendReservationStay,
} from "../hooks/useAllReservations.js";
import {
  STATUS_VARIANT,
  STATUS_LABEL,
  sourceLabel,
  guestInitials,
} from "../reservationUi.jsx";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "guest", label: "Guest Details" },
  { id: "stay", label: "Stay Details" },
  { id: "billing", label: "Billing" },
  { id: "history", label: "History" },
];

function DetailRow({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <dt className="text-surface-500 text-xs">{label}</dt>
      <dd className="text-brand-900 text-right text-sm font-medium">
        {value ?? "—"}
      </dd>
    </div>
  );
}

function PaneCard({ title, children }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      {title && (
        <h3 className="text-brand-900 mb-2 text-sm font-semibold">{title}</h3>
      )}
      <dl>{children}</dl>
    </section>
  );
}

/**
 * Right-side reservation detail pane (docked ≥1280 via parent layout, overlay
 * below) with tabs and status-aware footer actions.
 *
 * @param {Object} props
 * @param {object|null} props.reservation - Selected list row.
 * @param {'overlay'|'docked'} props.variant
 * @param {() => void} props.onClose
 */
export function ReservationDetailPane({
  reservation,
  variant,
  onClose,
  onChanged,
}) {
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [changeRoomOpen, setChangeRoomOpen] = useState(false);
  const [extendOpen, setExtendOpen] = useState(false);
  const [newRoomId, setNewRoomId] = useState("");
  const [newCheckOut, setNewCheckOut] = useState("");
  const [actionError, setActionError] = useState("");

  const detail = useReservation(reservation?.id);
  const history = useReservationHistory(reservation?.id, tab === "history");

  const cancel = useCancelReservation();
  const reconfirm = useReconfirmReservation();
  const changeRoom = useChangeReservationRoom();
  const extendStay = useExtendReservationStay();

  const booking = detail.data || reservation;
  const actionsPending =
    cancel.isPending ||
    reconfirm.isPending ||
    changeRoom.isPending ||
    extendStay.isPending;

  const run = (mutation, payload, onDone) => {
    setActionError("");
    mutation.mutateAsync(payload).then(
      () => {
        onDone?.();
        onChanged?.();
      },
      (err) => setActionError(err.message || "Action failed"),
    );
  };

  const availableRooms = useAvailableRooms({
    roomTypeCode: booking?.roomTypeCode,
    checkIn: booking?.checkIn,
    checkOut: booking?.checkOut,
    enabled: changeRoomOpen,
  });

  if (!reservation) return null;

  const isOta = booking.source === "OTA";
  const canModify = ["draft", "pending", "confirmed", "reserved"].includes(
    booking.status,
  );
  const canCancel = ["draft", "pending", "confirmed", "reserved"].includes(
    booking.status,
  );
  const canReconfirm = ["cancelled", "no-show", "pending", "draft"].includes(
    booking.status,
  );
  const canChangeRoom = [
    "pending",
    "confirmed",
    "reserved",
    "checked-in",
    "draft",
  ].includes(booking.status);
  const canExtend = [
    "pending",
    "confirmed",
    "reserved",
    "checked-in",
    "draft",
  ].includes(booking.status);

  const pricing = booking.pricing;

  return (
    <DetailDrawer
      open={Boolean(reservation)}
      onClose={onClose}
      variant={variant}
      widthClassName={variant === "overlay" ? "w-full max-w-110" : "w-full"}
      title={
        <span className="flex items-center gap-2">
          {booking.reservationNo || booking.id}
          <StatusChip variant={STATUS_VARIANT[booking.status] || "neutral"}>
            {STATUS_LABEL[booking.status] || booking.status}
          </StatusChip>
        </span>
      }
      subtitle={
        <span className="flex items-center gap-2 text-xs">
          <BedDouble size={12} aria-hidden="true" />
          {booking.room?.roomNumber
            ? `Room ${booking.room.roomNumber} · ${booking.room.type || booking.roomTypeCode}`
            : (booking.roomTypeCode || "Unassigned") + " (auto-assign)"}
          {pricing ? ` · ${formatCurrency(pricing.nightlyRate)} / night` : ""}
        </span>
      }
      tabs={TABS}
      activeTabId={tab}
      onTabChange={setTab}
      footer={
        <div className="space-y-2">
          {actionError && (
            <InlineBanner variant="error">{actionError}</InlineBanner>
          )}
          {isOta && booking.otaInfo?.cancellationPolicy?.freeUntil && (
            <InlineBanner variant="info">
              {new Date() <
              new Date(booking.otaInfo.cancellationPolicy.freeUntil)
                ? "Free cancellation until " +
                  formatDate(booking.otaInfo.cancellationPolicy.freeUntil)
                : booking.otaInfo.cancellationPolicy.penalty ||
                  "One-night charge applies after the free window."}
            </InlineBanner>
          )}
          <div className="flex gap-2">
            {canModify && (
              <Button
                variant="secondary"
                size="sm"
                icon={Pencil}
                onClick={() => navigate(`/reservations/${booking.id}/edit`)}
                disabled={actionsPending}
              >
                Modify
              </Button>
            )}
            {canCancel && (
              <Button
                variant="dangerGhost"
                size="sm"
                icon={XCircle}
                onClick={() => setConfirmCancel(true)}
                disabled={actionsPending}
              >
                Cancel
              </Button>
            )}
            {canReconfirm && (
              <Button
                variant="secondary"
                size="sm"
                icon={RefreshCcw}
                onClick={() => run(reconfirm, booking.id)}
                loading={reconfirm.isPending}
              >
                Reconfirm
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {canChangeRoom && (
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                icon={BedSingle}
                onClick={() => {
                  setNewRoomId(booking.roomId ? String(booking.roomId) : "");
                  setChangeRoomOpen(true);
                }}
                disabled={actionsPending}
              >
                Change Room
              </Button>
            )}
            {canExtend && (
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                icon={ArrowRight}
                onClick={() => {
                  setNewCheckOut(booking.checkOut || "");
                  setExtendOpen(true);
                }}
                disabled={actionsPending}
              >
                Extend Stay
              </Button>
            )}
          </div>
          {canModify && (
            <Button
              className="w-full"
              onClick={() => navigate(`/reservations/${booking.id}/edit`)}
            >
              View / Edit Full Reservation →
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-3">
        {tab === "overview" && (
          <>
            <PaneCard title="Guest Information">
              <div className="flex items-center gap-3">
                <span className="bg-brand-700 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white">
                  {guestInitials(booking.name)}
                </span>
                <div className="min-w-0">
                  <p className="text-brand-900 text-sm font-semibold">
                    {booking.name}
                    {booking.otaInfo ? (
                      <span className="ml-2 align-middle text-xs font-medium text-orange-600">
                        {sourceLabel(booking)}
                      </span>
                    ) : null}
                  </p>
                  <p className="text-surface-500 text-xs">
                    {booking.phone || booking.email || "—"}
                  </p>
                  {booking.address && (
                    <p className="text-surface-500 text-xs">
                      {booking.address}
                    </p>
                  )}
                </div>
              </div>
            </PaneCard>

            <PaneCard title="Reservation Details">
              <DetailRow
                label="Reservation No."
                value={booking.reservationNo || booking.id}
              />
              <DetailRow label="Source" value={sourceLabel(booking)} />
              <DetailRow
                label="Booked On"
                value={
                  booking.bookedOn
                    ? formatDate(booking.bookedOn)
                    : formatDate(booking.createdAt)
                }
              />
              <DetailRow
                label="Check-in"
                value={`${formatDate(booking.checkIn)}`}
              />
              <DetailRow
                label="Check-out"
                value={`${formatDate(booking.checkOut)}`}
              />
              <DetailRow label="Nights" value={booking.nights} />
              <DetailRow label="Rooms" value={booking.rooms} />
              <DetailRow
                label="Guests"
                value={`${booking.adults} Adults, ${booking.children} Children`}
              />
              <DetailRow
                label="Rate Plan"
                value={booking.ratePlan?.name || "Standard rate"}
              />
              <DetailRow
                label="Total Amount"
                value={formatCurrency(booking.totalAmount)}
              />
              <DetailRow
                label="Payment Status"
                value={
                  <StatusChip
                    variant={
                      booking.paymentStatus === "paid"
                        ? "confirmed"
                        : booking.paymentStatus === "partially-paid"
                          ? "pending"
                          : "neutral"
                    }
                  >
                    {booking.paymentStatus === "paid"
                      ? "Paid"
                      : booking.paymentStatus === "partially-paid"
                        ? "Partially Paid"
                        : isOta &&
                            booking.otaInfo?.paymentStatus === "prepaid-by-ota"
                          ? "Prepaid by OTA"
                          : "Unpaid"}
                  </StatusChip>
                }
              />
            </PaneCard>
            {booking.specialRequests && (
              <PaneCard title="Special Requests">
                <p className="text-surface-600 text-sm">
                  {booking.specialRequests}
                </p>
              </PaneCard>
            )}
          </>
        )}

        {tab === "guest" && (
          <PaneCard title="Guest Details">
            <DetailRow label="Name" value={booking.name} />
            <DetailRow label="Phone" value={booking.phone} />
            <DetailRow label="Email" value={booking.email} />
            <DetailRow label="Address" value={booking.address || "—"} />
            <DetailRow label="Nationality" value={booking.nationality || "—"} />
            <DetailRow label="ID Type" value={booking.idType} />
            <DetailRow label="ID Number" value={booking.idNumber} />
            {booking.documents?.length > 0 && (
              <div className="mt-2 border-t border-gray-100 pt-2">
                <p className="text-surface-500 mb-1.5 text-xs">Documents</p>
                <ul className="space-y-1">
                  {booking.documents.map((d) => (
                    <li key={d.id || d.filename}>
                      {d.url ? (
                        <a
                          href={d.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-brand-700 text-xs font-medium underline-offset-2 hover:underline"
                        >
                          {d.filename} {d.docType ? `(${d.docType})` : ""}
                        </a>
                      ) : (
                        <span className="text-surface-500 text-xs">
                          {d.filename}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </PaneCard>
        )}

        {tab === "stay" && (
          <PaneCard title="Stay Details">
            <DetailRow label="Check-in" value={formatDate(booking.checkIn)} />
            <DetailRow label="Check-out" value={formatDate(booking.checkOut)} />
            <DetailRow label="Nights" value={booking.nights} />
            <DetailRow
              label="Room Type"
              value={booking.roomTypeCode || booking.room?.type || "—"}
            />
            <DetailRow
              label="Assigned Room"
              value={
                booking.room?.roomNumber
                  ? `Room ${booking.room.roomNumber}`
                  : "Auto-assign"
              }
            />
            <DetailRow label="Rooms" value={booking.rooms} />
            <DetailRow
              label="Occupancy"
              value={`${booking.adults} adults, ${booking.children} children, ${booking.infants} infants`}
            />
            <DetailRow label="Purpose" value={booking.purpose || "—"} />
            <DetailRow label="Guest Type" value={booking.guestType} />
          </PaneCard>
        )}

        {tab === "billing" && (
          <>
            <PaneCard title="Billing">
              {pricing ? (
                <>
                  <DetailRow
                    label={`${formatCurrency(pricing.nightlyRate)} × ${pricing.nights} night${pricing.nights === 1 ? "" : "s"}${pricing.rooms > 1 ? ` × ${pricing.rooms} rooms` : ""}`}
                    value={formatCurrency(pricing.roomCharge)}
                  />
                  {pricing.addOnsTotal > 0 && (
                    <DetailRow
                      label="Add-ons"
                      value={formatCurrency(pricing.addOnsTotal)}
                    />
                  )}
                  {pricing.discount?.amount > 0 && (
                    <DetailRow
                      label={
                        pricing.discount.type === "percent"
                          ? `Discount (${pricing.discount.value}%)`
                          : "Discount"
                      }
                      value={`−${formatCurrency(pricing.discount.amount)}`}
                    />
                  )}
                  <DetailRow
                    label={`Taxes & Charges (${pricing.taxPercent}%)`}
                    value={formatCurrency(pricing.taxAmount)}
                  />
                  <DetailRow
                    label="Total"
                    value={formatCurrency(pricing.grandTotal)}
                  />
                </>
              ) : (
                <DetailRow
                  label="Total"
                  value={formatCurrency(booking.totalAmount)}
                />
              )}
            </PaneCard>
            {isOta && booking.otaInfo && (
              <PaneCard title="OTA Settlement">
                <DetailRow label="Channel" value={sourceLabel(booking)} />
                <DetailRow
                  label="OTA Booking ID"
                  value={booking.otaInfo.otaBookingId || "—"}
                />
                <DetailRow
                  label="Confirmation Code"
                  value={booking.otaInfo.confirmationCode || "—"}
                />
                <DetailRow
                  label={`OTA Commission (${booking.otaInfo.commissionPercent ?? 0}%)`}
                  value={`−${formatCurrency(booking.otaInfo.commissionAmount)}`}
                />
                <DetailRow
                  label="Net Amount (to property)"
                  value={formatCurrency(booking.otaInfo.netAmount)}
                />
                <DetailRow
                  label="Settlement"
                  value={
                    booking.otaInfo.paymentStatus === "prepaid-by-ota"
                      ? "Prepaid by OTA"
                      : "Pay at Hotel"
                  }
                />
              </PaneCard>
            )}
          </>
        )}

        {tab === "history" && (
          <PaneCard title="History">
            {history.isLoading ? (
              <p className="text-surface-500 text-xs">Loading…</p>
            ) : history.history.length === 0 ? (
              <p className="text-surface-500 text-xs">No history yet.</p>
            ) : (
              <ol className="border-surface-200 relative ml-1 space-y-3 border-l pl-4">
                {history.history.map((h, i) => (
                  // Audit entries are append-only; ordering is stable.
                  // oxlint-disable-next-line react/no-array-index-key
                  <li key={i} className="text-sm">
                    <span className="bg-brand-300 absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full" />
                    <p className="text-brand-900 font-medium capitalize">
                      {h.action?.replace(/-/g, " ")}
                      {h.from && h.to ? ` — ${h.from} → ${h.to}` : ""}
                    </p>
                    <p className="text-surface-500 text-xs">
                      {formatDate(h.at)} {formatTime(h.at)}
                      {h.note ? ` · ${h.note}` : ""}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </PaneCard>
        )}
      </div>

      {/* Cancel dialog */}
      <ConfirmDialog
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        title="Cancel Reservation?"
        tone="danger"
        confirmLabel="Cancel Reservation"
        cancelLabel="Keep Reservation"
        reasonRequired
        reasonLabel="Cancellation reason"
        reasonPlaceholder="e.g. Guest called to cancel"
        loading={cancel.isPending}
        banner={
          isOta ? (
            <InlineBanner variant="warning">
              {booking.otaInfo?.cancellationPolicy?.freeUntil &&
              new Date() <
                new Date(booking.otaInfo.cancellationPolicy.freeUntil)
                ? "Within the free-cancellation window — no charge."
                : "This OTA booking is past its free-cancellation window — a one-night charge applies."}
            </InlineBanner>
          ) : undefined
        }
        message={
          <>
            Cancel <strong>{booking.reservationNo || booking.id}</strong>
            {booking.room?.roomNumber
              ? ` — Room ${booking.room.roomNumber} will be freed.`
              : ""}
          </>
        }
        onConfirm={(reason) =>
          run(cancel, { id: booking.id, reason }, () => setConfirmCancel(false))
        }
      />

      {/* Change room dialog */}
      <ConfirmDialog
        open={changeRoomOpen}
        onClose={() => setChangeRoomOpen(false)}
        title="Change Room"
        tone="primary"
        confirmLabel="Change Room"
        cancelLabel="Cancel"
        loading={changeRoom.isPending}
        message={
          <div className="space-y-3">
            <p className="text-surface-600 text-sm">
              Currently:{" "}
              <strong>
                {booking.room?.roomNumber
                  ? `Room ${booking.room.roomNumber}`
                  : "Auto-assign"}
              </strong>
            </p>
            <select
              aria-label="New room"
              value={newRoomId}
              onChange={(e) => setNewRoomId(e.target.value)}
              className="text-brand-900 focus:border-primary-500 focus:ring-primary-500/15 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2"
            >
              <option value="">Select a room…</option>
              {(availableRooms.rooms || []).map((r) => (
                <option key={r.id} value={r.id}>
                  Room {r.roomNumber}
                  {r.floor != null ? ` · Floor ${r.floor}` : ""} · {r.status}
                </option>
              ))}
            </select>
          </div>
        }
        onConfirm={() =>
          newRoomId &&
          run(changeRoom, { id: booking.id, roomId: newRoomId }, () =>
            setChangeRoomOpen(false),
          )
        }
      />

      {/* Extend stay dialog */}
      <ConfirmDialog
        open={extendOpen}
        onClose={() => setExtendOpen(false)}
        title="Extend Stay"
        tone="primary"
        confirmLabel="Extend Stay"
        cancelLabel="Cancel"
        loading={extendStay.isPending}
        message={
          <div className="space-y-3">
            <p className="text-surface-600 text-sm">
              Current check-out: <strong>{formatDate(booking.checkOut)}</strong>
            </p>
            <Input
              label="New check-out date"
              name="extend-checkOut"
              type="date"
              min={booking.checkOut}
              value={newCheckOut}
              onChange={(e) => setNewCheckOut(e.target.value)}
            />
          </div>
        }
        onConfirm={() =>
          newCheckOut &&
          run(extendStay, { id: booking.id, checkOut: newCheckOut }, () =>
            setExtendOpen(false),
          )
        }
      />
    </DetailDrawer>
  );
}

export default ReservationDetailPane;
