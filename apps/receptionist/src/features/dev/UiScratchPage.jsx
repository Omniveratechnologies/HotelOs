// TEMPORARY scratch page — Step 1a visual/compile check. NOT committed.
import { useState } from "react";
import {
  Stepper,
  SectionCard,
  KpiTile,
  KpiTileRow,
  StatusChip,
  TabsWithCounts,
  InlineBanner,
  EmptyState,
  DetailDrawer,
  SummaryPanel,
  ChoiceCardGroup,
  SelectableMediaCard,
  ToggleRow,
  QuantityStepper,
  FilterBar,
  ConfirmDialog,
  FileCaptureField,
  SignaturePad,
  Button,
} from "@hotelos/ui/components";
import StayDetailsSection from "../reservations/sections/StayDetailsSection.jsx";
import RoomTypePicker from "../reservations/sections/RoomTypePicker.jsx";
import RatePlanPicker from "../reservations/sections/RatePlanPicker.jsx";
import RoomSelection from "../reservations/sections/RoomSelection.jsx";
import GuestSection from "../reservations/sections/GuestSection.jsx";
import AdditionalOptionsSection from "../reservations/sections/AdditionalOptionsSection.jsx";
import BookingSummary from "../reservations/sections/BookingSummary.jsx";
import { useAvailability } from "../reservations/hooks/useAvailability.js";
import { useQuote } from "../reservations/hooks/useQuote.js";
import { useGuestSearch } from "../reservations/hooks/useGuestSearch.js";
import { useReservationStats } from "../reservations/hooks/useReservationStats.js";

const CalendarIcon = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
  </svg>
);

