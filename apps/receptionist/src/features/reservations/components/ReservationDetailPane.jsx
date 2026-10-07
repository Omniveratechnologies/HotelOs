import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  DetailDrawer,
  StatusChip,
  InlineBanner,
  Button,
  ConfirmDialog,
  Input,
  Modal,
} from "@hotelos/ui/components";
import {
  BedDouble,
  XCircle,
  RefreshCcw,
  BedSingle,
  LogIn,
  ExternalLink,
  User,
  CalendarRange,
} from "lucide-react";
import {
  formatCurrency,
  formatDate,
  formatTime,
  toLocalDateString,
} from "@hotelos/utils";
import {
  useReservation,
  useUpdateReservation,
} from "../hooks/useReservations.js";
import { useReservationHistory } from "../hooks/useAllReservations.js";
import { useAvailableRooms } from "../hooks/useAvailableRooms.js";
import { useRoomTypes } from "../../room-types/hooks/useRoomTypes.js";
import {
  useCancelReservation,
  useReconfirmReservation,
  useChangeReservationRoom,
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

function getEditUrl(booking) {
  const id = booking.id || booking._id;
  const src = (booking.source || "").toUpperCase();
  if (src === "CORPORATE") return `/reservations/corporate/${id}/edit`;
  if (src === "GROUP") return `/reservations/group/${id}/edit`;
  if (src === "PHONE") return `/reservations/phone/${id}/edit`;
  if (src === "WEBSITE") return `/reservations/website/${id}/edit`;
  if (src === "REPEAT_GUEST") return `/reservations/repeat/${id}/edit`;
  return `/reservations/${id}/edit`;
}

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

function StayEditModal({
  booking,
  roomTypeOptions,
  onClose,
  onSave,
  isSaving,
}) {
  const [checkIn, setCheckIn] = useState(
    () => toLocalDateString(booking.checkIn) || "",
  );
  const [checkOut, setCheckOut] = useState(
    () => toLocalDateString(booking.checkOut) || "",
  );
  const [roomTypeCode, setRoomTypeCode] = useState(
    () =>
      booking.roomTypeCode ||
      booking.room?.roomCode ||
      booking.room?.type ||
      "",
  );
  const [roomId, setRoomId] = useState(() =>
    booking.roomId ? String(booking.roomId?._id || booking.roomId) : "",
  );
  const [rooms, setRooms] = useState(() => booking.rooms || 1);
  const [adults, setAdults] = useState(() => booking.adults || 1);
  const [children, setChildren] = useState(() => booking.children || 0);
  const [mealPlan, setMealPlan] = useState(() => booking.mealPlan || "EP");
  const [requests, setRequests] = useState(() => booking.specialRequests || "");
  const [localError, setLocalError] = useState("");

  const availableRoomsQuery = useAvailableRooms({
    roomTypeCode,
    checkIn,
    checkOut,
    enabled: Boolean(roomTypeCode && checkIn && checkOut),
  });

  const currentAssignedRoom = booking?.room;
  const roomOptions = useMemo(() => {
    const list = [...(availableRoomsQuery?.rooms || [])];
    const curId = currentAssignedRoom?._id || currentAssignedRoom?.id;
    if (curId && !list.some((r) => String(r.id || r._id) === String(curId))) {
      list.unshift({
        id: curId,
        _id: curId,
        roomNumber: currentAssignedRoom.roomNumber,
        floor: currentAssignedRoom.floor,
        status: "current",
      });
    }
    return list;
  }, [availableRoomsQuery?.rooms, currentAssignedRoom]);

  const handleSubmit = () => {
    if (!checkIn || !checkOut) {
      setLocalError("Please provide both check-in and check-out dates");
      return;
    }
    if (new Date(checkOut) <= new Date(checkIn)) {
      setLocalError("Check-out date must be after check-in date");
      return;
    }
    setLocalError("");
    onSave({
      checkIn,
      checkOut,
      roomTypeCode: roomTypeCode || undefined,
      roomId: roomId || undefined,
      rooms: Math.max(1, Number(rooms) || 1),
      adults: Math.max(1, Number(adults) || 1),
      children: Math.max(0, Number(children) || 0),
      mealPlan: mealPlan || undefined,
      specialRequests: requests?.trim() || undefined,
    });
  };

  return (
    <Modal
      open={true}
      onClose={onClose}
      title="Edit Stay Details"
      subtitle={`Editing stay for ${booking.reservationNo || booking.id || booking._id} (${booking.name || "Guest"})`}
      maxWidth="md"
    >
      <div className="space-y-4 p-1">
        {localError && (
          <InlineBanner variant="error">{localError}</InlineBanner>
        )}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label="Check-in Date"
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            required
          />
          <Input
            label="Check-out Date"
            type="date"
            min={checkIn || undefined}
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="text-brand-900 mb-1.5 block text-sm font-semibold">
              Room Type
            </label>
            <select
              value={roomTypeCode}
              onChange={(e) => {
                setRoomTypeCode(e.target.value);
                setRoomId("");
              }}
              className="text-brand-900 focus:border-primary-500 focus:ring-primary-500/15 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2"
            >
              <option value="">Select Room Type…</option>
              {roomTypeOptions.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label} ({t.value})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-brand-900 mb-1.5 block text-sm font-semibold">
              Assigned Room
            </label>
            <select
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="text-brand-900 focus:border-primary-500 focus:ring-primary-500/15 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2"
            >
              <option value="">Auto-assign (No room locked)</option>
              {roomOptions.map((r) => (
                <option key={r.id || r._id} value={r.id || r._id}>
                  Room {r.roomNumber}
                  {r.floor != null ? ` · Floor ${r.floor}` : ""}{" "}
                  {r.status ? `(${r.status})` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Input
            label="Rooms"
            type="number"
            min={1}
            value={rooms}
            onChange={(e) => setRooms(Math.max(1, Number(e.target.value)))}
            required
          />
          <Input
            label="Adults"
            type="number"
            min={1}
            value={adults}
            onChange={(e) => setAdults(Math.max(1, Number(e.target.value)))}
            required
          />
          <Input
            label="Children"
            type="number"
            min={0}
            value={children}
            onChange={(e) => setChildren(Math.max(0, Number(e.target.value)))}
          />
        </div>

        <div>
          <label className="text-brand-900 mb-1.5 block text-sm font-semibold">
            Meal Plan
          </label>
          <select
            value={mealPlan}
            onChange={(e) => setMealPlan(e.target.value)}
            className="text-brand-900 focus:border-primary-500 focus:ring-primary-500/15 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2"
          >
            <option value="EP">EP — European Plan (Room Only)</option>
            <option value="CP">CP — Continental Plan (Bed & Breakfast)</option>
            <option value="MAP">
              MAP — Modified American Plan (Half Board)
            </option>
            <option value="AP">AP — American Plan (Full Board)</option>
          </select>
        </div>

        <div>
          <label className="text-brand-900 mb-1.5 block text-sm font-semibold">
            Special Requests & Stay Notes
          </label>
          <textarea
            rows={3}
            value={requests}
            onChange={(e) => setRequests(e.target.value)}
            placeholder="Guest preferences, arrival notes, high floor, quiet room…"
            className="text-brand-900 focus:border-primary-500 focus:ring-primary-500/15 w-full rounded-lg border border-gray-200 bg-white p-3 text-sm outline-none focus:ring-2"
          />
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={isSaving}>
            Save Stay Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function GuestEditModal({ booking, onClose, onSave, isSaving }) {
  const [name, setName] = useState(() => booking.name || "");
  const [phone, setPhone] = useState(() => booking.phone || "");
  const [email, setEmail] = useState(() => booking.email || "");
  const [idType, setIdType] = useState(() => booking.idType || "Aadhaar");
  const [idNumber, setIdNumber] = useState(() => booking.idNumber || "");
  const [paymentStatus, setPaymentStatus] = useState(
    () => booking.paymentStatus || "unpaid",
  );
  const [localError, setLocalError] = useState("");

  const handleSubmit = () => {
    if (!name.trim()) {
      setLocalError("Guest name is required");
      return;
    }
    setLocalError("");
    onSave({
      name: name.trim(),
      phone: phone.trim(),
      email: email?.trim() || undefined,
      idType: idType || undefined,
      idNumber: idNumber?.trim() || undefined,
      paymentStatus,
    });
  };

  return (
    <Modal
      open={true}
      onClose={onClose}
      title="Edit Guest Details"
      subtitle={`Guest profile for ${booking.reservationNo || booking.id || booking._id}`}
      maxWidth="md"
    >
      <div className="space-y-4 p-1">
        {localError && (
          <InlineBanner variant="error">{localError}</InlineBanner>
        )}
        <Input
          label="Guest Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label="Contact Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <Input
            label="Contact Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="text-brand-900 mb-1.5 block text-sm font-semibold">
              ID Type
            </label>
            <select
              value={idType}
              onChange={(e) => setIdType(e.target.value)}
              className="text-brand-900 focus:border-primary-500 focus:ring-primary-500/15 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2"
            >
              <option value="Aadhaar">Aadhaar</option>
              <option value="Passport">Passport</option>
              <option value="Driving License">Driving License</option>
              <option value="Voter ID">Voter ID</option>
              <option value="PAN">PAN</option>
            </select>
          </div>
          <Input
            label="ID Number"
            value={idNumber}
            onChange={(e) => setIdNumber(e.target.value)}
            placeholder="e.g. 1234 5678 9012"
          />
        </div>

        <div>
          <label className="text-brand-900 mb-1.5 block text-sm font-semibold">
            Payment Status
          </label>
          <select
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
            className="text-brand-900 focus:border-primary-500 focus:ring-primary-500/15 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2"
          >
            <option value="unpaid">Unpaid</option>
            <option value="partially-paid">Partially Paid</option>
            <option value="paid">Paid in Full</option>
          </select>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={isSaving}>
            Save Guest Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/**
 * Right-side reservation detail pane (docked ≥1280 via parent layout, overlay
 * below) with tabs, quick in-place edits (Stay & Guest), and full edit navigation.
 *
 * @param {Object} props
 * @param {object|null} props.reservation - Selected list row.
 * @param {string|null} [props.reservationId] - ID of the selected reservation.
 * @param {'overlay'|'docked'} props.variant
 * @param {() => void} props.onClose
 * @param {() => void} [props.onChanged]
 */
export function ReservationDetailPane({
  reservation,
  reservationId,
  variant,
  onClose,
  onChanged,
}) {
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");

  // Dialog & modal states
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [changeRoomOpen, setChangeRoomOpen] = useState(false);
  const [stayEditOpen, setStayEditOpen] = useState(false);
  const [guestEditOpen, setGuestEditOpen] = useState(false);

  // Form states for small edits
  const [newRoomId, setNewRoomId] = useState("");
  const [actionError, setActionError] = useState("");

  const resId = reservationId || reservation?.id || reservation?._id;
  const detail = useReservation(resId);
  const history = useReservationHistory(resId, tab === "history");

  const cancel = useCancelReservation();
  const reconfirm = useReconfirmReservation();
  const changeRoom = useChangeReservationRoom();
  const updateRes = useUpdateReservation();

  const booking = detail.data || reservation;

  const actionsPending =
    cancel.isPending ||
    reconfirm.isPending ||
    changeRoom.isPending ||
    updateRes.isPending;

  const run = (mutation, payload, onDone) => {
    setActionError("");
    mutation.mutateAsync(payload).then(
      () => {
        onDone?.();
        detail.refetch();
        onChanged?.();
      },
      (err) => setActionError(err.message || "Action failed"),
    );
  };

  const { roomTypes } = useRoomTypes();
  const roomTypeOptions = useMemo(
    () =>
      (roomTypes || [])
        .filter((t) => t.active !== false)
        .map((t) => ({ value: t.roomCode, label: t.name })),
    [roomTypes],
  );

  const availableRooms = useAvailableRooms({
    roomTypeCode: booking?.roomTypeCode,
    checkIn: booking?.checkIn,
    checkOut: booking?.checkOut,
    enabled: changeRoomOpen,
  });

  if (!reservation && !booking) return null;

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
  const canCheckIn = ["confirmed", "reserved"].includes(booking.status);

  const pricing = booking.pricing;

  return (
    <DetailDrawer
      open={Boolean(reservation || booking)}
      onClose={onClose}
      variant={variant}
      widthClassName={variant === "overlay" ? "w-full max-w-110" : "w-full"}
      title={
        <span className="flex items-center gap-2">
          {booking.reservationNo || booking.id || booking._id}
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
        <div className="space-y-2.5">
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

          {/* Row 1: Small In-Place Edits */}
          <div className="grid grid-cols-3 gap-2">
            {canModify && (
              <Button
                variant="secondary"
                size="sm"
                icon={CalendarRange}
                onClick={() => setStayEditOpen(true)}
                disabled={actionsPending}
                title="Quick edit stay details (dates, room, occupancy, meal plan)"
                className="justify-center text-xs"
              >
                Edit Stay
              </Button>
            )}
            {canModify && (
              <Button
                variant="secondary"
                size="sm"
                icon={User}
                onClick={() => setGuestEditOpen(true)}
                disabled={actionsPending}
                title="Quick edit guest info and contact details"
                className="justify-center text-xs"
              >
                Edit Guest
              </Button>
            )}
            {canChangeRoom && (
              <Button
                variant="secondary"
                size="sm"
                icon={BedSingle}
                onClick={() => {
                  setNewRoomId(booking.roomId ? String(booking.roomId) : "");
                  setChangeRoomOpen(true);
                }}
                disabled={actionsPending}
                className="justify-center text-xs"
              >
                Room
              </Button>
            )}
          </div>

          {/* Row 2: Status & Operational Actions */}
          <div className="flex flex-wrap gap-2">
            {canCheckIn && (
              <Button
                variant="primary"
                size="sm"
                icon={LogIn}
                className="flex-1 justify-center text-xs"
                onClick={() => {
                  const bId = booking.id || booking._id;
                  const rId = booking.roomId?._id || booking.roomId || "";
                  navigate(
                    `/front-desk/check-in?roomId=${rId}&bookingId=${bId}&guest=${encodeURIComponent(booking.name || "")}`,
                  );
                }}
                disabled={actionsPending}
              >
                Check-in Guest
              </Button>
            )}
            {canCancel && (
              <Button
                variant="dangerGhost"
                size="sm"
                icon={XCircle}
                onClick={() => setConfirmCancel(true)}
                disabled={actionsPending}
                className="text-xs"
              >
                Cancel
              </Button>
            )}
            {canReconfirm && (
              <Button
                variant="secondary"
                size="sm"
                icon={RefreshCcw}
                onClick={() => run(reconfirm, booking.id || booking._id)}
                loading={reconfirm.isPending}
                className="text-xs"
              >
                Reconfirm
              </Button>
            )}
          </div>

          {/* Row 3: Full Wizard Edit */}
          {canModify && (
            <Button
              variant="secondary"
              className="text-brand-900 w-full justify-center border-gray-300 font-semibold shadow-2xs hover:bg-gray-50"
              icon={ExternalLink}
              onClick={() => navigate(getEditUrl(booking))}
            >
              Full Edit Reservation →
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
                value={booking.reservationNo || booking.id || booking._id}
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

      {/* Quick Edit Stay Details Modal */}
      {stayEditOpen && (
        <StayEditModal
          booking={booking}
          roomTypeOptions={roomTypeOptions}
          onClose={() => setStayEditOpen(false)}
          onSave={(updates) => {
            const bId = booking.id || booking._id;
            run(updateRes, { id: bId, updates }, () => setStayEditOpen(false));
          }}
          isSaving={updateRes.isPending}
        />
      )}

      {/* Quick Edit Guest Details Modal */}
      {guestEditOpen && (
        <GuestEditModal
          booking={booking}
          onClose={() => setGuestEditOpen(false)}
          onSave={(updates) => {
            const bId = booking.id || booking._id;
            run(updateRes, { id: bId, updates }, () => setGuestEditOpen(false));
          }}
          isSaving={updateRes.isPending}
        />
      )}

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
            Cancel{" "}
            <strong>
              {booking.reservationNo || booking.id || booking._id}
            </strong>
            {booking.room?.roomNumber
              ? ` — Room ${booking.room.roomNumber} will be freed.`
              : ""}
          </>
        }
        onConfirm={(reason) => {
          const bId = booking.id || booking._id;
          run(cancel, { id: bId, reason }, () => setConfirmCancel(false));
        }}
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
                <option key={r.id || r._id} value={r.id || r._id}>
                  Room {r.roomNumber}
                  {r.floor != null ? ` · Floor ${r.floor}` : ""} · {r.status}
                </option>
              ))}
            </select>
          </div>
        }
        onConfirm={() => {
          const bId = booking.id || booking._id;
          if (newRoomId) {
            run(changeRoom, { id: bId, roomId: newRoomId }, () =>
              setChangeRoomOpen(false),
            );
          }
        }}
      />
    </DetailDrawer>
  );
}

export default ReservationDetailPane;
