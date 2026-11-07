import { useState } from "react";
import { useQuery } from "@hotelos/query";
import {
  Banknote,
  CalendarDays,
  Download,
  LockKeyhole,
  MoreHorizontal,
  Plus,
  Printer,
  Receipt,
  Wallet,
} from "lucide-react";
import { billingApi } from "../billingApi.js";
import {
  ActionDrawer,
  Field,
  KpiCard,
  Panel,
  StatusPill,
  ThermalReceiptModal,
  money,
} from "../billingUi.jsx";

const button =
  "inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-[#102b5c] shadow-sm";

export default function CashierPage() {
  const query = useQuery({
    queryKey: ["billing", "cashier"],
    queryFn: () => billingApi.cashierSummary(),
  });
  const data = query.data || {};
  const [drawer, setDrawer] = useState("");
  const [tab, setTab] = useState("transactions");
  const [menuOpen, setMenuOpen] = useState(false);
  const [shiftSlipData, setShiftSlipData] = useState(null);
  const reload = () => {
    setDrawer("");
    setMenuOpen(false);
    query.refetch();
  };

  const exportTransactionsCsv = () => {
    if (!transactions.length) return;
    const headers = [
      "Time",
      "Payment ID",
      "Bill ID",
      "Guest",
      "Method",
      "Amount",
      "Status",
    ];
    const csvContent = [
      headers.join(","),
      ...transactions.map((t) =>
        [
          `"${t.createdAt ? new Date(t.createdAt).toISOString() : ""}"`,
          `"${t.transactionId || t._id || ""}"`,
          `"${t.billId || ""}"`,
          `"${t.guestName || ""}"`,
          `"${t.method || ""}"`,
          t.amount || 0,
          `"${t.status || "success"}"`,
        ].join(","),
      ),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `cashier-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    setMenuOpen(false);
  };

  const openShiftSlip = () => {
    setShiftSlipData({
      invoiceNo: `SHIFT-${shift?._id ? String(shift._id).slice(-6).toUpperCase() : "CURR"}`,
      createdAt: shift?.createdAt || new Date(),
      guestName: "Front Desk Cashier Shift Summary",
      subtotal: shift?.currentCash || data.metrics?.cash || 0,
      totalAmount: data.metrics?.total || 0,
      items: [
        { name: "Opening Float", price: shift?.openingFloat || 0, quantity: 1 },
        {
          name: "Cash Collections",
          price: data.metrics?.cash || 0,
          quantity: 1,
        },
        { name: "Cash Pay-In", price: shift?.cashIn || 0, quantity: 1 },
        { name: "Cash Pay-Out", price: -(shift?.cashOut || 0), quantity: 1 },
        {
          name: "Card Collections",
          price: data.metrics?.card || 0,
          quantity: 1,
        },
        { name: "UPI Collections", price: data.metrics?.upi || 0, quantity: 1 },
      ],
      method: "Cashier Shift Audit",
    });
    setMenuOpen(false);
  };
  if (query.isLoading)
    return <div className="p-8 text-sm text-slate-500">Loading cashier…</div>;
  if (query.isError)
    return (
      <div className="m-6 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
        Cashier data could not be loaded.
      </div>
    );
  const shift = data.shift;
  const transactions = data.transactions || [];
  return (
    <div className="min-h-full bg-[#f4f7fb] p-4 text-[#102b5c] sm:p-6">
      <header className="mb-4 flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
        <div>
          <div className="mb-1 text-[11px] font-semibold text-blue-600">
            Billing &amp; Folio <span className="px-2 text-slate-400">›</span>{" "}
            Cashier
          </div>
          <h1 className="text-2xl font-bold">Cashier</h1>
          <p className="text-xs text-slate-500">
            Manage front desk payments, cash transactions and daily cashier
            operations.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {shift ? (
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-[#102b5c] px-4 py-2 text-xs font-bold text-white"
              onClick={() => setDrawer("entry")}
            >
              <Plus size={14} /> Add Cash Entry
            </button>
          ) : (
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-[#102b5c] px-4 py-2 text-xs font-bold text-white"
              onClick={() => setDrawer("open")}
            >
              <Plus size={14} /> Open Cash Drawer
            </button>
          )}
          <button
            className={button}
            onClick={() => setDrawer("close")}
            disabled={!shift}
          >
            <LockKeyhole size={14} /> Close Shift
          </button>
          <button
            className={button}
            onClick={() => setDrawer("count")}
            disabled={!shift}
          >
            <Banknote size={14} /> Cash Count
          </button>
          <div className="relative">
            <button
              className={`${button} px-2`}
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="More actions"
            >
              <MoreHorizontal size={16} />
            </button>
            {menuOpen && (
              <div className="absolute top-full right-0 z-20 mt-1 w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50"
                  onClick={openShiftSlip}
                >
                  <Printer size={13} className="text-blue-600" /> Print Shift
                  Summary Slip
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50"
                  onClick={exportTransactionsCsv}
                >
                  <Download size={13} className="text-emerald-600" /> Export
                  Shift (CSV)
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      <div className="mb-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          label="Total Collections Today"
          value={money(data.metrics?.total)}
          detail={`${transactions.length} transactions`}
          icon={Receipt}
        />
        <KpiCard
          label="Card Payments"
          value={money(data.metrics?.card)}
          detail="Successful"
          tone="blue"
        />
        <KpiCard
          label="UPI Payments"
          value={money(data.metrics?.upi)}
          detail="Successful"
          tone="purple"
        />
        <KpiCard
          label="Cash Payments"
          value={money(data.metrics?.cash)}
          detail="Drawer receipts"
          tone="amber"
          icon={Banknote}
        />
        <KpiCard
          label="Refunds"
          value={money(data.metrics?.refunds)}
          detail="Today"
          tone="red"
        />
      </div>
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_285px]">
        <Panel title="Today's Transactions">
          <div className="mb-3 flex flex-wrap gap-2">
            {["transactions", "drawer", "summary", "refunds", "settlement"].map(
              (value) => (
                <button
                  className={`rounded-lg px-3 py-2 text-xs font-semibold capitalize ${tab === value ? "bg-[#102b5c] text-white" : "border border-slate-200 bg-white text-slate-600"}`}
                  key={value}
                  onClick={() => setTab(value)}
                >
                  {value}
                </button>
              ),
            )}
          </div>
          {tab === "transactions" && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-[11px]">
                <thead className="border-b border-slate-100 text-[10px] text-slate-500 uppercase">
                  <tr>
                    {[
                      "Time",
                      "Bill No.",
                      "Guest / Room",
                      "Amount",
                      "Method",
                      "Status",
                      "Actions",
                    ].map((label) => (
                      <th className="px-3 py-3" key={label}>
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((row) => (
                    <tr className="border-b border-slate-50" key={row._id}>
                      <td className="px-3 py-3">
                        {new Date(row.createdAt).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-3 py-3 font-semibold">
                        {row.billId || "—"}
                      </td>
                      <td className="px-3 py-3">
                        {row.guestName || "Guest"}
                        <small className="block text-slate-400">
                          {row.roomNo || row.bookingId || "—"}
                        </small>
                      </td>
                      <td className="px-3 py-3 font-bold">
                        {money(row.amount)}
                      </td>
                      <td className="px-3 py-3">
                        <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px]">
                          {row.method}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <StatusPill value={row.status} />
                      </td>
                      <td className="px-3 py-3">
                        <button className="rounded border border-slate-200 p-1">
                          <MoreHorizontal size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!transactions.length && (
                <p className="p-8 text-center text-xs text-slate-400">
                  No transactions for this business date.
                </p>
              )}
            </div>
          )}
          {tab === "drawer" && <DrawerSummary shift={shift} />}
          {tab === "summary" && <MethodSummary methods={data.methods} />}
          {tab === "refunds" && <Refunds rows={data.refunds} />}
          {tab === "settlement" && <MethodSummary methods={data.methods} />}
        </Panel>
        <div className="space-y-3">
          <Panel
            title="Cash Drawer"
            action={<StatusPill value={shift ? "open" : "closed"} />}
          >
            {shift ? (
              <>
                <p className="text-center text-xs text-slate-500">
                  Opened at{" "}
                  {new Date(shift.createdAt).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <div className="my-3 rounded-lg bg-blue-50 p-4 text-center">
                  <p className="text-xs">Current Cash in Drawer</p>
                  <b className="text-2xl">{money(shift.currentCash)}</b>
                </div>
                <DrawerSummary shift={shift} />
                <button
                  className="mt-3 w-full rounded-lg bg-[#102b5c] px-3 py-2 text-xs font-bold text-white"
                  onClick={() => setDrawer("entry")}
                >
                  Add Cash Entry
                </button>
              </>
            ) : (
              <p className="py-8 text-center text-xs text-slate-500">
                Open a drawer to begin cashier operations.
              </p>
            )}
          </Panel>
          <Panel title="Quick Actions">
            <div className="grid grid-cols-2 gap-2">
              <button className={button} onClick={() => setDrawer("payment")}>
                <Wallet size={14} /> Payment
              </button>
              <button className={button} onClick={() => setDrawer("refund")}>
                <Receipt size={14} /> Refund
              </button>
              <button className={button} onClick={() => setDrawer("entry")}>
                <Banknote size={14} /> Petty Cash
              </button>
              <button className={button} onClick={() => setDrawer("report")}>
                <CalendarDays size={14} /> Shift Report
              </button>
            </div>
          </Panel>
        </div>
      </div>
      {drawer === "open" && (
        <OpenDrawer onClose={() => setDrawer("")} onComplete={reload} />
      )}
      {drawer === "close" && (
        <CloseDrawer
          shift={shift}
          onClose={() => setDrawer("")}
          onComplete={reload}
        />
      )}
      {drawer === "entry" && (
        <EntryDrawer
          shift={shift}
          onClose={() => setDrawer("")}
          onComplete={reload}
        />
      )}
      {drawer === "count" && (
        <CountDrawer
          shift={shift}
          onClose={() => setDrawer("")}
          onComplete={reload}
        />
      )}
      {drawer === "payment" && (
        <CashierPaymentDrawer
          shift={shift}
          onClose={() => setDrawer("")}
          onComplete={reload}
        />
      )}
      {drawer === "refund" && (
        <CashierRefundDrawer
          onClose={() => setDrawer("")}
          onComplete={reload}
        />
      )}
      {drawer === "report" && (
        <ShiftReportDrawer
          shift={shift}
          data={data}
          onClose={() => setDrawer("")}
        />
      )}
      {shiftSlipData && (
        <ThermalReceiptModal
          title="Shift Summary Slip"
          data={shiftSlipData}
          onClose={() => setShiftSlipData(null)}
        />
      )}
    </div>
  );
}

function DrawerSummary({ shift }) {
  return shift ? (
    <div className="space-y-2 text-xs">
      <div className="flex justify-between">
        <span>Opening Balance</span>
        <b>{money(shift.openingFloat)}</b>
      </div>
      <div className="flex justify-between">
        <span>Cash Received</span>
        <b>{money(shift.cashIn || 0)}</b>
      </div>
      <div className="flex justify-between">
        <span>Cash Paid Out</span>
        <b>{money(shift.cashOut || 0)}</b>
      </div>
    </div>
  ) : null;
}
function MethodSummary({ methods = [] }) {
  return (
    <div className="space-y-3">
      {methods.map((row) => (
        <div className="flex justify-between text-xs" key={row.method}>
          <span className="capitalize">{row.method}</span>
          <b>
            {money(row.amount)}{" "}
            <small className="font-normal text-slate-400">({row.count})</small>
          </b>
        </div>
      ))}
    </div>
  );
}
function Refunds({ rows = [] }) {
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div className="flex justify-between text-xs" key={row._id}>
          <span>
            {row.reference || "Refund"}
            <small className="block text-slate-400">
              {row.reason || "Customer refund"}
            </small>
          </span>
          <b>{money(row.amount)}</b>
        </div>
      ))}
    </div>
  );
}
function OpenDrawer({ onClose, onComplete }) {
  const [floatAmount, setFloatAmount] = useState("5000");
  const [error, setError] = useState("");
  const submit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await billingApi.openCashierShift({ openingFloat: Number(floatAmount) });
      onComplete();
    } catch (err) {
      setError(err.message || "Drawer could not be opened");
    }
  };
  return (
    <ActionDrawer
      title="Open Cash Drawer"
      onClose={onClose}
      onSubmit={submit}
      submitLabel="Open Drawer"
    >
      <Field
        label="Opening float"
        type="number"
        required
        value={floatAmount}
        onChange={(event) => setFloatAmount(event.target.value)}
      />
      <p className="rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
        Only one open drawer is allowed at a time. All cashier payments will be
        stamped to this shift.
      </p>
      {error && (
        <p className="rounded bg-rose-50 p-2 text-xs text-rose-700">{error}</p>
      )}
    </ActionDrawer>
  );
}

function CloseDrawer({ shift, onClose, onComplete }) {
  const [cash, setCash] = useState("");
  const [error, setError] = useState("");
  const submit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await billingApi.closeCashierShift(shift._id, {
        closingCash: Number(cash),
      });
      onComplete();
    } catch (err) {
      setError(err.message || "Shift could not be closed");
    }
  };
  return (
    <ActionDrawer
      title="Close Cashier Shift"
      onClose={onClose}
      onSubmit={submit}
      submitLabel="Close Shift"
    >
      <Field
        label="Counted closing cash"
        type="number"
        required
        value={cash}
        onChange={(event) => setCash(event.target.value)}
      />
      <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
        The shift becomes immutable after closing. Variance will be recorded in
        the shift report.
      </p>
      {error && (
        <p className="rounded bg-rose-50 p-2 text-xs text-rose-700">{error}</p>
      )}
    </ActionDrawer>
  );
}

function EntryDrawer({ shift, onClose, onComplete }) {
  const [form, setForm] = useState({ type: "in" });
  const [error, setError] = useState("");
  const submit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await billingApi.createCashEntry({ ...form, shiftId: shift?._id });
      onComplete();
    } catch (err) {
      setError(err.message || "Cash entry could not be saved");
    }
  };
  return (
    <ActionDrawer
      title="Add Cash Entry"
      onClose={onClose}
      onSubmit={submit}
      submitLabel="Save Cash Entry"
    >
      <Field
        label="Amount"
        type="number"
        required
        value={form.amount || ""}
        onChange={(event) => setForm({ ...form, amount: event.target.value })}
      />
      <Field label="Type">
        <select
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5"
          value={form.type}
          onChange={(event) => setForm({ ...form, type: event.target.value })}
        >
          <option value="in">Cash received / pay-in</option>
          <option value="out">Cash paid out</option>
          <option value="petty">Petty cash</option>
          <option value="deposit">Bank deposit</option>
        </select>
      </Field>
      <Field
        label="Reason"
        required
        value={form.reason || ""}
        onChange={(event) => setForm({ ...form, reason: event.target.value })}
      />
      {error && (
        <p className="rounded bg-rose-50 p-2 text-xs text-rose-700">{error}</p>
      )}
    </ActionDrawer>
  );
}

function CountDrawer({ shift, onClose, onComplete }) {
  const [denoms, setDenoms] = useState({
    500: 0,
    200: 0,
    100: 0,
    50: 0,
    20: 0,
    10: 0,
    coins: 0,
  });
  const [error, setError] = useState("");

  const calculatedTotal = useMemo(() => {
    return (
      (Number(denoms[500]) || 0) * 500 +
      (Number(denoms[200]) || 0) * 200 +
      (Number(denoms[100]) || 0) * 100 +
      (Number(denoms[50]) || 0) * 50 +
      (Number(denoms[20]) || 0) * 20 +
      (Number(denoms[10]) || 0) * 10 +
      (Number(denoms.coins) || 0)
    );
  }, [denoms]);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await billingApi.recordCashCount({
        shiftId: shift?._id,
        total: calculatedTotal,
      });
      onComplete();
    } catch (err) {
      setError(err.message || "Cash count could not be saved");
    }
  };

  const updateDenom = (key, val) => {
    setDenoms((prev) => ({
      ...prev,
      [key]: Math.max(0, parseInt(val, 10) || 0),
    }));
  };

  return (
    <ActionDrawer
      title="Denomination Cash Count"
      onClose={onClose}
      onSubmit={submit}
      submitLabel="Save Cash Count"
    >
      <div className="space-y-2 text-xs">
        {[500, 200, 100, 50, 20, 10].map((val) => (
          <div
            className="flex items-center justify-between gap-3 border-b border-slate-50 pb-1.5"
            key={val}
          >
            <span className="font-semibold text-slate-600">₹{val} notes</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                className="w-20 rounded border border-slate-200 px-2 py-1 text-right"
                value={denoms[val] || ""}
                placeholder="0"
                onChange={(e) => updateDenom(val, e.target.value)}
              />
              <span className="w-16 text-right font-medium text-slate-500">
                {money((denoms[val] || 0) * val)}
              </span>
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between gap-3 border-b border-slate-50 pb-1.5">
          <span className="font-semibold text-slate-600">Coins</span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              className="w-20 rounded border border-slate-200 px-2 py-1 text-right"
              value={denoms.coins || ""}
              placeholder="0"
              onChange={(e) => updateDenom("coins", e.target.value)}
            />
            <span className="w-16 text-right font-medium text-slate-500">
              {money(denoms.coins || 0)}
            </span>
          </div>
        </div>
        <div className="mt-3 flex justify-between rounded-lg bg-blue-50 p-3 font-bold text-blue-900">
          <span>Total Counted</span>
          <span>{money(calculatedTotal)}</span>
        </div>
      </div>
      {error && (
        <p className="mt-2 rounded bg-rose-50 p-2 text-xs text-rose-700">
          {error}
        </p>
      )}
    </ActionDrawer>
  );
}

function CashierPaymentDrawer({ shift, onClose, onComplete }) {
  const [form, setForm] = useState({ method: "cash" });
  const [error, setError] = useState("");
  const submit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await billingApi.createPayment({
        ...form,
        amount: Number(form.amount),
        cashierShiftId: shift?._id,
        source: "desk",
      });
      onComplete();
    } catch (err) {
      setError(err.message || "Payment could not be recorded");
    }
  };
  return (
    <ActionDrawer
      title="Record Shift Payment"
      onClose={onClose}
      onSubmit={submit}
      submitLabel="Record Payment"
    >
      <Field
        label="Bill / folio ID"
        required
        value={form.billId || ""}
        onChange={(event) => setForm({ ...form, billId: event.target.value })}
      />
      <Field
        label="Amount"
        type="number"
        required
        value={form.amount || ""}
        onChange={(event) => setForm({ ...form, amount: event.target.value })}
      />
      <Field label="Payment method">
        <select
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5"
          value={form.method}
          onChange={(event) => setForm({ ...form, method: event.target.value })}
        >
          <option value="cash">Cash</option>
          <option value="card">Card</option>
          <option value="upi">UPI</option>
          <option value="netbanking">Bank Transfer</option>
        </select>
      </Field>
      <Field
        label="Reference"
        value={form.referenceNo || ""}
        onChange={(event) =>
          setForm({ ...form, referenceNo: event.target.value })
        }
      />
      {error && (
        <p className="rounded bg-rose-50 p-2 text-xs text-rose-700">{error}</p>
      )}
    </ActionDrawer>
  );
}

function CashierRefundDrawer({ onClose, onComplete }) {
  const [form, setForm] = useState({});
  const [error, setError] = useState("");
  const submit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await billingApi.createRefund({
        ...form,
        amount: Number(form.amount),
        reason: form.reason,
      });
      onComplete();
    } catch (err) {
      setError(err.message || "Refund could not be recorded");
    }
  };
  return (
    <ActionDrawer
      title="Issue Refund"
      onClose={onClose}
      onSubmit={submit}
      submitLabel="Create Refund"
    >
      <Field
        label="Original payment ID"
        required
        value={form.paymentId || ""}
        onChange={(event) =>
          setForm({ ...form, paymentId: event.target.value })
        }
      />
      <Field
        label="Refund amount"
        type="number"
        required
        value={form.amount || ""}
        onChange={(event) => setForm({ ...form, amount: event.target.value })}
      />
      <Field
        label="Reason"
        required
        value={form.reason || ""}
        onChange={(event) => setForm({ ...form, reason: event.target.value })}
      />
      {error && (
        <p className="rounded bg-rose-50 p-2 text-xs text-rose-700">{error}</p>
      )}
    </ActionDrawer>
  );
}

function ShiftReportDrawer({ shift, data, onClose }) {
  return (
    <ActionDrawer
      title="Cashier Shift Summary Report"
      onClose={onClose}
      onSubmit={(e) => {
        e.preventDefault();
        window.print();
      }}
      submitLabel="Print Shift Summary"
    >
      <div className="space-y-3 text-xs">
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-slate-500">
            Status:{" "}
            <strong className="capitalize">
              {shift ? "Active Shift" : "No Shift Active"}
            </strong>
          </p>
          {shift && (
            <p className="text-slate-500">
              Started:{" "}
              {new Date(shift.createdAt).toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </div>
        <div className="space-y-2 border-t border-slate-100 pt-2">
          <div className="flex justify-between">
            <span>Opening Float</span>
            <b>{money(shift?.openingFloat || 0)}</b>
          </div>
          <div className="flex justify-between">
            <span>Cash Collected</span>
            <b>{money(data.metrics?.cash || 0)}</b>
          </div>
          <div className="flex justify-between">
            <span>Card Collected</span>
            <b>{money(data.metrics?.card || 0)}</b>
          </div>
          <div className="flex justify-between">
            <span>UPI Collected</span>
            <b>{money(data.metrics?.upi || 0)}</b>
          </div>
          <div className="flex justify-between text-rose-600">
            <span>Refunds Issued</span>
            <b>{money(data.metrics?.refunds || 0)}</b>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-1 font-bold text-[#102b5c]">
            <span>Net Shift Revenue</span>
            <span>{money(data.metrics?.total || 0)}</span>
          </div>
        </div>
      </div>
    </ActionDrawer>
  );
}