export default function UiScratchPage() {
  const [tab, setTab] = useState("all");
  const [choice, setChoice] = useState("bar");
  const [toggle, setToggle] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [drawerTab, setDrawerTab] = useState("overview");
  const [step, setStep] = useState(1);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [range, setRange] = useState({ from: "2026-10-01", to: "2026-10-31" });
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [idFile, setIdFile] = useState(null);
  const [signature, setSignature] = useState(null);
  const [stay, setStay] = useState({
    checkIn: "2026-10-03",
    checkOut: "2026-10-05",
    rooms: 1,
    adults: 2,
    children: 0,
    infants: 0,
    purpose: "",
    source: "DIRECT",
    guestType: "individual",
    specialRequests: "",
  });
  const [roomType, setRoomType] = useState("executive");
  const [ratePlan, setRatePlan] = useState("bar");
  const [preferRoom, setPreferRoom] = useState(false);
  const [roomIdSel, setRoomIdSel] = useState("");
  const [guestMode, setGuestMode] = useState("new");
  const [guestQuery, setGuestQuery] = useState("");
  const [guestForm, setGuestForm] = useState({
    name: "",
    phone: "",
    phonePrefix: "+91",
    email: "",
    nationality: "Indian",
    idType: "Aadhaar",
    idNumber: "",
  });
  const [addOns, setAddOns] = useState([]);
  // Step 4 hooks smoke check (offline-safe: queries disabled / mutation never fired)
  useAvailability({ checkIn: stay.checkIn, checkOut: stay.checkOut });
  useQuote();
  useGuestSearch(guestQuery, false);
  useReservationStats();

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-brand-900 text-xl font-bold">UI Scratch (Step 1a)</h1>

      <Stepper
        steps={[
          { id: "stay", title: "Stay Details", subtitle: "Dates, guests" },
          { id: "room", title: "Select Room", subtitle: "Type & rate" },
          { id: "guest", title: "Guest Details", subtitle: "Contact & ID" },
          { id: "options", title: "Additional Options", subtitle: "Add-ons" },
          { id: "confirm", title: "Confirm & Create", subtitle: "Review" },
        ]}
        currentIndex={step}
        onStepClick={setStep}
      />
      <Button onClick={() => setStep((s) => Math.min(4, s + 1))}>
        Next step
      </Button>

      <SectionCard number="1" title="SectionCard (open)">
        <p className="text-sm text-gray-600">Body content.</p>
      </SectionCard>
      <SectionCard
        number="2"
        title="SectionCard (collapsed)"
        open={false}
        summary="Oct 3 → Oct 5 · 2 nights · 2 adults"
        onEdit={() => {}}
      />
      <SectionCard number="3" title="SectionCard (disabled)" disabled />

      <KpiTileRow>
        <KpiTile
          icon={CalendarIcon}
          value={128}
          label="Total"
          delta="+12% from last month"
          deltaTone="up"
          onClick={() => {}}
        />
        <KpiTile
          value={36}
          label="OTA"
          delta="28% of total"
          active
          onClick={() => {}}
        />
        <KpiTile
          value={1}
          label="Rejected"
          delta="Needs action"
          deltaTone="down"
        />
      </KpiTileRow>

      <div className="flex flex-wrap gap-2">
        <StatusChip variant="confirmed">Confirmed</StatusChip>
        <StatusChip variant="pending">Pending</StatusChip>
        <StatusChip variant="checked-in">Checked-in</StatusChip>
        <StatusChip variant="checked-out">Checked-out</StatusChip>
        <StatusChip variant="cancelled">Cancelled</StatusChip>
        <StatusChip variant="draft">Draft</StatusChip>
      </div>

      <TabsWithCounts
        tabs={[
          { id: "all", label: "All", count: 128 },
          { id: "ota", label: "OTA", count: 36 },
          { id: "website", label: "Website", count: 32 },
        ]}
        activeId={tab}
        onChange={setTab}
      />

      <InlineBanner variant="info">Info banner with a message.</InlineBanner>
      <InlineBanner variant="success">All documents submitted.</InlineBanner>
      <InlineBanner variant="warning">Room availability is low.</InlineBanner>
      <InlineBanner variant="error" action={<a href="#x">Retry</a>}>
        Failed to load.
      </InlineBanner>

      <EmptyState
        icon={CalendarIcon}
        title="No reservations found"
        hint="Create a new reservation to get started."
        action={<Button>+ New Reservation</Button>}
      />

      <Button onClick={() => setDrawer(true)}>Open drawer</Button>
      <DetailDrawer
        open={drawer}
        onClose={() => setDrawer(false)}
        title="HOS-2026-001"
        subtitle={<StatusChip variant="confirmed">Confirmed</StatusChip>}
        tabs={[
          { id: "overview", label: "Overview" },
          { id: "guest", label: "Guest Details" },
          { id: "billing", label: "Billing" },
        ]}
        activeTabId={drawerTab}
        onTabChange={setDrawerTab}
        footer={
          <Button className="w-full">View / Edit Full Reservation</Button>
        }
      >
        <p className="text-sm text-gray-600">Drawer body for {drawerTab}.</p>
      </DetailDrawer>

      <SummaryPanel
        title="Booking Summary"
        media={{
          title: "Executive Room",
          lines: ["2 Adults, 0 Children", "Oct 3 – Oct 5, 2026 (2 Nights)"],
        }}
        items={[
          { label: "₹2,499 × 2 nights", amount: "₹4,998" },
          { label: "Taxes & Charges (12%)", amount: "₹600" },
          { label: "Discount (5%)", amount: "−₹250", tone: "discount" },
        ]}
        total={{ label: "Total Amount", amount: "₹5,348" }}
        note="Free cancellation up to 24 hours before check-in."
        footer={
          <>
            <Button variant="secondary" className="w-full">
              Save as Draft
            </Button>
            <Button className="w-full">Create Reservation →</Button>
          </>
        }
      />
      <SummaryPanel loading />

      <ChoiceCardGroup
        name="rateplan"
        value={choice}
        onChange={setChoice}
        options={[
          {
            id: "bar",
            title: "Best Available",
            description: "Flexible rate",
            price: "₹2,499 / night",
          },
          {
            id: "nonref",
            title: "Non-Refundable",
            description: "Lowest price",
            price: "₹2,249 / night",
          },
          {
            id: "bb",
            title: "Breakfast Included",
            description: "CP plan",
            price: "₹2,799 / night",
            disabled: false,
          },
        ]}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SelectableMediaCard
          title="Executive Room"
          meta={[
            { icon: CalendarIcon, text: 2 },
            { icon: CalendarIcon, text: "Queen bed" },
          ]}
          price="₹2,499"
          availabilityCount={12}
          selected={false}
          onSelect={() => {}}
        />
        <SelectableMediaCard
          title="Deluxe Room"
          price="₹3,499"
          availabilityCount={3}
          selected
          onSelect={() => {}}
        />
        <SelectableMediaCard
          title="Suite"
          price="₹6,999"
          availabilityCount={0}
          onSelect={() => {}}
        />
      </div>

      <ToggleRow
        label="Prefer specific room"
        description="Pick a room number instead of auto-assign"
        checked={toggle}
        onChange={setToggle}
      />

      <div className="flex gap-6">
        <QuantityStepper
          label="Adults *"
          value={adults}
          onChange={setAdults}
          min={1}
          max={6}
        />
        <QuantityStepper
          label="Children"
          value={children}
          onChange={setChildren}
          min={0}
          max={4}
        />
        <QuantityStepper
          label="Infants"
          value={0}
          onChange={() => {}}
          disabled
        />
      </div>

      <FilterBar
        dateRange={range}
        onDateRangeChange={setRange}
        selects={[
          {
            key: "status",
            label: "All Status",
            value: status,
            options: [
              { value: "confirmed", label: "Confirmed" },
              { value: "pending", label: "Pending" },
            ],
          },
          {
            key: "source",
            label: "All Sources",
            value: "",
            options: [
              { value: "direct", label: "Direct" },
              { value: "ota", label: "OTA" },
            ],
          },
        ]}
        onSelectChange={(k, v) => setStatus(k === "status" ? v : "")}
        search={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search by name, reservation no…"
        onOpenFilters={() => {}}
        onClear={() => {
          setQuery("");
          setStatus("");
        }}
      />

      <Button variant="dangerGhost" onClick={() => setConfirmOpen(true)}>
        Cancel reservation…
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Cancel Reservation?"
        message="This reservation will be cancelled immediately."
        banner={
          <InlineBanner variant="warning">
            Free cancellation until Oct 2, 2026.
          </InlineBanner>
        }
        reasonRequired
        reasonLabel="Cancellation reason"
        reasonPlaceholder="e.g. Guest requested cancellation by phone"
        confirmLabel="Cancel Reservation"
        cancelLabel="Keep Reservation"
        onConfirm={() => setConfirmOpen(false)}
      />

      <div className="grid max-w-xl grid-cols-1 gap-4">
        <FileCaptureField
          label="Government ID"
          file={idFile}
          onCapture={(f) => setIdFile({ name: f.name })}
          onClear={() => setIdFile(null)}
          successMessage="ID captured successfully"
        />
        <SignaturePad label="Guest Signature" onChange={setSignature} />
        {signature && (
          <p className="text-xs text-emerald-600">
            Signature captured ({Math.round(signature.length / 1024)} KB).
          </p>
        )}
      </div>

      <h2 className="text-brand-900 text-lg font-bold">
        Reservation sections (Step 4)
      </h2>

      <StayDetailsSection
        value={stay}
        onChange={(f, v) => setStay((s) => ({ ...s, [f]: v }))}
        errors={{}}
      />

      <RoomTypePicker
        items={[
          {
            roomTypeCode: "executive",
            name: "Executive",
            price: 2499,
            available: 12,
            totalRooms: 14,
            occupancyMax: 2,
          },
          {
            roomTypeCode: "deluxe",
            name: "Deluxe",
            price: 3499,
            available: 3,
            totalRooms: 8,
            occupancyMax: 3,
          },
          {
            roomTypeCode: "suite",
            name: "Suite",
            price: 6999,
            available: 0,
            totalRooms: 2,
            occupancyMax: 4,
          },
        ]}
        value={roomType}
        onSelect={setRoomType}
        range={{ checkIn: stay.checkIn, checkOut: stay.checkOut, nights: 2 }}
        onModifySearch={() => {}}
      />

      <RatePlanPicker
        value={ratePlan}
        onChange={setRatePlan}
        options={[
          { id: "bar", name: "Best Available", rate: 2499, mealPlan: "EP" },
          { id: "bb", name: "Breakfast Included", rate: 2799, mealPlan: "CP" },
        ]}
      />

      <RoomSelection
        preferSpecific={preferRoom}
        onToggle={setPreferRoom}
        rooms={[
          { id: "r1", roomNumber: "101", floor: 1 },
          { id: "r2", roomNumber: "102", floor: 1 },
        ]}
        value={roomIdSel}
        onChange={setRoomIdSel}
      />

      <GuestSection
        mode={guestMode}
        onModeChange={setGuestMode}
        form={guestForm}
        onField={(f, v) => setGuestForm((g) => ({ ...g, [f]: v }))}
        searchQuery={guestQuery}
        onSearchChange={setGuestQuery}
        searchResults={[
          {
            id: "g1",
            name: "Rohit Sharma",
            phone: "+91 98765 43210",
            repeatGuest: true,
            staysCount: 3,
          },
        ]}
        onSelectGuest={() => {}}
      />

      <AdditionalOptionsSection
        addOns={addOns}
        onAddOnsChange={setAddOns}
        specialRequests={stay.specialRequests}
        onSpecialRequestsChange={(v) =>
          setStay((s) => ({ ...s, specialRequests: v }))
        }
      />

      <div className="max-w-md">
        <BookingSummary
          quote={{
            pricing: {
              nightlyRate: 2499,
              nights: 2,
              rooms: 1,
              roomCharge: 4998,
              addOnsTotal: 500,
              addOns: [],
              discount: { type: "percent", value: 5, amount: 250 },
              taxableBase: 5248,
              taxPercent: 12,
              taxAmount: 630,
              grandTotal: 5878,
              currency: "INR",
            },
            availability: { ok: true, available: 12 },
          }}
          media={{
            roomTypeName: "Executive Room",
            guestsLine: "2 Adults, 0 Children",
            datesLine: "Oct 3 – Oct 5, 2026 (2 Nights)",
          }}
          onSaveDraft={() => {}}
          onCreate={() => {}}
        />
      </div>
    </div>
  );
}
