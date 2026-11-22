import { useMemo, useState } from "react";
import {
  getBills,
  cancelBill,
  getPayments,
  getRefunds,
  getKots,
} from "../../services/billing.js";
import {
  Page,
  Card,
  Panel,
  Table,
  Notice,
  Tabs,
  money,
  dateText,
  idOf,
  statusClass,
  useLoad,
  waLink,
  billShareText,
} from "./billingUi.jsx";
import { printInvoice } from "./billingUi.jsx";
export default function AllBills() {
  const { data: bills, setData: setBills, error, setError } = useLoad(getBills);
  const { data: payments } = useLoad(getPayments);
  const { data: refunds } = useLoad(getRefunds);
  const { data: kots } = useLoad(getKots);
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState("overview");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const today = bills.filter(
    (b) => new Date(b.createdAt).toDateString() === new Date().toDateString(),
  );
  const filtered = useMemo(
    () =>
      bills.filter(
        (b) =>
          (typeFilter === "all" || b.billType === typeFilter) &&
          (statusFilter === "all" || b.status === statusFilter) &&
          `${b.billNo} ${b.guestName}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [bills, typeFilter, statusFilter, query],
  );

  async function cancel() {
    const updated = await cancelBill(idOf(selected));
    setBills((current) =>
      current.map((b) => (idOf(b) === idOf(updated) ? updated : b)),
    );
    setSelected(updated);
  }

  const billPayments = payments.filter((p) => p.billId === idOf(selected));
  const billRefunds = refunds.filter((r) => r.billId === idOf(selected));
  const billKots = kots.filter((k) => k.billId === idOf(selected));

  return (
    <Page title="All Bills">
      <Notice text={error} onClose={() => setError("")} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Card title="Today's Bills" value={today.length} />
        <Card
          title="Today's Sales"
          value={money(
            today.reduce((s, b) => s + Number(b.totalAmount || 0), 0),
          )}
        />
        <Card
          title="Paid Amount"
          value={money(
            bills
              .filter((b) => b.status === "paid")
              .reduce((s, b) => s + Number(b.totalAmount || 0), 0),
          )}
        />
        <Card
          title="Pending Amount"
          value={money(
            bills
              .filter((b) => b.status === "saved")
              .reduce((s, b) => s + Number(b.totalAmount || 0), 0),
          )}
        />
        <Card
          title="Cancelled Bills"
          value={bills.filter((b) => b.status === "cancelled").length}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          className="min-w-[200px] flex-1 rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-xs"
          placeholder="Search bill no, guest..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-xs"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="all">All Types</option>
          <option value="dine-in">Dine-in</option>
          <option value="takeaway">Takeaway</option>
          <option value="room-charge">Room</option>
          <option value="delivery">Delivery</option>
        </select>
        <select
          className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-xs"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="saved">Saved</option>
          <option value="paid">Paid</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <Table
          rows={filtered}
          onRow={(row) => {
            setSelected(row);
            setTab("overview");
          }}
          columns={[
            { key: "billNo", label: "Bill No." },
            {
              key: "createdAt",
              label: "Date & Time",
              render: (r) => dateText(r.createdAt),
            },
            { key: "billType", label: "Type" },
            { key: "guestName", label: "Guest / Table" },
            {
              key: "totalAmount",
              label: "Amount",
              render: (r) => money(r.totalAmount),
            },
            {
              key: "status",
              label: "Status",
              render: (r) => (
                <span className={statusClass(r.status)}>{r.status}</span>
              ),
            },
          ]}
        />

        {selected ? (
          <Panel
            title={`Bill #${selected.billNo}`}
            onClose={() => setSelected(null)}
          >
            <Tabs
              values={["overview", "items", "payment", "refunds", "kots"]}
              current={tab}
              onChange={setTab}
            />
            <div className="pt-4 text-xs">
              {tab === "overview" && (
                <div className="space-y-2">
                  <p>Type: {selected.billType}</p>
                  <p>Guest: {selected.guestName || "—"}</p>
                  <p>
                    Status:{" "}
                    <span className={statusClass(selected.status)}>
                      {selected.status}
                    </span>
                  </p>
                  <p>Total: {money(selected.totalAmount)}</p>
                </div>
              )}
              {tab === "items" &&
                selected.items?.map((i, idx) => (
                  <p
                    key={idx}
                    className="flex justify-between border-b border-slate-800 py-1.5"
                  >
                    <span>
                      {i.name} ×{i.quantity}
                    </span>
                    <span>{money(i.price * i.quantity)}</span>
                  </p>
                ))}
              {tab === "payment" &&
                (billPayments.length ? (
                  billPayments.map((p) => (
                    <p
                      key={idOf(p)}
                      className="flex justify-between border-b border-slate-800 py-1.5"
                    >
                      <span>{p.method}</span>
                      <span>
                        {money(p.amount)} · {p.status}
                      </span>
                    </p>
                  ))
                ) : (
                  <p className="text-slate-500">No payments recorded.</p>
                ))}
              {tab === "refunds" &&
                (billRefunds.length ? (
                  billRefunds.map((r) => (
                    <p
                      key={idOf(r)}
                      className="flex justify-between border-b border-slate-800 py-1.5"
                    >
                      <span>{r.refundId}</span>
                      <span>
                        {money(r.amount)} · {r.status}
                      </span>
                    </p>
                  ))
                ) : (
                  <p className="text-slate-500">No refunds for this bill.</p>
                ))}
              {tab === "kots" &&
                (billKots.length ? (
                  billKots.map((k) => (
                    <p
                      key={idOf(k)}
                      className="flex justify-between border-b border-slate-800 py-1.5"
                    >
                      <span>
                        {k.kotNo} ({k.station})
                      </span>
                      <span>{k.status}</span>
                    </p>
                  ))
                ) : (
                  <p className="text-slate-500">No KOTs linked.</p>
                ))}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                onClick={() => printInvoice(selected)}
                className="cursor-pointer rounded-lg border border-slate-700 py-2 text-xs"
              >
                Print Bill
              </button>
              <button
                onClick={() =>
                  window.open(
                    waLink(selected.guestPhone, billShareText(selected)),
                    "_blank",
                  )
                }
                className="cursor-pointer rounded-lg border border-slate-700 py-2 text-xs"
              >
                Send Invoice
              </button>
              <button
                onClick={cancel}
                disabled={selected.status === "cancelled"}
                className="cursor-pointer rounded-lg border border-red-500/40 py-2 text-xs text-red-300 disabled:opacity-40"
              >
                Cancel Bill
              </button>
              <a
                href={`/billing/refunds?billId=${idOf(selected)}`}
                className="cursor-pointer rounded-lg border border-slate-700 py-2 text-center text-xs"
              >
                Refund
              </a>
            </div>
          </Panel>
        ) : (
          <Panel title="Bill Details">
            <p className="text-sm text-slate-500">Select a bill.</p>
          </Panel>
        )}
      </div>
    </Page>
  );
}
