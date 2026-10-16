import { useMemo, useState } from "react";
import { useQuery } from "@hotelos/query";
import {
  ChevronDown,
  FileDown,
  MoreHorizontal,
  Plus,
  Search,
  Share2,
  Split,
  Utensils,
  WalletCards,
} from "lucide-react";
import { billingApi } from "../billingApi.js";
import { ActionDrawer, Field, StatusPill, money } from "../billingUi.jsx";

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
  "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-[#102b5c] shadow-sm hover:border-blue-300";

export default function GuestFolioPage() {
  const [selectedId, setSelectedId] = useState("");
  const [activeTab, setActiveTab] = useState("Folio");
  const [drawer, setDrawer] = useState("");
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
  const charges = aggregate.charges || folio.charges || [];
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
        return matchesSearch && matchesType;
      }),
    [charges, search, transactionType],
  );
  const refresh = () => {
    detailQuery.refetch();
    foliosQuery.refetch();
  };

  if (foliosQuery.isLoading || detailQuery.isLoading)
    return (
      <div className="p-8 text-sm text-slate-500">Loading guest folio…</div>
    );
  if (foliosQuery.isError || detailQuery.isError)
    return (
      <div className="m-6 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
        Guest folio could not be loaded. Please retry.
      </div>
    );
  if (!folioId)
    return (
      <div className="m-6 rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
        No open guest folios are available.
      </div>
    );

  return (
    <div className="min-h-full bg-[#f4f7fb] p-4 text-[#102b5c] sm:p-6">
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <div className="mb-1 text-[11px] font-semibold text-blue-600">
            Billing &amp; Folio <span className="px-2 text-slate-400">›</span>{" "}
            Folio
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Guest Folio</h1>
          <p className="text-xs text-slate-500">
            View and manage guest charges, payments and invoices.
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <select
            className={buttonClass}
            value={folioId}
            onChange={(event) => setSelectedId(event.target.value)}
            aria-label="Select property folio"
          >
            {folios.map((item) => (
              <option value={item.id} key={item.id}>
                All Properties
              </option>
            ))}
          </select>
          <button
            className="inline-flex items-center gap-2 rounded-lg bg-[#102b5c] px-4 py-2 text-xs font-bold text-white"
            onClick={() => setDrawer("charge")}
          >
            <Plus size={14} /> Add Charge
          </button>
          <button className={buttonClass} onClick={() => setDrawer("split")}>
            <Split size={14} /> Split Folio
          </button>
          <button className={buttonClass} onClick={() => setDrawer("merge")}>
            <Share2 size={14} /> Merge Folio
          </button>
          <button
            className={`${buttonClass} px-2`}
            onClick={() => setDrawer("menu")}
            aria-label="More folio actions"
          >
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>

      <GuestStrip folio={folio} />
      <div className="mt-2 grid gap-2 lg:grid-cols-[minmax(0,1fr)_238px]">
        <main className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex overflow-x-auto border-b border-slate-200 px-3">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-[11px] font-semibold whitespace-nowrap ${activeTab === tab ? "border-b-2 border-[#102b5c] text-[#102b5c]" : "text-slate-500"}`}
              >
                {tab}
              </button>
            ))}
          </div>
          {activeTab === "Folio" ? (
            <>
              <div className="flex flex-wrap gap-2 border-b border-slate-100 p-3">
                <label className="flex min-w-[160px] flex-1 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-400">
                  <Search size={14} />
                  <input
                    className="min-w-0 flex-1 outline-none"
                    placeholder="Search charges..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </label>
                <select
                  className="rounded-lg border border-slate-200 px-3 text-xs"
                  value={transactionType}
                  onChange={(event) => setTransactionType(event.target.value)}
                >
                  <option>All Transactions</option>
                  <option>Charges</option>
                  <option>Payments</option>
                  <option>Adjustments</option>
                  <option>Voids</option>
                </select>
                <button className={buttonClass}>
                  Column <ChevronDown size={13} />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-[11px]">
                  <thead className="bg-slate-50 text-[10px] tracking-wide text-slate-500 uppercase">
                    <tr>
                      {[
                        "Date & Time",
                        "Description",
                        "Department",
                        "Qty",
                        "Rate (₹)",
                        "Amount (₹)",
                        "Status",
                        "Actions",
                      ].map((label) => (
                        <th className="px-3 py-3 font-semibold" key={label}>
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
                        onAction={(action) => setDrawer(action)}
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
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 p-3">
                <div className="flex gap-2">
                  <button
                    className="inline-flex items-center gap-2 rounded-lg bg-[#0d5bd7] px-4 py-2 text-xs font-bold text-white"
                    onClick={() => setDrawer("charge")}
                  >
                    <Plus size={14} /> Add Charge
                  </button>
                  <button
                    className={buttonClass}
                    onClick={() => setDrawer("adjust")}
                  >
                    <WalletCards size={14} /> Adjust Charge
                  </button>
                </div>
                <button
                  className="text-[11px] font-semibold text-blue-600"
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
        <FolioSummary folio={folio} onAction={setDrawer} />
      </div>
      <div className="mt-2 grid gap-2 lg:grid-cols-[1.2fr_1.2fr_1.8fr]">
        <RecentPayments
          payments={aggregate.payments || []}
          onViewAll={() => setActiveTab("Payments")}
        />
        <Deposits deposits={aggregate.deposits || []} />
        <QuickActions onAction={setDrawer} />
      </div>
      {drawer && (
        <FolioDrawer
          type={drawer}
          folio={folio}
          onClose={() => setDrawer("")}
          onComplete={() => {
            setDrawer("");
            refresh();
          }}
        />
      )}
    </div>
  );
}

function GuestStrip({ folio }) {
  const initials = (folio.guestName || "AG")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
  return (
    <section className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid size-12 place-items-center rounded-full bg-purple-100 text-lg font-bold text-purple-700">
        {initials}
      </div>
      <div className="min-w-[180px] flex-1">
        <div className="flex items-center gap-2">
          <strong className="text-sm">{folio.guestName || "Guest"}</strong>
          <StatusPill value="In House" />
          <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-700">
            VIP
          </span>
        </div>
        <div className="mt-2 text-[10px] text-slate-500">
          ☎ {folio.guestPhone || "—"}　✉ {folio.guestEmail || "—"}　🇮🇳{" "}
          {folio.country || "India"}
        </div>
      </div>
      <Info
        label="Booking No."
        value={folio.bookingNo || folio.bookingId || "—"}
      />
      <Info label="Room No." value={folio.roomNumber || "—"} />
      <Info label="Room Type" value={folio.roomType || "Executive Room"} />
      <Info label="Check-in" value={dateTime(folio.checkIn)} />
      <Info label="Check-out" value={dateTime(folio.checkOut)} />
      <Info label="Nights" value={folio.nights || "—"} />
      <button className="rounded-lg border border-slate-200 p-2">
        <MoreHorizontal size={15} />
      </button>
    </section>
  );
}

function Info({ label, value }) {
  return (
    <div className="border-l border-slate-100 pl-4 text-[10px]">
      <div className="text-slate-400">{label}</div>
      <strong>{value}</strong>
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
function ChargeRow({ charge, onAction }) {
  const amount =
    Number(charge.amount ?? charge.price ?? 0) * Number(charge.quantity || 1);
  return (
    <tr className="border-b border-slate-50">
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
      <td className="px-3 py-3 font-semibold">
        {charge.description || charge.name || "Charge"}
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
      <td className="px-3 py-3 font-bold">{money(amount)}</td>
      <td className="px-3 py-3">
        <StatusPill value={charge.status || "Posted"} />
      </td>
      <td className="px-3 py-3">
        <button
          className="rounded border border-slate-200 p-1"
          onClick={() => onAction("charge-menu")}
        >
          <MoreHorizontal size={14} />
        </button>
      </td>
    </tr>
  );
}
function FolioSummary({ folio, onAction }) {
  const summary = folio.summary || {};
  return (
    <aside className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex justify-between border-b border-slate-100 pb-3">
        <h2 className="border-l-2 border-blue-600 pl-2 text-sm font-bold">
          Folio Summary
        </h2>
        <span className="text-[10px] text-blue-600">
          Folio No: {folio.folioNo || "FL-000123"}
        </span>
      </div>
      <div className="space-y-2 py-3 text-xs">
        <Summary label="Room Charges" value={summary.roomCharges} />
        <Summary label="F&B Charges" value={summary.fnbCharges} />
        <Summary label="Laundry" value={summary.laundry} />
        <Summary label="Room Service" value={summary.roomService} />
        <Summary label="Minibar" value={summary.minibar} />
        <Summary label="Spa" value={summary.spa} />
        <hr />
        <Summary
          label="Subtotal"
          value={summary.subtotal ?? folio.total}
          bold
        />
        <Summary label="Discount" value={summary.discount} />
        <Summary label="Service Charge (10%)" value={summary.serviceCharge} />
        <Summary label="GST (18%)" value={summary.gst ?? summary.tax} />
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
        className="w-full rounded-lg bg-emerald-600 py-2.5 text-xs font-bold text-white"
        onClick={() => onAction("payment")}
      >
        <Plus size={14} className="mr-1 inline" /> Collect Payment
      </button>
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
      className={`${bold ? "font-bold" : ""} ${green ? "text-emerald-600" : ""} ${red ? "text-red-500" : ""} ${large ? "text-base" : ""} flex justify-between`}
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
        <h3 className="border-l-2 border-blue-600 pl-2 text-sm font-bold">
          Recent Payments
        </h3>
        <button
          className="text-[11px] font-semibold text-blue-600"
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
          <span>{dateTime(payment.createdAt)}</span>
          <span>{payment.method || "—"}</span>
          <span>{payment.referenceNo || payment.reference || "—"}</span>
          <strong className="text-right text-emerald-600">
            {money(payment.amount)}
          </strong>
        </div>
      ))}
    </section>
  );
}
function Deposits({ deposits }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-2 flex justify-between border-b border-slate-100 pb-2">
        <h3 className="border-l-2 border-blue-600 pl-2 text-sm font-bold">
          Advance / Deposits
        </h3>
        <button className={buttonClass}>
          {" "}
          <Plus size={12} /> Add Deposit
        </button>
      </div>
      {deposits.length ? (
        deposits.map((deposit) => (
          <div
            className="flex justify-between py-2 text-[10px]"
            key={deposit._id}
          >
            <span>{dateTime(deposit.createdAt)}</span>
            <span>{deposit.type || "Advance"}</span>
            <strong>{money(deposit.amount)}</strong>
            <span>{money(deposit.balance)}</span>
          </div>
        ))
      ) : (
        <p className="py-5 text-center text-xs text-slate-400">
          No deposits recorded.
        </p>
      )}
      <div className="mt-2 rounded-lg bg-blue-50 p-2 text-[10px] text-blue-700">
        ⓘ Advance amount adjusted to folio.
      </div>
    </section>
  );
}
function QuickActions({ onAction }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <h3 className="mb-2 border-l-2 border-blue-600 pl-2 text-sm font-bold">
        Quick Actions
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {[
          ["split", "Split Folio"],
          ["merge", "Merge Folio"],
          ["transfer", "Transfer Charge"],
          ["void", "Void Charge"],
          ["comp", "Complimentary"],
          ["print", "Print Folio"],
          ["share", "Email Folio"],
          ["whatsapp", "WhatsApp"],
          ["download", "Download PDF"],
        ].map(([key, label]) => (
          <button
            className={buttonClass}
            key={key}
            onClick={() => onAction(key)}
          >
            {label}
          </button>
        ))}
      </div>
    </section>
  );
}
function TabPlaceholder({ tab, payments = [], folio }) {
  return (
    <div className="p-5">
      <h2 className="mb-3 text-sm font-bold">{tab}</h2>
      {tab === "Payments" ? (
        payments.map((payment) => (
          <div
            className="flex justify-between border-b border-slate-100 py-3 text-xs"
            key={payment._id}
          >
            {payment.method}
            <span>{money(payment.amount)}</span>
          </div>
        ))
      ) : (
        <p className="text-xs text-slate-500">
          Showing {tab.toLowerCase()} details for{" "}
          {folio.guestName || "this guest"}.
        </p>
      )}
    </div>
  );
}
function FolioDrawer({ type, folio, onClose, onComplete }) {
  const [error, setError] = useState("");
  const submit = async (event) => {
    event.preventDefault();
    const body = Object.fromEntries(
      new FormData(event.currentTarget).entries(),
    );
    try {
      const id = folio._id || folio.id;
      if (type === "charge") await billingApi.addFolioCharge(id, body);
      else if (type === "split") await billingApi.splitFolio(id, body);
      else if (type === "merge") await billingApi.mergeFolio(id, body);
      else if (type === "invoice") await billingApi.generateInvoice(id, body);
      else if (type === "payment")
        await billingApi.collectFolioPayment(id, body);
      else if (
        ["share", "email", "whatsapp", "print", "download"].includes(type)
      )
        await billingApi.shareFolio(id, {
          ...body,
          channel: type === "share" ? "download" : type,
        });
      else if (["adjust", "void", "comp", "transfer"].includes(type))
        await billingApi.correctFolioCharge(id, type, body);
      onComplete();
    } catch (requestError) {
      setError(requestError.message || "Action failed.");
    }
  };
  return (
    <ActionDrawer
      title={type.replace("-", " ")}
      onClose={onClose}
      onSubmit={submit}
    >
      {type === "charge" && (
        <>
          <Field label="Department" name="department" required />
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
            label="Rate"
            name="amount"
            type="number"
            min="0"
            step="0.01"
            required
          />
          <Field label="Date" name="businessDate" type="date" />
          <Field label="Remarks" name="remarks" />
          <label className="flex gap-2 text-xs">
            <input type="checkbox" name="taxInclusive" /> Tax inclusive
          </label>
        </>
      )}
      {type === "split" && (
        <>
          <Field
            label="Charge indexes (comma separated)"
            name="itemIndexes"
            required
          />
          <Field label="Reason" name="reason" required />
        </>
      )}
      {type === "merge" && (
        <>
          <Field label="Target folio ID" name="targetFolioId" required />
          <Field label="Reason" name="reason" required />
        </>
      )}
      {type === "payment" && (
        <>
          <Field
            label="Amount"
            name="amount"
            type="number"
            min="0"
            step="0.01"
            defaultValue={folio.balanceDue}
            required
          />
          <Field label="Reference" name="reference" />
          <Field label="Method" name="method" defaultValue="cash" required />
        </>
      )}
      {["share", "email", "whatsapp"].includes(type) && (
        <>
          <Field
            label="Channel"
            name="channel"
            defaultValue={type === "share" ? "download" : type}
          />
          <Field label="Recipient" name="recipient" />
        </>
      )}
      {type === "invoice" && (
        <Field label="Invoice type" name="type" defaultValue="tax" required />
      )}
      {["adjust", "void", "comp", "transfer"].includes(type) && (
        <>
          <Field label="Reason" name="reason" required />
          <Field
            label="Charge index"
            name="itemIndex"
            type="number"
            min="0"
            required
          />
        </>
      )}
      {["print", "download"].includes(type) && (
        <p className="text-xs text-slate-500">
          A folio document will be prepared and recorded for delivery.
        </p>
      )}
      {error && (
        <p className="rounded bg-rose-50 p-2 text-xs text-rose-700">{error}</p>
      )}
    </ActionDrawer>
  );
}
