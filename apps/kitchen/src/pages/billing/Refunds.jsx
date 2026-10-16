import { useState } from "react";
import {
  getRefunds,
  createRefund,
  decideRefund,
  getBills,
  getPayments,
} from "../../services/billing.js";
import {
  Page,
  Card,
  Panel,
  Table,
  Notice,
  css,
  money,
  dateText,
  idOf,
  statusClass,
  useLoad,
} from "./billingUi.jsx";

export default function Refunds() {
  const {
    data: refunds,
    setData: setRefunds,
    error,
    setError,
  } = useLoad(getRefunds);
  const { data: bills } = useLoad(getBills);
  const { data: payments } = useLoad(getPayments);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    billId: "",
    paymentId: "",
    amount: "",
    reason: "",
  });

  const billPayments = payments.filter((p) => p.billId === form.billId);

  async function submit(e) {
    e.preventDefault();
    try {
      const created = await createRefund({
        ...form,
        amount: Number(form.amount),
      });
      setRefunds((current) => [created, ...current]);
      setForm({ billId: "", paymentId: "", amount: "", reason: "" });
    } catch (err) {
      setError(err.message);
    }
  }

  async function decide(decision) {
    try {
      const updated = await decideRefund(idOf(selected), decision);
      setRefunds((current) =>
        current.map((r) => (idOf(r) === idOf(updated) ? updated : r)),
      );
      setSelected(updated);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Page title="Refunds">
      <Notice text={error} onClose={() => setError("")} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          title="Today's Refunds"
          value={
            refunds.filter(
              (r) =>
                new Date(r.createdAt).toDateString() ===
                new Date().toDateString(),
            ).length
          }
        />
        <Card
          title="Pending"
          value={refunds.filter((r) => r.status === "pending").length}
        />
        <Card
          title="Completed"
          value={refunds.filter((r) => r.status === "completed").length}
        />
        <Card
          title="Rejected"
          value={refunds.filter((r) => r.status === "rejected").length}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <section className="space-y-4">
          <form
            onSubmit={submit}
            className="grid gap-2 rounded-xl border border-slate-800 bg-slate-900/70 p-4 sm:grid-cols-2"
          >
            <select
              required
              className={css}
              value={form.billId}
              onChange={(e) =>
                setForm({ ...form, billId: e.target.value, paymentId: "" })
              }
            >
              <option value="">Select bill</option>
              {bills.map((b) => (
                <option key={idOf(b)} value={idOf(b)}>
                  #{b.billNo} — {money(b.totalAmount)}
                </option>
              ))}
            </select>
            <select
              required
              className={css}
              value={form.paymentId}
              onChange={(e) => setForm({ ...form, paymentId: e.target.value })}
            >
              <option value="">Select payment</option>
              {billPayments.map((p) => (
                <option key={idOf(p)} value={idOf(p)}>
                  {p.transactionId} · {money(p.amount)}
                </option>
              ))}
            </select>
            <input
              required
              className={css}
              type="number"
              placeholder="Amount"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
            <input
              required
              className={css}
              placeholder="Reason"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
            />
            <button className="cursor-pointer rounded-lg bg-emerald-400 py-2 text-xs font-bold text-slate-950 sm:col-span-2">
              + New Refund
            </button>
          </form>

          <Table
            rows={refunds}
            onRow={setSelected}
            columns={[
              { key: "refundId", label: "Refund ID" },
              {
                key: "billNo",
                label: "Bill No.",
                render: (r) => r.billNo || r.billId,
              },
              {
                key: "createdAt",
                label: "Date & Time",
                render: (r) => dateText(r.createdAt),
              },
              {
                key: "amount",
                label: "Amount",
                render: (r) => money(r.amount),
              },
              { key: "reason", label: "Reason" },
              {
                key: "status",
                label: "Status",
                render: (r) => (
                  <span className={statusClass(r.status)}>{r.status}</span>
                ),
              },
            ]}
          />
        </section>

        {selected ? (
          <Panel
            title={`Refund ${selected.refundId}`}
            onClose={() => setSelected(null)}
          >
            <div className="space-y-2 text-xs">
              <p>Bill: {selected.billId}</p>
              <p>Amount: {money(selected.amount)}</p>
              <p>Reason: {selected.reason}</p>
              <p>
                Status:{" "}
                <span className={statusClass(selected.status)}>
                  {selected.status}
                </span>
              </p>
            </div>
            <div className="mt-5 space-y-2 border-t border-slate-800 pt-4 text-xs">
              {["Refund Requested", "Manager Approval", "Refund Completed"].map(
                (step, idx) => {
                  const stage =
                    selected.status === "pending"
                      ? 0
                      : selected.status === "completed"
                        ? 2
                        : -1;
                  const done =
                    selected.status === "rejected" ? false : idx <= stage;
                  return (
                    <p
                      key={step}
                      className={done ? "text-emerald-400" : "text-slate-500"}
                    >
                      {done ? "✓" : "○"} {step}
                    </p>
                  );
                },
              )}
              {selected.status === "rejected" && (
                <p className="text-red-400">✕ Rejected</p>
              )}
            </div>
            {selected.status === "pending" && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  onClick={() => decide("approve")}
                  className="cursor-pointer rounded-lg bg-emerald-400 py-2 text-xs font-bold text-slate-950"
                >
                  ✓ Approve
                </button>
                <button
                  onClick={() => decide("reject")}
                  className="cursor-pointer rounded-lg border border-red-500/40 py-2 text-xs text-red-300"
                >
                  ✕ Reject
                </button>
              </div>
            )}
          </Panel>
        ) : (
          <Panel title="Refund Details">
            <p className="text-sm text-slate-500">Select a refund.</p>
          </Panel>
        )}
      </div>
    </Page>
  );
}
