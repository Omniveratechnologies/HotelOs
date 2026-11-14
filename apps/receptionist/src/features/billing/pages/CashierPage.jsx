import { useState, useMemo } from "react";
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
import {
  Button,
  Header,
  KpiTile,
  KpiTileRow,
  StatusChip,
  ReceiptModal,
} from "@hotelos/ui/components";
import { formatCurrency as money } from "@hotelos/utils";
import { billingApi } from "../api/billingApi.js";
import { ActionDrawer, Field, Panel, BillingPageSkeleton } from "../components";

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

  const shift = data.shift;
  const transactions = data.transactions || [];

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

  return (
    <div>
      <Header
        pageTitle="Cashier Shifts & Float Management"
        pageDescription="Manage front desk payments, cash transactions and daily cashier operations."
      >
        {shift ? (
          <Button
            variant="primary"
            size="sm"
            className="bg-brand-900 hover:bg-brand-950 gap-2 text-white"
            onClick={() => setDrawer("entry")}
            disabled={query.isLoading}
          >
            <Plus size={14} /> Add Cash Entry
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            className="bg-brand-900 hover:bg-brand-950 gap-2 text-white"
            onClick={() => setDrawer("open")}
            disabled={query.isLoading}
          >
            <Plus size={14} /> Open Cash Drawer
          </Button>
        )}
      </Header>

      <div className="space-y-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500">Current Shift:</span>
            <span className="text-brand-900 font-semibold">
              {shift ? "Drawer Open" : "Drawer Closed"}
            </span>
            {shift && (
              <span className="bg-primary-50 text-primary-700 rounded-full px-2 py-0.5 text-[11px] font-medium">
                Float: {money(shift.openingFloat)}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-gray-200"
              onClick={() => setDrawer("close")}
              disabled={!shift}
            >
              <LockKeyhole size={14} /> Close Shift
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-gray-200"
              onClick={() => setDrawer("count")}
              disabled={!shift}
            >
              <Banknote size={14} /> Cash Count
            </Button>
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                className="border-gray-200 px-2"
                onClick={() => setMenuOpen((prev) => !prev)}
                aria-label="More actions"
              >
                <MoreHorizontal size={16} />
              </Button>
              {menuOpen && (
                <div className="absolute top-full right-0 z-20 mt-1 w-52 rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-50"
                    onClick={openShiftSlip}
                  >
                    <Printer size={13} className="text-primary-600" /> Print
                    Shift Summary Slip
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-50"
                    onClick={exportTransactionsCsv}
                  >
                    <Download size={13} className="text-emerald-600" /> Export
                    Shift (CSV)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {query.isError ? (
          <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
            Cashier data could not be loaded.
          </div>
        ) : query.isLoading ? (
          <BillingPageSkeleton kpis={4} tableRows={6} />
        ) : (
          <>
            <KpiTileRow>
              <KpiTile
                title="Total Collections Today"
                value={money(data.metrics?.total)}
                subtitle={`${transactions.length} transactions`}
                icon={Receipt}
              />
              <KpiTile
                title="Card Payments"
                value={money(data.metrics?.card)}
                subtitle="Successful"
              />
              <KpiTile
                title="UPI Payments"
                value={money(data.metrics?.upi)}
                subtitle="Successful"
              />
              <KpiTile
                title="Cash Payments"
                value={money(data.metrics?.cash)}
                subtitle="Drawer receipts"
                icon={Banknote}
              />
              <KpiTile
                title="Refunds"
                value={money(data.metrics?.refunds)}
                subtitle="Today"
              />
            </KpiTileRow>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
              <Panel title="Today's Transactions">
                <div className="mb-4 flex flex-wrap gap-2">
                  {[
                    "transactions",
                    "drawer",
                    "summary",
                    "refunds",
                    "settlement",
                  ].map((value) => (
                    <button
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                        tab === value
                          ? "bg-brand-900 text-white"
                          : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                      }`}
                      key={value}
                      onClick={() => setTab(value)}
                    >
                      {value}
                    </button>
                  ))}
                </div>
                {tab === "transactions" && (
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full min-w-[720px] text-left text-xs">
                      <thead className="border-b border-gray-200 bg-gray-50/75 text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
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
                            <th className="px-4 py-3" key={label}>
                              {label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {transactions.map((row) => (
                          <tr className="hover:bg-gray-50/50" key={row._id}>
                            <td className="px-4 py-3 text-gray-600">
                              {new Date(row.createdAt).toLocaleTimeString(
                                "en-IN",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </td>
                            <td className="text-brand-900 px-4 py-3 font-semibold">
                              {row.billId || "—"}
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-medium text-gray-900">
                                {row.guestName || "Guest"}
                              </span>
                              <small className="block text-gray-400">
                                {row.roomNo || row.bookingId || "—"}
                              </small>
                            </td>
                            <td className="px-4 py-3 font-bold text-gray-900">
                              {money(row.amount)}
                            </td>
                            <td className="px-4 py-3">
                              <span className="bg-primary-50 text-primary-700 rounded-full px-2.5 py-1 text-[11px] font-medium">
                                {row.method}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <StatusChip status={row.status} />
                            </td>
                            <td className="px-4 py-3">
                              <button className="rounded border border-gray-200 p-1 text-gray-500 hover:bg-gray-50">
                                <MoreHorizontal size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {!transactions.length && (
                      <p className="p-8 text-center text-xs text-gray-400">
                        No transactions for this business date.
                      </p>
                    )}
                  </div>
                )}
                {tab === "drawer" && <DrawerSummary shift={shift} />}
                {tab === "summary" && <MethodSummary methods={data.methods} />}
                {tab === "refunds" && <Refunds rows={data.refunds} />}
                {tab === "settlement" && (
                  <MethodSummary methods={data.methods} />
                )}
              </Panel>

              <div className="space-y-6">
                <Panel
                  title="Cash Drawer"
                  action={<StatusChip status={shift ? "open" : "closed"} />}
                >
                  {shift ? (
                    <>
                      <p className="text-center text-xs text-gray-500">
                        Opened at{" "}
                        {new Date(shift.createdAt).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <div className="bg-primary-50/60 border-primary-100 my-4 rounded-xl border p-4 text-center">
                        <p className="text-primary-900 text-xs font-medium">
                          Current Cash in Drawer
                        </p>
                        <b className="text-brand-900 mt-1 block text-2xl font-bold">
                          {money(shift.currentCash)}
                        </b>
                      </div>
                      <DrawerSummary shift={shift} />
                      <Button
                        variant="primary"
                        className="bg-brand-900 hover:bg-brand-950 mt-4 w-full text-white"
                        onClick={() => setDrawer("entry")}
                      >
                        Add Cash Entry
                      </Button>
                    </>
                  ) : (
                    <p className="py-8 text-center text-xs text-gray-500">
                      Open a drawer to begin cashier operations.
                    </p>
                  )}
                </Panel>

                <Panel title="Quick Actions">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start gap-2 border-gray-200"
                      onClick={() => setDrawer("payment")}
                    >
                      <Wallet size={14} /> Payment
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start gap-2 border-gray-200"
                      onClick={() => setDrawer("refund")}
                    >
                      <Receipt size={14} /> Refund
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start gap-2 border-gray-200"
                      onClick={() => setDrawer("entry")}
                    >
                      <Banknote size={14} /> Petty Cash
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start gap-2 border-gray-200"
                      onClick={() => setDrawer("report")}
                    >
                      <CalendarDays size={14} /> Shift Report
                    </Button>
                  </div>
                </Panel>
              </div>
            </div>
          </>
        )}
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
        <ReceiptModal
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
      <div className="flex justify-between text-gray-600">
        <span>Opening Balance</span>
        <b className="text-gray-900">{money(shift.openingFloat)}</b>
      </div>
      <div className="flex justify-between text-gray-600">
        <span>Cash Received</span>
        <b className="text-emerald-700">{money(shift.cashIn || 0)}</b>
      </div>
      <div className="flex justify-between text-gray-600">
        <span>Cash Paid Out</span>
        <b className="text-rose-700">{money(shift.cashOut || 0)}</b>
      </div>
    </div>
  ) : null;
}

function MethodSummary({ methods = [] }) {
  return (
    <div className="space-y-3">
      {methods.map((row) => (
        <div className="flex justify-between text-xs" key={row.method}>
          <span className="text-gray-600 capitalize">{row.method}</span>
          <b className="text-gray-900">
            {money(row.amount)}{" "}
            <small className="font-normal text-gray-400">({row.count})</small>
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
            <span className="font-medium text-gray-800">
              {row.reference || "Refund"}
            </span>
            <small className="block text-gray-400">
              {row.reason || "Customer refund"}
            </small>
          </span>
          <b className="text-rose-600">{money(row.amount)}</b>
        </div>
      ))}
      {!rows.length && (
        <p className="py-4 text-center text-xs text-gray-400">
          No refunds recorded.
        </p>
      )}
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
      <p className="bg-primary-50 text-primary-800 border-primary-100 rounded-lg border p-3 text-xs">
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
      <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
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
          className="focus:ring-primary-500 mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-xs text-gray-800 focus:ring-1 focus:outline-none"
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
            className="flex items-center justify-between gap-3 border-b border-gray-100 pb-2"
            key={val}
          >
            <span className="font-semibold text-gray-700">₹{val} notes</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                className="focus:ring-primary-500 w-20 rounded border border-gray-200 px-2 py-1 text-right text-xs focus:ring-1 focus:outline-none"
                value={denoms[val] || ""}
                placeholder="0"
                onChange={(e) => updateDenom(val, e.target.value)}
              />
              <span className="w-16 text-right font-medium text-gray-500">
                {money((denoms[val] || 0) * val)}
              </span>
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-2">
          <span className="font-semibold text-gray-700">Coins</span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              className="focus:ring-primary-500 w-20 rounded border border-gray-200 px-2 py-1 text-right text-xs focus:ring-1 focus:outline-none"
              value={denoms.coins || ""}
              placeholder="0"
              onChange={(e) => updateDenom("coins", e.target.value)}
            />
            <span className="w-16 text-right font-medium text-gray-500">
              {money(denoms.coins || 0)}
            </span>
          </div>
        </div>
        <div className="bg-primary-50 border-primary-100 text-brand-900 mt-4 flex justify-between rounded-lg border p-3 font-bold">
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
          className="focus:ring-primary-500 mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-xs text-gray-800 focus:ring-1 focus:outline-none"
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
        <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
          <p className="text-gray-600">
            Status:{" "}
            <strong className="text-gray-900 capitalize">
              {shift ? "Active Shift" : "No Shift Active"}
            </strong>
          </p>
          {shift && (
            <p className="mt-1 text-gray-600">
              Started:{" "}
              {new Date(shift.createdAt).toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </div>
        <div className="space-y-2 border-t border-gray-100 pt-3">
          <div className="flex justify-between text-gray-600">
            <span>Opening Float</span>
            <b className="text-gray-900">{money(shift?.openingFloat || 0)}</b>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Cash Collected</span>
            <b className="text-gray-900">{money(data.metrics?.cash || 0)}</b>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Card Collected</span>
            <b className="text-gray-900">{money(data.metrics?.card || 0)}</b>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>UPI Collected</span>
            <b className="text-gray-900">{money(data.metrics?.upi || 0)}</b>
          </div>
          <div className="flex justify-between text-rose-600">
            <span>Refunds Issued</span>
            <b>{money(data.metrics?.refunds || 0)}</b>
          </div>
          <div className="text-brand-900 flex justify-between border-t border-gray-200 pt-2 font-bold">
            <span>Net Shift Revenue</span>
            <span>{money(data.metrics?.total || 0)}</span>
          </div>
        </div>
      </div>
    </ActionDrawer>
  );
}
