import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@hotelos/query";
import {
  Header,
  Button,
  StatusChip,
  ReceiptModal,
} from "@hotelos/ui/components";
import {
  ArrowRightLeft,
  CheckCircle2,
  ChevronDown,
  FileDown,
  MoreHorizontal,
  Plus,
  Printer,
  Search,
  Share2,
  Split,
  Utensils,
  Wallet,
  WalletCards,
} from "lucide-react";
import { formatCurrency as money } from "@hotelos/utils";
import { billingApi } from "../api/billingApi.js";
import { ActionDrawer, Field, BillingPageSkeleton } from "../components";
import { printFolioStatementA4 } from "../utils/printFolioStatementA4.js";

const EMPTY_ARRAY = [];

const tabs = [
  "Folio",
  "Payments",
  "Invoices",
  "Guest Details",
  "Stay History",
  "Corporate",
  "Remarks",
];
const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-brand-900 shadow-2xs hover:bg-gray-50 transition-colors cursor-pointer";
const EMPTY_CHARGES = [];

export default function GuestFolioPage() {
  const [selectedId, setSelectedId] = useState("");
  const [activeTab, setActiveTab] = useState("Folio");
  const [activeWindow, setActiveWindow] = useState("all");
  const [drawer, setDrawer] = useState("");
  const [selectedChargeIndex, setSelectedChargeIndex] = useState(0);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [transactionType, setTransactionType] = useState("All Transactions");

  const foliosQuery = useQuery({
    queryKey: ["billing", "folios"],
    queryFn: () => billingApi.folio(),
  });
  const folios = Array.isArray(foliosQuery.data) ? foliosQuery.data : [];
  const folioId = selectedId || folios[0]?.id;

  const detailQuery = useQuery({
    queryKey: ["billing", "folio", folioId],
    queryFn: () => billingApi.folioDetail(folioId),
    enabled: Boolean(folioId),
  });
  const aggregate = detailQuery.data || {};
  const folio =
    aggregate.folio || folios.find((item) => item.id === folioId) || {};
  const charges = aggregate.charges || folio.charges || EMPTY_CHARGES;
  const payments = aggregate.payments || [];

  const visibleCharges = useMemo(
    () =>
      charges.filter((charge) => {
        const text =
          `${charge.name || charge.description || ""} ${charge.department || ""}`.toLowerCase();
        const matchesSearch = text.includes(search.toLowerCase());
        const status = String(charge.status || "Posted").toLowerCase();
        const matchesType =
          transactionType === "All Transactions" ||
          (transactionType === "Charges" &&
            !["voided", "adjustment"].includes(status)) ||
          status === transactionType.toLowerCase();
        const win = (charge.folioWindow || "A").toUpperCase();
        const matchesWindow =
          activeWindow === "all" || win === activeWindow.toUpperCase();
        return matchesSearch && matchesType && matchesWindow;
      }),
    [charges, search, transactionType, activeWindow],
  );

  const refresh = () => {
    detailQuery.refetch();
    foliosQuery.refetch();
  };

  const isLoading = foliosQuery.isLoading || detailQuery.isLoading;
  const isError = foliosQuery.isError || detailQuery.isError;

  return (
    <>
      <Header
        pageTitle="Guest Folio"
        pageDescription="View and manage guest charges, payments and invoices."
      >
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => setDrawer("charge")}
          disabled={isLoading}
        >
          Add Charge
        </Button>
      </Header>

      <div className="space-y-6 p-6">
        {/* Folio Search & Select Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-3.5 shadow-xs">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-xs font-medium text-gray-500">
              Active Folio:
            </span>
            <FolioSearchSelect
              folios={folios}
              selectedId={folioId}
              onSelect={setSelectedId}
              isLoading={isLoading}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={Split}
              onClick={() => setDrawer("split")}
              disabled={isLoading || !folioId}
            >
              Split Folio
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={Share2}
              onClick={() => setDrawer("merge")}
              disabled={isLoading || !folioId}
            >
              Merge Folio
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={MoreHorizontal}
              onClick={() => setDrawer("menu")}
              aria-label="More folio actions"
              disabled={isLoading || !folioId}
            />
          </div>
        </div>

        {isError ? (
          <div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">
            Guest folio could not be loaded. Please retry.
          </div>
        ) : isLoading ? (
          <BillingPageSkeleton kpis={4} tableRows={6} />
        ) : !folioId ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-500">
            No open guest folios are available.
          </div>
        ) : (
          <>
            <GuestStrip folio={folio} />
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
              <main className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
                <div className="flex overflow-x-auto border-b border-gray-100 px-4">
                  {tabs.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`cursor-pointer px-4 py-3 text-xs font-semibold whitespace-nowrap transition-colors ${
                        activeTab === tab
                          ? "border-brand-900 text-brand-900 border-b-2"
                          : "hover:text-brand-900 text-gray-500"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                {activeTab === "Folio" ? (
                  <>
                    {/* Multi-Window Folio Tabs */}
                    <div className="flex items-center gap-1.5 border-b border-gray-100 bg-gray-50/70 px-4 py-2.5 text-xs">
                      <span className="mr-2 text-[10px] font-bold text-gray-400 uppercase">
                        Folio Windows:
                      </span>
                      {[
                        ["all", "All Charges"],
                        ["A", "Folio A (Room / Pkg)"],
                        ["B", "Folio B (Incidentals)"],
                        ["C", "Folio C (Direct Bill)"],
                      ].map(([win, winLabel]) => (
                        <button
                          key={win}
                          onClick={() => setActiveWindow(win)}
                          className={`cursor-pointer rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                            activeWindow === win
                              ? "bg-brand-900 text-white shadow-2xs"
                              : "hover:text-brand-900 text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          {winLabel}
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-2 border-b border-slate-100 p-3">
                      <label className="flex min-w-[160px] flex-1 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-400">
                        <Search size={14} />
                        <input
                          className="min-w-0 flex-1 text-gray-800 outline-none"
                          placeholder="Search charges..."
                          value={search}
                          onChange={(event) => setSearch(event.target.value)}
                        />
                      </label>
                      <select
                        className="rounded-lg border border-slate-200 px-3 text-xs text-gray-800"
                        value={transactionType}
                        onChange={(event) =>
                          setTransactionType(event.target.value)
                        }
                      >
                        <option>All Transactions</option>
                        <option>Charges</option>
                        <option>Payments</option>
                        <option>Adjustments</option>
                        <option>Voids</option>
                      </select>
                      <button
                        className={buttonClass}
                        onClick={() => setReceiptOpen(true)}
                      >
                        <Printer size={13} /> 80mm Slip
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[720px] text-left text-[11px]">
                        <thead className="bg-slate-50 text-[10px] tracking-wide text-slate-500 uppercase">
                          <tr>
                            {[
                              "Date & Time",
                              "Description",
                              "Win",
                              "Department",
                              "Qty",
                              "Rate (₹)",
                              "Amount (₹)",
                              "Status",
                              "Actions",
                            ].map((label) => (
                              <th
                                className="px-3 py-3 font-semibold"
                                key={label}
                              >
                                {label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {visibleCharges.map((charge, index) => (
                            <ChargeRow
                              charge={charge}
                              index={index}
                              key={
                                charge._id ||
                                charge.id ||
                                `${charge.description}-${index}`
                              }
                              onAction={(action) => {
                                setSelectedChargeIndex(index);
                                setDrawer(action);
                              }}
                              onTransferWindow={() => {
                                setSelectedChargeIndex(index);
                                setDrawer("transfer-window");
                              }}
                            />
                          ))}
                        </tbody>
                      </table>
                      {!visibleCharges.length && (
                        <p className="p-10 text-center text-xs text-slate-400">
                          No transactions match the selected filters.
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 p-4">
                      <div className="flex gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          icon={Plus}
                          onClick={() => setDrawer("charge")}
                        >
                          Add Charge
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={WalletCards}
                          onClick={() => setDrawer("adjust")}
                        >
                          Adjust Charge
                        </Button>
                      </div>
                      <button
                        className="text-brand-700 hover:text-brand-900 cursor-pointer text-xs font-semibold transition-colors"
                        onClick={() => setDrawer("tax")}
                      >
                        Show Tax Breakdown{" "}
                        <ChevronDown size={13} className="inline" />
                      </button>
                    </div>
                  </>
                ) : (
                  <TabPlaceholder
                    tab={activeTab}
                    payments={aggregate.payments}
                    folio={folio}
                  />
                )}
              </main>
              <FolioSummary
                folio={folio}
                deposits={aggregate.deposits || []}
                onAction={setDrawer}
              />
            </div>
            <div className="grid gap-6 lg:grid-cols-[1.2fr_1.2fr_1.8fr]">
              <RecentPayments
                payments={aggregate.payments || []}
                onViewAll={() => setActiveTab("Payments")}
              />
              <Deposits
                deposits={aggregate.deposits || []}
                onApply={() => setDrawer("apply-deposit")}
              />
              <QuickActions
                onAction={setDrawer}
                onPrintThermal={() => setReceiptOpen(true)}
                onPrintA4={() =>
                  printFolioStatementA4(folio, charges, payments)
                }
                folio={folio}
              />
            </div>
          </>
        )}
      </div>

      {receiptOpen && (
        <ReceiptModal
          title={`Guest Folio Receipt - ${folio.folioNo || folio.guestName}`}
          data={{
            ...folio,
            charges: visibleCharges,
            paid: folio.summary?.totalPaid ?? folio.paid ?? 0,
            balanceDue: folio.summary?.balanceDue ?? folio.balanceDue ?? 0,
            paymentMethod: "Split/Deposit",
          }}
          onClose={() => setReceiptOpen(false)}
        />
      )}

      {drawer && (
        <FolioDrawer
          type={drawer}
          folio={folio}
          folios={folios}
          charges={charges}
          payments={payments}
          deposits={aggregate.deposits || []}
          chargeIndex={selectedChargeIndex}
          onActionSelect={(action) => setDrawer(action)}
          onClose={() => setDrawer("")}
          onComplete={() => {
            setDrawer("");
            refresh();
          }}
        />
      )}
    </>
  );
}

/**
 * Autocomplete Search & Select component for selecting active guest folio
 */
function FolioSearchSelect({ folios, selectedId, onSelect, isLoading }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef(null);

  const selectedFolio = useMemo(
    () => folios.find((f) => f.id === selectedId) || folios[0],
    [folios, selectedId],
  );

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return folios;
    const q = query.toLowerCase().trim();
    return folios.filter((item) => {
      const matchName = String(item.guestName || "")
        .toLowerCase()
        .includes(q);
      const matchPhone = String(item.guestPhone || "")
        .toLowerCase()
        .includes(q);
      const matchEmail = String(item.guestEmail || "")
        .toLowerCase()
        .includes(q);
      const matchRoom = String(item.roomNumber || item.roomId || "")
        .toLowerCase()
        .includes(q);
      const matchBooking = String(item.bookingNo || item.bookingId || "")
        .toLowerCase()
        .includes(q);
      const matchFolio = String(item.folioNo || item.id || "")
        .toLowerCase()
        .includes(q);
      return (
        matchName ||
        matchPhone ||
        matchEmail ||
        matchRoom ||
        matchBooking ||
        matchFolio
      );
    });
  }, [folios, query]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        disabled={isLoading || !folios.length}
        className="focus:border-brand-900 inline-flex min-w-[300px] cursor-pointer items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-800 shadow-2xs hover:bg-gray-50 focus:outline-hidden"
      >
        <div className="flex min-w-0 items-center gap-2 text-left">
          <Search size={14} className="shrink-0 text-gray-400" />
          {isLoading && !folios.length ? (
            <span className="text-gray-400">Loading folios...</span>
          ) : selectedFolio ? (
            <span className="truncate">
              <strong className="text-gray-900">
                {selectedFolio.guestName || "Guest"}
              </strong>
              <span className="font-normal text-gray-400">
                {" "}
                · Room {selectedFolio.roomNumber || "101"} ·{" "}
                {selectedFolio.folioNo || "FL-1001"}
              </span>
            </span>
          ) : (
            <span className="text-gray-400">Select active folio...</span>
          )}
        </div>
        <ChevronDown size={14} className="shrink-0 text-gray-400" />
      </button>

      {open && (
        <div className="absolute top-full left-0 z-50 mt-1.5 w-[380px] max-w-[95vw] rounded-2xl border border-gray-200 bg-white p-2.5 shadow-xl">
          <div className="relative mb-2">
            <Search
              size={14}
              className="absolute top-2.5 left-3 text-gray-400"
            />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, room, phone, email, booking #..."
              className="focus:border-brand-900 w-full rounded-xl border border-gray-200 py-2 pr-3 pl-9 text-xs text-gray-800 outline-none"
            />
          </div>

          <div className="max-h-[300px] space-y-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="p-4 text-center text-xs text-gray-400">
                No matching guests or folios found.
              </p>
            ) : (
              filtered.map((item) => {
                const isSelected =
                  item.id === (selectedFolio?.id || selectedId);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelect(item.id);
                      setOpen(false);
                      setQuery("");
                    }}
                    className={`flex w-full cursor-pointer flex-col gap-1 rounded-xl border p-2.5 text-left text-xs transition-all ${
                      isSelected
                        ? "border-blue-200 bg-blue-50/70 text-blue-900"
                        : "border-transparent text-gray-800 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <strong className="font-semibold text-gray-900">
                          {item.guestName || "Guest"}
                        </strong>
                        {item.isVip && (
                          <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-800">
                            VIP
                          </span>
                        )}
                        <StatusChip
                          variant={
                            item.status === "in_house" ||
                            item.status === "In House"
                              ? "checked-in"
                              : "neutral"
                          }
                        >
                          {item.status || "In House"}
                        </StatusChip>
                      </div>
                      <span
                        className={`text-[11px] font-bold ${Number(item.balanceDue) > 0 ? "text-rose-600" : "text-emerald-600"}`}
                      >
                        {money(item.balanceDue || 0)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-gray-500">
                      <span>
                        Room {item.roomNumber || "101"} (
                        {item.roomType || "Standard"}) · Ref:{" "}
                        {item.bookingNo || "—"}
                      </span>
                      <span className="font-mono">
                        {item.folioNo || "FL-1001"}
                      </span>
                    </div>

                    {(item.guestPhone || item.guestEmail) && (
                      <div className="truncate text-[10px] text-gray-400">
                        {item.guestPhone && `☎ ${item.guestPhone} `}
                        {item.guestEmail && `✉ ${item.guestEmail}`}
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function GuestStrip({ folio }) {
  const initials =
    (folio.guestName || "Guest")
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "G";

  return (
    <section className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid size-12 shrink-0 place-items-center rounded-full bg-purple-100 text-lg font-bold text-purple-700">
        {initials}
      </div>
      <div className="min-w-[180px] flex-1">
        <div className="flex items-center gap-2">
          <strong className="text-sm font-bold text-gray-900">
            {folio.guestName || "Guest"}
          </strong>
          <StatusChip
            variant={
              folio.status === "in_house" || folio.status === "In House"
                ? "checked-in"
                : "neutral"
            }
          >
            {folio.status || "In House"}
          </StatusChip>
          {folio.isVip && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
              VIP
            </span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap gap-x-3 text-[11px] text-slate-500">
          {folio.guestPhone ? <span>☎ {folio.guestPhone}</span> : null}
          {folio.guestEmail ? <span>✉ {folio.guestEmail}</span> : null}
          {folio.country && <span>🌐 {folio.country}</span>}
        </div>
      </div>
      <Info
        label="Booking No."
        value={folio.bookingNo || folio.bookingId || "—"}
      />
      <Info label="Room No." value={folio.roomNumber || "—"} />
      <Info label="Room Type" value={folio.roomType || "Executive EP"} />
      <Info label="Check-in" value={dateTime(folio.checkIn)} />
      <Info label="Check-out" value={dateTime(folio.checkOut)} />
      <Info label="Nights" value={folio.nights || 1} />
    </section>
  );
}

function Info({ label, value }) {
  return (
    <div className="border-l border-slate-100 pl-4 text-[10px]">
      <div className="text-slate-400">{label}</div>
      <strong className="text-gray-900">{value}</strong>
    </div>
  );
}

function dateTime(value) {
  return value
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";
}

function ChargeRow({ charge, onAction, onTransferWindow }) {
  const amount =
    Number(charge.amount ?? charge.price ?? 0) * Number(charge.quantity || 1);
  const win = (charge.folioWindow || "A").toUpperCase();
  return (
    <tr className="border-b border-slate-50 hover:bg-blue-50/20">
      <td className="px-3 py-3 text-slate-500">
        {dateTime(charge.createdAt)}
        <br />
        {charge.createdAt
          ? new Date(charge.createdAt).toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "—"}
      </td>
      <td className="px-3 py-3 font-semibold text-gray-900">
        {charge.description || charge.name || "Charge"}
      </td>
      <td className="px-3 py-3">
        <span
          className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
            win === "B"
              ? "bg-purple-100 text-purple-700"
              : win === "C"
                ? "bg-amber-100 text-amber-700"
                : "bg-blue-100 text-blue-700"
          }`}
        >
          Win {win}
        </span>
      </td>
      <td className="px-3 py-3">
        <span className="inline-flex items-center gap-1">
          <Utensils size={13} className="text-blue-500" />
          {charge.department || "Room"}
        </span>
      </td>
      <td className="px-3 py-3">{charge.quantity || 1}</td>
      <td className="px-3 py-3">
        {money(charge.price || charge.rate || amount)}
      </td>
      <td className="px-3 py-3 font-bold text-gray-900">{money(amount)}</td>
      <td className="px-3 py-3">
        <StatusChip
          variant={
            String(charge.status || "Posted").toLowerCase() === "posted"
              ? "posted"
              : "neutral"
          }
        >
          {charge.status || "Posted"}
        </StatusChip>
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-1">
          <button
            className="cursor-pointer rounded border border-slate-200 p-1 hover:bg-slate-100"
            title="Move charge to another folio window"
            onClick={onTransferWindow}
          >
            <ArrowRightLeft size={13} className="text-blue-600" />
          </button>
          <button
            className="cursor-pointer rounded border border-slate-200 p-1 hover:bg-slate-100"
            onClick={() => onAction("charge-menu")}
          >
            <MoreHorizontal size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
}

function FolioSummary({ folio, deposits = EMPTY_ARRAY, onAction }) {
  const summary = folio.summary || {};
  return (
    <aside className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex justify-between border-b border-slate-100 pb-3">
        <h2 className="border-l-2 border-blue-600 pl-2 text-sm font-bold text-gray-900">
          Folio Summary
        </h2>
        <span className="font-mono text-[10px] text-blue-600">
          Folio No:{" "}
          {folio.folioNo ||
            (folio._id
              ? `FL-${String(folio._id).slice(-6).toUpperCase()}`
              : "—")}
        </span>
      </div>
      <div className="space-y-2 py-3 text-xs">
        <Summary label="Room Charges" value={summary.roomCharges || 0} />
        {summary.fnbCharges ? (
          <Summary label="F&B Charges" value={summary.fnbCharges} />
        ) : null}
        {summary.laundry ? (
          <Summary label="Laundry" value={summary.laundry} />
        ) : null}
        {summary.roomService ? (
          <Summary label="Room Service" value={summary.roomService} />
        ) : null}
        {summary.minibar ? (
          <Summary label="Minibar" value={summary.minibar} />
        ) : null}
        {summary.spa ? <Summary label="Spa" value={summary.spa} /> : null}
        <hr className="border-gray-100" />
        <Summary
          label="Subtotal"
          value={summary.subtotal ?? folio.total}
          bold
        />
        {summary.discount ? (
          <Summary label="Discount" value={summary.discount} />
        ) : null}
        {summary.serviceCharge ? (
          <Summary
            label={`Service Charge${summary.serviceChargeRate ? ` (${summary.serviceChargeRate}%)` : ""}`}
            value={summary.serviceCharge}
          />
        ) : null}
        <Summary
          label={`Taxes & GST${summary.gstRate ? ` (${summary.gstRate}%)` : ""}`}
          value={summary.gst ?? summary.tax ?? 0}
        />
      </div>
      <div className="rounded-lg bg-blue-50 p-3">
        <Summary
          label="Grand Total"
          value={summary.grandTotal ?? folio.total}
          bold
          large
        />
      </div>
      <div className="space-y-2 py-3 text-sm">
        <Summary
          label="Total Paid"
          value={summary.totalPaid ?? folio.paid}
          green
          bold
        />
        <Summary
          label="Balance Due"
          value={summary.balanceDue ?? folio.balanceDue}
          red
          bold
          large
        />
      </div>
      <button
        className="w-full cursor-pointer rounded-lg bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700"
        onClick={() => onAction("payment")}
      >
        <Plus size={14} className="mr-1 inline" /> Collect Payment
      </button>
      {deposits.length > 0 &&
        Number(summary.balanceDue ?? folio.balanceDue ?? 0) > 0 && (
          <button
            className="mt-2 w-full cursor-pointer rounded-lg bg-blue-700 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-800"
            onClick={() => onAction("apply-deposit")}
          >
            <Wallet size={13} className="mr-1 inline" /> Apply Advance Deposit
          </button>
        )}
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button className={buttonClass} onClick={() => onAction("invoice")}>
          <FileDown size={13} /> Generate Invoice
        </button>
        <button className={buttonClass} onClick={() => onAction("share")}>
          <Share2 size={13} /> Share Folio
        </button>
      </div>
    </aside>
  );
}

function Summary({ label, value, bold, green, red, large }) {
  return (
    <div
      className={`${bold ? "font-bold text-gray-900" : "text-gray-600"} ${green ? "font-bold !text-emerald-600" : ""} ${red ? "font-bold !text-rose-600" : ""} ${large ? "text-base" : ""} flex justify-between`}
    >
      <span>{label}</span>
      <span>{money(value)}</span>
    </div>
  );
}

function RecentPayments({ payments, onViewAll }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-2 flex justify-between border-b border-slate-100 pb-2">
        <h3 className="border-l-2 border-blue-600 pl-2 text-sm font-bold text-gray-900">
          Recent Payments
        </h3>
        <button
          className="cursor-pointer text-[11px] font-semibold text-blue-600 hover:text-blue-800"
          onClick={onViewAll}
        >
          View All
        </button>
      </div>
      {payments.slice(0, 3).map((payment) => (
        <div
          className="grid grid-cols-[1fr_55px_1fr_70px] gap-2 border-b border-slate-50 py-2 text-[10px]"
          key={payment._id || payment.transactionId}
        >
          <span className="text-gray-500">{dateTime(payment.createdAt)}</span>
          <span className="font-medium text-gray-700 capitalize">
            {payment.method || "—"}
          </span>
          <span className="truncate text-gray-400">
            {payment.referenceNo || payment.reference || "—"}
          </span>
          <strong className="text-right text-emerald-600">
            {money(payment.amount)}
          </strong>
        </div>
      ))}
      {!payments.length && (
        <p className="py-4 text-center text-xs text-gray-400">
          No settlements recorded yet.
        </p>
      )}
    </section>
  );
}

function Deposits({ deposits, onApply }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-2 flex justify-between border-b border-slate-100 pb-2">
        <h3 className="border-l-2 border-blue-600 pl-2 text-sm font-bold text-gray-900">
          Advance / Deposits
        </h3>
        {deposits.length > 0 && (
          <button
            className="inline-flex cursor-pointer items-center gap-1 rounded bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700 hover:bg-blue-100"
            onClick={onApply}
          >
            <Wallet size={11} /> Apply to Folio
          </button>
        )}
      </div>
      {deposits.length ? (
        deposits.map((deposit) => (
          <div
            className="flex justify-between border-b border-slate-50 py-2 text-[10px]"
            key={deposit._id}
          >
            <span className="text-gray-500">{dateTime(deposit.createdAt)}</span>
            <span className="font-medium text-gray-700">
              {deposit.type || "Advance"}
            </span>
            <strong>{money(deposit.amount)}</strong>
            <span className="text-emerald-700">{money(deposit.balance)}</span>
          </div>
        ))
      ) : (
        <p className="py-5 text-center text-xs text-slate-400">
          No deposits recorded.
        </p>
      )}
      <div className="mt-2 rounded-lg bg-blue-50 p-2 text-[10px] text-blue-700">
        ⓘ Advance amount adjusted to folio upon checkout.
      </div>
    </section>
  );
}

function QuickActions({ onAction, onPrintThermal, onPrintA4, folio }) {
  const handleDownloadPdf = async () => {
    try {
      await billingApi.downloadFolioPdf(
        folio._id || folio.id,
        `Folio-${folio.folioNo || "Statement"}.pdf`,
      );
    } catch (err) {
      alert("Failed to download PDF: " + err.message);
    }
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between border-b border-slate-100 pb-2">
        <h3 className="border-l-2 border-blue-600 pl-2 text-sm font-bold text-gray-900">
          Quick Actions
        </h3>
        <button
          className="inline-flex cursor-pointer items-center gap-1 rounded border border-blue-200 bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700 hover:bg-blue-100"
          onClick={onPrintThermal}
        >
          <Printer size={11} /> 80mm POS Slip
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <button className={buttonClass} onClick={() => onAction("split")}>
          Split Folio
        </button>
        <button className={buttonClass} onClick={() => onAction("merge")}>
          Merge Folio
        </button>
        <button
          className={buttonClass}
          onClick={() => onAction("transfer-window")}
        >
          Transfer Charge
        </button>
        <button className={buttonClass} onClick={() => onAction("void")}>
          Void Charge
        </button>
        <button className={buttonClass} onClick={() => onAction("comp")}>
          Complimentary
        </button>
        <button
          className={buttonClass}
          onClick={() => {
            if (onPrintA4) onPrintA4();
            else onAction("print");
          }}
        >
          Print Folio
        </button>
        <button className={buttonClass} onClick={() => onAction("email")}>
          Email Folio
        </button>
        <button className={buttonClass} onClick={() => onAction("whatsapp")}>
          WhatsApp
        </button>
        <button className={buttonClass} onClick={handleDownloadPdf}>
          Download PDF
        </button>
      </div>
    </section>
  );
}

function TabPlaceholder({ tab, payments = EMPTY_ARRAY, folio }) {
  if (tab === "Payments") {
    return (
      <div className="p-5">
        <h2 className="font-display text-brand-900 mb-3 text-sm font-semibold">
          Payments &amp; Settlements
        </h2>
        {payments.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-gray-100 text-[10px] text-gray-400 uppercase">
                <tr>
                  <th className="py-2.5">Date &amp; Time</th>
                  <th className="py-2.5">Method</th>
                  <th className="py-2.5">Reference</th>
                  <th className="py-2.5">Amount</th>
                  <th className="py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payments.map((p) => (
                  <tr
                    className="transition-colors hover:bg-gray-50/50"
                    key={p._id || p.transactionId}
                  >
                    <td className="py-2.5 text-gray-500">
                      {dateTime(p.createdAt)}
                    </td>
                    <td className="py-2.5 font-medium text-gray-800 capitalize">
                      {p.method}
                    </td>
                    <td className="py-2.5 font-mono text-gray-400">
                      {p.referenceNo || p.reference || "—"}
                    </td>
                    <td className="py-2.5 font-bold text-emerald-600">
                      {money(p.amount)}
                    </td>
                    <td className="py-2.5">
                      <StatusChip
                        variant={
                          String(p.status || "success").toLowerCase() ===
                            "success" ||
                          String(p.status || "").toLowerCase() === "paid"
                            ? "paid"
                            : "pending"
                        }
                      >
                        {p.status || "success"}
                      </StatusChip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-8 text-center text-xs text-gray-400">
            No payments recorded for this folio.
          </p>
        )}
      </div>
    );
  }

  if (tab === "Guest Details") {
    return (
      <div className="space-y-4 p-5 text-xs">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h2 className="font-display text-brand-900 text-sm font-bold">
              Comprehensive Guest Profile
            </h2>
            <p className="text-[11px] text-gray-500">
              KYC verification, residential address, corporate affiliation and
              stay history
            </p>
          </div>
          {folio.isVip && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
              ★ VIP Guest
            </span>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Personal Identity */}
          <div className="space-y-2.5 rounded-xl border border-gray-200 bg-gray-50/60 p-4">
            <h3 className="flex items-center gap-1.5 border-b border-gray-200 pb-1.5 font-bold text-gray-900">
              <span>👤</span> Personal Identity
            </h3>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="block text-gray-400">Full Legal Name</span>
                <strong className="text-gray-900">
                  {folio.guestName || "—"}
                </strong>
              </div>
              <div>
                <span className="block text-gray-400">Guest Status</span>
                <StatusChip
                  variant={
                    folio.status === "in_house" || folio.status === "In House"
                      ? "checked-in"
                      : "neutral"
                  }
                >
                  {folio.status || "In House"}
                </StatusChip>
              </div>
              <div>
                <span className="block text-gray-400">Primary Mobile</span>
                <strong className="text-gray-900">
                  {folio.guestPhone || "—"}
                </strong>
              </div>
              <div>
                <span className="block text-gray-400">Email Address</span>
                <strong className="text-gray-900">
                  {folio.guestEmail || "—"}
                </strong>
              </div>
              <div>
                <span className="block text-gray-400">Nationality</span>
                <strong className="text-gray-900">
                  {folio.nationality || "Indian"}
                </strong>
              </div>
              <div>
                <span className="block text-gray-400">Assigned Room</span>
                <strong className="text-brand-900 font-bold">
                  Room {folio.roomNumber || "101"} (
                  {folio.roomType || "Executive EP"})
                </strong>
              </div>
            </div>
          </div>

          {/* Residential Address */}
          <div className="space-y-2.5 rounded-xl border border-gray-200 bg-gray-50/60 p-4">
            <h3 className="flex items-center gap-1.5 border-b border-gray-200 pb-1.5 font-bold text-gray-900">
              <span>📍</span> Residence &amp; Address
            </h3>
            <div className="space-y-1.5 text-[11px]">
              <div>
                <span className="block text-gray-400">
                  Street &amp; Location
                </span>
                <strong className="text-gray-900">
                  {folio.address || "Salt Lake Sector V, Bidhannagar"}
                </strong>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="block text-gray-400">City &amp; State</span>
                  <strong className="text-gray-900">
                    Kolkata, West Bengal
                  </strong>
                </div>
                <div>
                  <span className="block text-gray-400">Country / PIN</span>
                  <strong className="text-gray-900">
                    {folio.country || "India"} - 700091
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Identity Proof & KYC */}
          <div className="space-y-2.5 rounded-xl border border-gray-200 bg-gray-50/60 p-4">
            <h3 className="flex items-center gap-1.5 border-b border-gray-200 pb-1.5 font-bold text-gray-900">
              <span>🪪</span> Identification &amp; KYC Proof
            </h3>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="block text-gray-400">Document Type</span>
                <strong className="text-gray-900">
                  {folio.idType || "Aadhaar Card"}
                </strong>
              </div>
              <div>
                <span className="block text-gray-400">Document Number</span>
                <strong className="font-mono text-gray-900">
                  {folio.idNumber || "•••• •••• 9821"}
                </strong>
              </div>
              <div className="col-span-2">
                <span className="block text-gray-400">KYC Verification</span>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                  <CheckCircle2 size={13} /> Verified at Check-in
                </span>
              </div>
            </div>
          </div>

          {/* Corporate Affiliation & Stay Metrics */}
          <div className="space-y-2.5 rounded-xl border border-gray-200 bg-gray-50/60 p-4">
            <h3 className="flex items-center gap-1.5 border-b border-gray-200 pb-1.5 font-bold text-gray-900">
              <span>💼</span> Corporate &amp; Stay Metrics
            </h3>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="block text-gray-400">Company Affiliation</span>
                <strong className="text-gray-900">
                  {folio.companyName || "Direct Stay (Non-Corporate)"}
                </strong>
              </div>
              <div>
                <span className="block text-gray-400">Company GSTIN</span>
                <strong className="font-mono text-gray-900">
                  {folio.companyGstin || "—"}
                </strong>
              </div>
              <div>
                <span className="block text-gray-400">Total Stays</span>
                <strong className="text-gray-900">
                  {folio.stayCount || 3} stays
                </strong>
              </div>
              <div>
                <span className="block text-gray-400">Lifetime Spend</span>
                <strong className="font-bold text-emerald-700">
                  {money(folio.totalSpend || 32500)}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (tab === "Stay History") {
    return (
      <div className="space-y-3 p-5 text-xs">
        <h2 className="font-display text-brand-900 text-sm font-semibold">
          Stay Information
        </h2>
        <div className="grid max-w-lg grid-cols-3 gap-4">
          <div>
            <span className="block text-[10px] text-gray-400">Check-in</span>
            <strong className="text-brand-900">
              {dateTime(folio.checkIn)}
            </strong>
          </div>
          <div>
            <span className="block text-[10px] text-gray-400">Check-out</span>
            <strong className="text-brand-900">
              {dateTime(folio.checkOut)}
            </strong>
          </div>
          <div>
            <span className="block text-[10px] text-gray-400">Nights</span>
            <strong className="text-brand-900">{folio.nights || 1}</strong>
          </div>
          <div>
            <span className="block text-[10px] text-gray-400">
              Booking Reference
            </span>
            <strong className="text-brand-900">
              {folio.bookingNo || folio.bookingId || "—"}
            </strong>
          </div>
          <div>
            <span className="block text-[10px] text-gray-400">Room Type</span>
            <strong className="text-brand-900">
              {folio.roomType || "Standard"}
            </strong>
          </div>
          <div>
            <span className="block text-[10px] text-gray-400">
              Folio Status
            </span>
            <StatusChip
              variant={
                String(folio.status || "open").toLowerCase() === "open"
                  ? "pending"
                  : "neutral"
              }
            >
              {folio.status || "open"}
            </StatusChip>
          </div>
        </div>
      </div>
    );
  }

  if (tab === "Corporate") {
    return (
      <div className="space-y-3 p-5 text-xs">
        <h2 className="font-display text-brand-900 text-sm font-semibold">
          Corporate Billing Instructions
        </h2>
        {folio.companyName || folio.companyId ? (
          <div className="space-y-2.5">
            <div>
              <span className="block text-[10px] text-gray-400">
                Company Name
              </span>
              <strong className="text-brand-900 text-sm">
                {folio.companyName}
              </strong>
            </div>
            <div>
              <span className="block text-[10px] text-gray-400">GSTIN</span>
              <strong className="text-brand-900 font-mono">
                {folio.companyGstin || "—"}
              </strong>
            </div>
            <div>
              <span className="block text-[10px] text-gray-400">
                Billing Routing
              </span>
              <span className="text-gray-700">
                {folio.billingInstruction || "Direct Billing (City Ledger)"}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-gray-400">
            Direct guest billing — no corporate contract linked to this folio.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="p-5 text-xs">
      <h2 className="font-display text-brand-900 mb-2 text-sm font-semibold">
        {tab}
      </h2>
      <p className="text-gray-500">
        {folio.remarks ||
          folio.notes ||
          `No additional ${tab.toLowerCase()} logged for this folio.`}
      </p>
    </div>
  );
}

function MergeFolioSearchSelect({ folios = EMPTY_ARRAY, value, onChange }) {
  const [query, setQuery] = useState("");
  const selected = useMemo(
    () => folios.find((f) => f.id === value),
    [folios, value],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return folios;
    return folios.filter((f) => {
      const matchName = String(f.guestName || "")
        .toLowerCase()
        .includes(q);
      const matchRoom = String(f.roomNumber || "")
        .toLowerCase()
        .includes(q);
      const matchFolio = String(f.folioNo || "")
        .toLowerCase()
        .includes(q);
      const matchBooking = String(f.bookingNo || "")
        .toLowerCase()
        .includes(q);
      const matchPhone = String(f.guestPhone || "")
        .toLowerCase()
        .includes(q);
      const matchEmail = String(f.guestEmail || "")
        .toLowerCase()
        .includes(q);
      return (
        matchName ||
        matchRoom ||
        matchFolio ||
        matchBooking ||
        matchPhone ||
        matchEmail
      );
    });
  }, [folios, query]);

  return (
    <div className="space-y-2">
      <input type="hidden" name="targetFolioId" value={value || ""} required />
      <span className="block font-semibold text-gray-700">
        Select Target Folio to Merge Into{" "}
        <span className="text-rose-500">*</span>
      </span>

      {selected ? (
        <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50/50 p-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <strong className="text-xs font-semibold text-gray-900">
                {selected.guestName || "Guest"}
              </strong>
              <StatusChip
                variant={
                  selected.status === "in_house" ||
                  selected.status === "In House"
                    ? "checked-in"
                    : "neutral"
                }
              >
                {selected.status || "In House"}
              </StatusChip>
            </div>
            <div className="text-[11px] text-gray-600">
              Room {selected.roomNumber || "101"} · Folio:{" "}
              <span className="font-mono">{selected.folioNo || "FL-1001"}</span>
            </div>
            <div className="text-[11px] font-semibold text-rose-600">
              Balance Due: {money(selected.balanceDue || 0)}
            </div>
          </div>
          <button
            type="button"
            className="cursor-pointer rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-700 shadow-2xs hover:bg-gray-50"
            onClick={() => {
              onChange("");
              setQuery("");
            }}
          >
            Change
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute top-2.5 left-2.5 size-3.5 text-gray-400" />
            <input
              type="text"
              className="w-full rounded-lg border border-gray-200 py-2 pr-3 pl-8 text-xs focus:border-blue-500 focus:outline-hidden"
              placeholder="Search target guest, room #, phone, email, folio #..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>

          <div className="max-h-56 divide-y divide-gray-100 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-xs">
            {filtered.length === 0 ? (
              <div className="p-3 text-center text-[11px] text-gray-500">
                No active folios match &ldquo;{query}&rdquo;
              </div>
            ) : (
              filtered.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className="flex w-full cursor-pointer items-center justify-between gap-2 p-2.5 text-left transition-colors hover:bg-blue-50/40"
                  onClick={() => onChange(f.id)}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-xs font-semibold text-gray-900">
                        {f.guestName || "Guest"}
                      </span>
                      <span className="py-0.2 rounded bg-gray-100 px-1 text-[9px] font-medium text-gray-600">
                        Rm {f.roomNumber || "101"}
                      </span>
                    </div>
                    <div className="truncate text-[10px] text-gray-500">
                      {f.folioNo || "FL-1001"}{" "}
                      {f.guestPhone ? `· ${f.guestPhone}` : ""}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-[11px] font-bold text-gray-900">
                      {money(f.balanceDue || 0)}
                    </div>
                    <div className="text-[9px] text-gray-400">Due</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function FolioDrawer({
  type,
  folio,
  folios = EMPTY_ARRAY,
  charges = EMPTY_ARRAY,
  payments = EMPTY_ARRAY,
  deposits = EMPTY_ARRAY,
  chargeIndex = 0,
  onActionSelect,
  onClose,
  onComplete,
}) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const selectedCharge = folio.charges?.[chargeIndex];

  // Split state
  const [splitSelected, setSplitSelected] = useState(new Set([0]));
  // Merge state
  const [mergeTargetId, setMergeTargetId] = useState("");
  // Share channel state
  const [shareChannel, setShareChannel] = useState(
    type === "whatsapp" ? "whatsapp" : type === "email" ? "email" : "email",
  );
  const [shareRecipient, setShareRecipient] = useState(
    type === "whatsapp" ? folio.guestPhone || "" : folio.guestEmail || "",
  );

  const exportFolioCsv = () => {
    const folioCharges = folio.charges || charges || EMPTY_ARRAY;
    const headers = [
      "Date",
      "Description",
      "Department",
      "Window",
      "Quantity",
      "Rate",
      "Amount",
      "Status",
    ];
    const rows = folioCharges.map((c) => [
      `"${c.createdAt ? new Date(c.createdAt).toISOString() : ""}"`,
      `"${c.description || c.name || ""}"`,
      `"${c.department || "Room"}"`,
      `"${c.folioWindow || "A"}"`,
      c.quantity || 1,
      c.price || c.amount || 0,
      Number(c.price || c.amount || 0) * Number(c.quantity || 1),
      `"${c.status || "Posted"}"`,
    ]);
    const summaryLines = [
      [
        "",
        "",
        "",
        "",
        "",
        "Subtotal",
        folio.summary?.subtotal || folio.total || 0,
        "",
      ],
      [
        "",
        "",
        "",
        "",
        "",
        "Service Charge",
        folio.summary?.serviceCharge || 0,
        "",
      ],
      [
        "",
        "",
        "",
        "",
        "",
        "CGST (9%)",
        folio.summary?.cgst || (folio.summary?.gst ? folio.summary.gst / 2 : 0),
        "",
      ],
      [
        "",
        "",
        "",
        "",
        "",
        "SGST (9%)",
        folio.summary?.sgst || (folio.summary?.gst ? folio.summary.gst / 2 : 0),
        "",
      ],
      [
        "",
        "",
        "",
        "",
        "",
        "Grand Total",
        folio.summary?.grandTotal || folio.total || 0,
        "",
      ],
      [
        "",
        "",
        "",
        "",
        "",
        "Total Paid",
        folio.summary?.totalPaid || folio.paid || 0,
        "",
      ],
      [
        "",
        "",
        "",
        "",
        "",
        "Balance Due",
        folio.summary?.balanceDue || folio.balanceDue || 0,
        "",
      ],
    ];
    const csvContent = [
      `"GUEST FOLIO STATEMENT - ${folio.folioNo || "FL"} - ${folio.guestName || "Guest"}"`,
      `"Room: ${folio.roomNumber || ""} | Booking: ${folio.bookingNo || ""} | Date: ${new Date().toLocaleDateString("en-IN")}"`,
      "",
      headers.join(","),
      ...rows.map((r) => r.join(",")),
      "",
      ...summaryLines.map((r) => r.join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `folio-${folio.folioNo || "statement"}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    onComplete();
  };

  const submit = async (event) => {
    event.preventDefault();
    if (["tax", "charge-menu", "menu"].includes(type)) {
      onClose();
      return;
    }
    setError("");
    setLoading(true);
    const body = Object.fromEntries(
      new FormData(event.currentTarget).entries(),
    );
    try {
      const id = folio._id || folio.id;
      if (type === "charge") {
        await billingApi.addFolioCharge(id, body);
      } else if (type === "split") {
        await billingApi.splitFolio(id, {
          ...body,
          itemIndexes: Array.from(splitSelected),
        });
      } else if (type === "merge") {
        await billingApi.mergeFolio(id, {
          targetFolioId: mergeTargetId || body.targetFolioId,
          reason: body.reason,
        });
      } else if (type === "invoice") {
        await billingApi.generateInvoice(id, body);
      } else if (type === "payment") {
        await billingApi.collectFolioPayment(id, body);
      } else if (type === "apply-deposit") {
        await billingApi.applyDeposit(id, {
          depositId: body.depositId,
          amount: Number(body.amount),
        });
      } else if (type === "transfer-window") {
        await billingApi.transferWindow(id, {
          itemIndex: Number(body.itemIndex ?? chargeIndex),
          targetWindow: body.targetWindow,
        });
      } else if (["share", "email", "whatsapp"].includes(type)) {
        await billingApi.shareFolio(id, {
          channel: shareChannel,
          recipient: shareRecipient,
        });
      } else if (["adjust", "void", "comp", "transfer"].includes(type)) {
        await billingApi.correctFolioCharge(id, type, body);
      }
      onComplete();
    } catch (requestError) {
      setError(requestError.message || "Action failed.");
    } finally {
      setLoading(false);
    }
  };

  const getSubmitLabel = () => {
    if (loading) return "Processing...";
    switch (type) {
      case "charge":
        return "Post Charge to Folio";
      case "split":
        return "Split into Folio B";
      case "merge":
        return "Merge Folios";
      case "invoice":
        return "Create Tax Invoice";
      case "payment":
        return "Process Folio Settlement";
      case "apply-deposit":
        return "Apply Deposit to Folio";
      case "transfer-window":
        return "Move to Selected Window";
      case "adjust":
        return "Apply Charge Adjustment";
      case "void":
        return "Void Charge Entry";
      case "comp":
        return "Apply Complimentary Status";
      case "transfer":
        return "Transfer Charge";
      case "tax":
      case "charge-menu":
      case "menu":
      case "print":
      case "download":
      case "share":
      case "email":
      case "whatsapp":
        return false;
      default:
        return "Submit";
    }
  };

  const otherFolios = useMemo(
    () => folios.filter((f) => f.id !== (folio._id || folio.id)),
    [folios, folio],
  );

  const selectedTargetFolio = useMemo(
    () => otherFolios.find((f) => f.id === mergeTargetId),
    [otherFolios, mergeTargetId],
  );

  // Split calculation
  const totalChargeItems = folio.charges || [];
  const movedAmount = totalChargeItems.reduce((acc, ch, idx) => {
    if (splitSelected.has(idx)) {
      return (
        acc + Number(ch.price || ch.amount || 0) * Number(ch.quantity || 1)
      );
    }
    return acc;
  }, 0);
  const retainedAmount = Math.max(
    Number(folio.summary?.subtotal || folio.total || 0) - movedAmount,
    0,
  );
  const retainedCount = Math.max(
    totalChargeItems.length - splitSelected.size,
    0,
  );

  return (
    <ActionDrawer
      title={
        type === "tax"
          ? "Tax Breakdown"
          : type === "charge-menu"
            ? "Charge Options"
            : type === "menu"
              ? "Folio Actions & Export"
              : type === "split"
                ? "Split Folio"
                : type === "merge"
                  ? "Merge Folios"
                  : type === "invoice"
                    ? "Generate Tax Invoice"
                    : type === "payment"
                      ? "Collect Folio Payment"
                      : type === "share" ||
                          type === "email" ||
                          type === "whatsapp"
                        ? "Share Folio Statement"
                        : type.replace("-", " ")
      }
      onClose={onClose}
      onSubmit={submit}
      submitLabel={getSubmitLabel()}
    >
      {type === "tax" && (
        <div className="space-y-3 text-xs">
          <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-blue-900">
            <span className="font-bold">Indian GST &amp; Tax Structure</span>
            <p className="mt-0.5 text-[11px] text-blue-700">
              GSTIN: 19ABCDE1234F1Z5 · Stayscape Dev (Kolkata, India)
            </p>
          </div>
          <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
            <div className="flex justify-between p-3">
              <span className="text-gray-600">
                Base Room &amp; Charges Subtotal
              </span>
              <span className="font-semibold text-gray-900">
                {money(folio.summary?.subtotal || folio.total)}
              </span>
            </div>
            {Boolean(folio.summary?.serviceCharge) && (
              <div className="flex justify-between p-3">
                <span className="text-gray-600">
                  Service Charge ({folio.summary?.serviceChargeRate || 10}%)
                </span>
                <span className="font-semibold text-gray-900">
                  {money(folio.summary?.serviceCharge)}
                </span>
              </div>
            )}
            <div className="flex justify-between p-3">
              <span className="text-gray-600">Central GST (CGST 9%)</span>
              <span className="font-semibold text-gray-900">
                {money(
                  folio.summary?.cgst ||
                    (folio.summary?.gst ? folio.summary.gst / 2 : 0),
                )}
              </span>
            </div>
            <div className="flex justify-between p-3">
              <span className="text-gray-600">State GST (SGST 9%)</span>
              <span className="font-semibold text-gray-900">
                {money(
                  folio.summary?.sgst ||
                    (folio.summary?.gst ? folio.summary.gst / 2 : 0),
                )}
              </span>
            </div>
            <div className="flex justify-between rounded-b-xl bg-gray-50/80 p-3 font-bold text-gray-900">
              <span>Total Taxes &amp; Surcharges</span>
              <span>
                {money(
                  (folio.summary?.gst || 0) +
                    (folio.summary?.serviceCharge || 0),
                )}
              </span>
            </div>
          </div>
          <div className="pt-2">
            <Button
              type="button"
              variant="primary"
              className="w-full"
              onClick={onClose}
            >
              Done
            </Button>
          </div>
        </div>
      )}

      {type === "charge-menu" && selectedCharge && (
        <div className="space-y-3 text-xs">
          <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-3.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-900">
                #{chargeIndex + 1}:{" "}
                {selectedCharge.description || selectedCharge.name || "Charge"}
              </span>
              <span className="font-bold text-emerald-700">
                {money(
                  Number(selectedCharge.price || selectedCharge.amount || 0) *
                    Number(selectedCharge.quantity || 1),
                )}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-gray-500">
              Department: {selectedCharge.department || "Room"} · Window:{" "}
              {selectedCharge.folioWindow || "A"} · Status:{" "}
              {selectedCharge.status || "Posted"}
            </p>
          </div>
          <p className="font-semibold text-gray-700">
            Available Charge Actions:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onActionSelect?.("adjust")}
            >
              Adjust Charge
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-rose-200 text-rose-700 hover:bg-rose-50"
              onClick={() => onActionSelect?.("void")}
            >
              Void Charge
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onActionSelect?.("comp")}
            >
              Complimentary
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onActionSelect?.("transfer-window")}
            >
              Move Window
            </Button>
          </div>
          <div className="pt-2">
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={onClose}
            >
              Done
            </Button>
          </div>
        </div>
      )}

      {type === "menu" && (
        <div className="space-y-3 text-xs">
          <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-3.5">
            <h3 className="font-bold text-gray-900">
              Folio Statement Actions: {folio.folioNo || "FL-1001"}
            </h3>
            <p className="mt-0.5 text-[11px] text-gray-500">
              Guest: {folio.guestName || "Guest"} · Room{" "}
              {folio.roomNumber || "101"} · Due:{" "}
              {money(folio.summary?.balanceDue ?? folio.balanceDue ?? 0)}
            </p>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-gray-200 p-3 text-left transition-colors hover:bg-gray-50"
              onClick={() => {
                onClose();
                printFolioStatementA4(folio, charges, payments);
              }}
            >
              <div className="flex items-center gap-2.5">
                <Printer size={16} className="text-blue-600" />
                <div>
                  <strong className="block font-semibold text-gray-900">
                    Print Folio Statement (A4)
                  </strong>
                  <span className="text-[10px] text-gray-500">
                    Opens the system print dialog for A4 statement
                  </span>
                </div>
              </div>
              <ChevronDown size={14} className="-rotate-90 text-gray-400" />
            </button>

            <button
              type="button"
              className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-gray-200 p-3 text-left transition-colors hover:bg-gray-50"
              onClick={async () => {
                try {
                  await billingApi.downloadFolioPdf(
                    folio._id || folio.id,
                    `Folio-${folio.folioNo || "Statement"}.pdf`,
                  );
                  onClose();
                } catch (err) {
                  setError("Download failed: " + err.message);
                }
              }}
            >
              <div className="flex items-center gap-2.5">
                <FileDown size={16} className="text-emerald-600" />
                <div>
                  <strong className="block font-semibold text-gray-900">
                    Download PDF Statement
                  </strong>
                  <span className="text-[10px] text-gray-500">
                    Directly download official branded A4 PDF
                  </span>
                </div>
              </div>
              <ChevronDown size={14} className="-rotate-90 text-gray-400" />
            </button>

            <button
              type="button"
              className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-gray-200 p-3 text-left transition-colors hover:bg-gray-50"
              onClick={exportFolioCsv}
            >
              <div className="flex items-center gap-2.5">
                <FileDown size={16} className="text-purple-600" />
                <div>
                  <strong className="block font-semibold text-gray-900">
                    Export Line Charges (CSV)
                  </strong>
                  <span className="text-[10px] text-gray-500">
                    Spreadsheet export for accounts &amp; audit trail
                  </span>
                </div>
              </div>
              <ChevronDown size={14} className="-rotate-90 text-gray-400" />
            </button>

            <button
              type="button"
              className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-gray-200 p-3 text-left transition-colors hover:bg-gray-50"
              onClick={() => onActionSelect?.("transfer-window")}
            >
              <div className="flex items-center gap-2.5">
                <ArrowRightLeft size={16} className="text-amber-600" />
                <div>
                  <strong className="block font-semibold text-gray-900">
                    Move Charge Windows
                  </strong>
                  <span className="text-[10px] text-gray-500">
                    Reassign line charges between Folio A, B &amp; C
                  </span>
                </div>
              </div>
              <ChevronDown size={14} className="-rotate-90 text-gray-400" />
            </button>

            <button
              type="button"
              className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-gray-200 p-3 text-left transition-colors hover:bg-gray-50"
              onClick={() => onActionSelect?.("apply-deposit")}
            >
              <div className="flex items-center gap-2.5">
                <Wallet size={16} className="text-indigo-600" />
                <div>
                  <strong className="block font-semibold text-gray-900">
                    Apply Advance Deposit
                  </strong>
                  <span className="text-[10px] text-gray-500">
                    Allocate unapplied guest deposit to folio balance
                  </span>
                </div>
              </div>
              <ChevronDown size={14} className="-rotate-90 text-gray-400" />
            </button>
          </div>

          <div className="pt-2">
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </div>
      )}

      {type === "split" && (
        <div className="space-y-4 text-xs">
          <div className="rounded-xl border border-purple-100 bg-purple-50/70 p-3 text-purple-900">
            <span className="font-bold">
              Split Charges into New Window / Sub-Folio
            </span>
            <p className="mt-0.5 text-[11px] text-purple-700">
              Select charges below to move from {folio.folioNo || "Folio A"}{" "}
              into a separate incidental folio.
            </p>
          </div>

          <div className="max-h-[220px] space-y-1.5 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50/50 p-2">
            {(folio.charges || []).map((ch, idx) => {
              const chAmt =
                Number(ch.price || ch.amount || 0) * Number(ch.quantity || 1);
              const isChecked = splitSelected.has(idx);
              return (
                <label
                  key={
                    ch.id ||
                    ch._id ||
                    `${ch.name || "charge"}-${ch.price || ch.amount || idx}`
                  }
                  className={`flex cursor-pointer items-center justify-between rounded-lg border p-2 transition-all ${
                    isChecked
                      ? "border-purple-300 bg-purple-50/80 text-purple-900"
                      : "border-gray-200 bg-white text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        const next = new Set(splitSelected);
                        if (e.target.checked) next.add(idx);
                        else next.delete(idx);
                        setSplitSelected(next);
                      }}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <div>
                      <strong className="block font-medium text-gray-900">
                        {ch.description || ch.name || "Charge"}
                      </strong>
                      <span className="text-[10px] text-gray-500">
                        {ch.department || "Room"} · Qty: {ch.quantity || 1} ·
                        Win {ch.folioWindow || "A"}
                      </span>
                    </div>
                  </div>
                  <strong className="font-bold text-gray-900">
                    {money(chAmt)}
                  </strong>
                </label>
              );
            })}
          </div>

          {/* Split Preview */}
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-gray-200 bg-white p-3 text-[11px]">
            <div>
              <span className="block text-gray-500">Remaining in Folio A</span>
              <strong className="text-xs text-gray-900">
                {money(retainedAmount)}
              </strong>
              <span className="block text-[10px] text-gray-400">
                ({retainedCount} charges)
              </span>
            </div>
            <div>
              <span className="block font-semibold text-purple-700">
                Moving to Folio B
              </span>
              <strong className="text-xs font-bold text-purple-700">
                {money(movedAmount)}
              </strong>
              <span className="block text-[10px] text-purple-600">
                ({splitSelected.size} charges)
              </span>
            </div>
          </div>

          <label className="block font-semibold text-gray-700">
            Target Folio Window
            <select
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs"
              name="targetWindow"
              defaultValue="B"
            >
              <option value="B">
                Folio B (Guest Incidentals &amp; F&amp;B)
              </option>
              <option value="C">Folio C (Corporate Direct Billing)</option>
            </select>
          </label>

          <Field
            label="Mandatory Reason for Split"
            name="reason"
            placeholder="e.g. Split personal meals to guest card"
            required
          />
        </div>
      )}

      {type === "merge" && (
        <div className="space-y-4 text-xs">
          <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-blue-900">
            <span className="font-bold">Merge Folios</span>
            <p className="mt-0.5 text-[11px] text-blue-700">
              Combine all charges and balances from{" "}
              {folio.folioNo || "current folio"} into another active stay.
            </p>
          </div>

          <MergeFolioSearchSelect
            folios={otherFolios}
            value={mergeTargetId}
            onChange={setMergeTargetId}
          />

          {selectedTargetFolio && (
            <div className="space-y-1.5 rounded-xl border border-gray-200 bg-gray-50/60 p-3 text-[11px]">
              <span className="block font-bold text-gray-900">
                Combined Stay Preview
              </span>
              <div className="flex justify-between text-gray-600">
                <span>Source ({folio.folioNo}):</span>
                <span>
                  {money(folio.summary?.grandTotal || folio.total || 0)}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Target ({selectedTargetFolio.folioNo}):</span>
                <span>{money(selectedTargetFolio.total || 0)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-1 font-bold text-gray-900">
                <span>Combined Balance Due:</span>
                <span className="text-emerald-700">
                  {money(
                    Number(folio.summary?.balanceDue ?? folio.balanceDue ?? 0) +
                      Number(selectedTargetFolio.balanceDue || 0),
                  )}
                </span>
              </div>
            </div>
          )}

          <Field
            label="Mandatory Reason for Merge"
            name="reason"
            placeholder="e.g. Master billing for family stay in rooms 101 & 102"
            required
          />
        </div>
      )}

      {type === "invoice" && (
        <div className="space-y-4 text-xs">
          <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-blue-900">
            <span className="font-bold">Generate Official GST Tax Invoice</span>
            <p className="mt-0.5 text-[11px] text-blue-700">
              Converts {folio.folioNo || "current charges"} into a legal GST tax
              document with NIC-IRP IRN &amp; QR verification.
            </p>
          </div>

          <label className="block font-semibold text-gray-700">
            Invoice Type <span className="text-rose-500">*</span>
            <select
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium"
              name="type"
              defaultValue="tax"
              required
            >
              <option value="tax">Tax Invoice (Official GST B2C / B2B)</option>
              <option value="proforma">
                Proforma Invoice (Pre-settlement Estimate)
              </option>
            </select>
          </label>

          {/* Invoice Summary Preview */}
          <div className="space-y-1.5 rounded-xl border border-gray-200 bg-gray-50/60 p-3 text-[11px]">
            <span className="block font-bold text-gray-900">
              Invoice Value Breakdown
            </span>
            <div className="flex justify-between text-gray-600">
              <span>Billed To:</span>
              <strong className="text-gray-900">
                {folio.companyName || folio.guestName || "Guest"}
              </strong>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Room Number:</span>
              <span>Room {folio.roomNumber || "101"}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Taxable Value:</span>
              <span>{money(folio.summary?.subtotal || folio.total || 0)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Total GST (18%):</span>
              <span>{money(folio.summary?.gst || 0)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-1 text-xs font-bold text-gray-900">
              <span>Invoice Grand Total:</span>
              <span className="text-brand-900 font-bold">
                {money(folio.summary?.grandTotal || folio.total || 0)}
              </span>
            </div>
          </div>
        </div>
      )}

      {["share", "email", "whatsapp"].includes(type) && (
        <div className="space-y-4 text-xs">
          <div className="flex border-b border-gray-200">
            {[
              ["email", "Email Folio"],
              ["whatsapp", "WhatsApp"],
              ["download", "Download PDF"],
            ].map(([ch, chLabel]) => (
              <button
                key={ch}
                type="button"
                onClick={() => {
                  setShareChannel(ch);
                  if (ch === "email") setShareRecipient(folio.guestEmail || "");
                  else if (ch === "whatsapp")
                    setShareRecipient(folio.guestPhone || "");
                }}
                className={`flex-1 cursor-pointer py-2 text-center text-xs font-semibold transition-all ${
                  shareChannel === ch
                    ? "border-brand-900 text-brand-900 border-b-2 font-bold"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {chLabel}
              </button>
            ))}
          </div>

          {shareChannel === "download" ? (
            <div className="space-y-3 pt-2">
              <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3.5">
                <strong className="block font-semibold text-gray-900">
                  Direct PDF Statement Download
                </strong>
                <p className="mt-0.5 text-[11px] text-gray-500">
                  Downloads an authoritative A4 statement complete with room
                  details, itemized lines, and Indian GST breakdown.
                </p>
              </div>
              <Button
                type="button"
                variant="primary"
                className="w-full gap-2"
                onClick={async () => {
                  try {
                    await billingApi.downloadFolioPdf(
                      folio._id || folio.id,
                      `Folio-${folio.folioNo || "Statement"}.pdf`,
                    );
                    onComplete();
                  } catch (err) {
                    setError("Failed to download: " + err.message);
                  }
                }}
              >
                <FileDown size={14} /> Download Folio Statement (PDF)
              </Button>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              <label className="block font-semibold text-gray-700">
                {shareChannel === "email"
                  ? "Guest Email Address"
                  : "Guest Mobile Number"}
                <input
                  type={shareChannel === "email" ? "email" : "tel"}
                  value={shareRecipient}
                  onChange={(e) => setShareRecipient(e.target.value)}
                  placeholder={
                    shareChannel === "email"
                      ? "Enter email address"
                      : "Enter phone number"
                  }
                  required
                  className="focus:border-brand-900 mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-800 outline-none"
                />
              </label>

              {shareChannel === "whatsapp" && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-[11px] text-emerald-800">
                  💬 WhatsApp notification with folio statement link will be
                  dispatched to the guest's mobile number.
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                className="w-full gap-2"
                disabled={loading || !shareRecipient}
              >
                {loading
                  ? "Dispatching..."
                  : shareChannel === "email"
                    ? "Send Folio Statement via Email"
                    : "Send Folio via WhatsApp"}
              </Button>
            </div>
          )}
        </div>
      )}

      {type === "charge" && (
        <>
          <label className="block text-xs font-semibold text-slate-600">
            Department
            <select
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
              name="department"
              defaultValue="Room"
              required
            >
              <option value="Room">Room</option>
              <option value="F&B">F&amp;B / Restaurant</option>
              <option value="Laundry">Laundry</option>
              <option value="Room Service">Room Service</option>
              <option value="Minibar">Minibar</option>
              <option value="Spa">Spa</option>
              <option value="Other">Other</option>
            </select>
          </label>
          <Field label="Item / description" name="description" required />
          <Field
            label="Quantity"
            name="quantity"
            type="number"
            min="1"
            defaultValue="1"
            required
          />
          <Field
            label="Rate (₹)"
            name="amount"
            type="number"
            min="0"
            step="0.01"
            required
          />
          <Field label="Date" name="businessDate" type="date" />
          <Field label="Remarks" name="remarks" />
          <label className="flex gap-2 text-xs text-gray-700">
            <input type="checkbox" name="taxInclusive" /> Tax inclusive
          </label>
        </>
      )}

      {type === "payment" && (
        <>
          <Field
            label="Amount (₹)"
            name="amount"
            type="number"
            min="0"
            step="0.01"
            defaultValue={folio.summary?.balanceDue ?? folio.balanceDue}
            required
          />
          <label className="block text-xs font-semibold text-slate-600">
            Payment Method
            <select
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
              name="method"
              defaultValue="cash"
              required
            >
              <option value="cash">Cash (Front Desk)</option>
              <option value="upi">UPI</option>
              <option value="card">Card (POS Terminal)</option>
              <option value="netbanking">Bank Transfer / NEFT</option>
              <option value="wallet">Online Gateway</option>
            </select>
          </label>
          <Field label="Reference / Transaction ID" name="reference" />
        </>
      )}

      {type === "apply-deposit" && (
        <>
          <div className="mb-3 rounded-lg bg-blue-50 p-2.5 text-xs text-blue-800">
            Available Deposits: <b>{deposits.length}</b> | Folio Balance:{" "}
            <b>{money(folio.summary?.balanceDue ?? folio.balanceDue ?? 0)}</b>
          </div>
          <label className="block text-xs font-semibold text-slate-600">
            Select Deposit
            <select
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
              name="depositId"
              required
            >
              {deposits.map((d) => (
                <option value={d._id || d.id} key={d._id || d.id}>
                  {d.reference || d.type || "Deposit"} —{" "}
                  {money(d.balance || d.amount)}
                </option>
              ))}
            </select>
          </label>
          <Field
            label="Amount to Apply (₹)"
            name="amount"
            type="number"
            min="1"
            step="0.01"
            defaultValue={Math.min(
              Number(deposits[0]?.balance || deposits[0]?.amount || 0),
              Number(folio.summary?.balanceDue ?? folio.balanceDue ?? 0),
            )}
            required
          />
        </>
      )}

      {type === "transfer-window" && (
        <>
          <label className="block text-xs font-semibold text-slate-600">
            Select Charge to Move
            <select
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
              name="itemIndex"
              defaultValue={chargeIndex}
              required
            >
              {(folio.charges || []).map((ch, idx) => (
                <option
                  value={idx}
                  key={
                    ch.id ||
                    ch._id ||
                    `${ch.name || "ch"}-${ch.price || ch.amount || idx}`
                  }
                >
                  #{idx + 1}: {ch.description || ch.name || "Charge"} — ₹
                  {ch.price || ch.amount || 0} (Win {ch.folioWindow || "A"})
                </option>
              ))}
            </select>
          </label>
          <label className="mt-2 block text-xs font-semibold text-slate-600">
            Target Folio Window
            <select
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
              name="targetWindow"
              defaultValue="B"
              required
            >
              <option value="A">Folio A (Room &amp; Board / Master)</option>
              <option value="B">
                Folio B (Guest Incidentals &amp; F&amp;B)
              </option>
              <option value="C">Folio C (Direct Billing / Company)</option>
            </select>
          </label>
        </>
      )}

      {["adjust", "void", "comp", "transfer"].includes(type) && (
        <>
          <label className="block text-xs font-semibold text-slate-600">
            Select Charge
            <select
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
              name="itemIndex"
              defaultValue={chargeIndex}
              required
            >
              {(folio.charges || []).map((ch, idx) => (
                <option
                  value={idx}
                  key={
                    ch.id ||
                    ch._id ||
                    `${ch.name || "ch"}-${ch.price || ch.amount || idx}`
                  }
                >
                  #{idx + 1}: {ch.description || ch.name || "Charge"} — ₹
                  {ch.price || ch.amount || 0} ({ch.department || "Room"})
                </option>
              ))}
            </select>
          </label>
          {type === "adjust" && (
            <Field
              label="Adjusted / New Amount (₹)"
              name="amount"
              type="number"
              step="0.01"
              required
            />
          )}
          <Field
            label="Mandatory Reason"
            name="reason"
            placeholder="Audit trail requirement"
            required
          />
        </>
      )}

      {type === "print" && (
        <div className="space-y-3">
          <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4 text-xs">
            <p className="font-bold text-gray-900">
              Print Folio Statement: {folio.folioNo}
            </p>
            <p className="mt-1 text-gray-600">
              Guest: {folio.guestName || "Guest"} · Room:{" "}
              {folio.roomNumber || "—"}
            </p>
            <p className="mt-1 font-semibold text-emerald-700">
              Grand Total: {money(folio.summary?.grandTotal || folio.total)} |
              Balance: {money(folio.summary?.balanceDue || folio.balanceDue)}
            </p>
          </div>
          <Button
            type="button"
            variant="primary"
            className="w-full gap-2"
            onClick={() => {
              if (onComplete) onComplete();
              else if (onClose) onClose();
              printFolioStatementA4(folio, charges, payments);
            }}
          >
            <Printer size={14} /> Open Print Dialog
          </Button>
        </div>
      )}

      {type === "download" && (
        <div className="space-y-3">
          <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4 text-xs">
            <p className="font-bold text-gray-900">
              Export Folio Statement: {folio.folioNo}
            </p>
            <p className="mt-1 text-gray-600">
              Download the official A4 branded PDF statement directly to your
              device.
            </p>
          </div>
          <Button
            type="button"
            variant="primary"
            className="w-full gap-2"
            onClick={async () => {
              try {
                await billingApi.downloadFolioPdf(
                  folio._id || folio.id,
                  `Folio-${folio.folioNo || "Statement"}.pdf`,
                );
                onComplete();
              } catch (err) {
                setError("Download failed: " + err.message);
              }
            }}
          >
            <FileDown size={14} /> Download PDF Statement
          </Button>
        </div>
      )}

      {error && (
        <p className="rounded bg-rose-50 p-2 text-xs text-rose-700">{error}</p>
      )}
    </ActionDrawer>
  );
}
