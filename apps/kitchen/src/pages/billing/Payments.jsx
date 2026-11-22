import { useMemo, useState } from "react";
import {
  Card,
  Page,
  Panel,
  Table,
  Notice,
  money,
  dateText,
  statusClass,
  useLoad,
  css,
} from "./billingUi.jsx";

import { getPayments } from "../../services/billing.js";
import { waLink } from "./billingUi.jsx";

export default function Payments() {
  const { data, error, setError } = useLoad(getPayments);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState("");

  const methods = [
    "cash",
    "upi",
    "card",
    "room",
    "netbanking",
    "wallet",
    "complimentary",
  ];

  const filtered = useMemo(
    () =>
      data.filter((row) =>
        `${row.transactionId} ${row.referenceNo} ${row.method}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [data, query],
  );

  const today = data.filter(
    (row) =>
      new Date(row.createdAt).toDateString() === new Date().toDateString(),
  );

  return (
    <Page title="Payments">
      <Notice text={error} onClose={() => setError("")} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          title="Today's collection"
          value={money(
            today.reduce((sum, row) => sum + Number(row.amount || 0), 0),
          )}
        />
        <Card title="Transactions" value={data.length} />
        {methods.slice(0, 2).map((method) => (
          <Card
            key={method}
            title={method}
            value={money(
              data
                .filter((row) => row.method === method)
                .reduce((sum, row) => sum + Number(row.amount || 0), 0),
            )}
          />
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <section className="space-y-4">
          <input
            className={`${css} max-w-sm`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search transactions..."
          />
          <Table
            rows={filtered}
            onRow={setSelected}
            columns={[
              { key: "transactionId", label: "Transaction ID" },
              {
                key: "billNo",
                label: "Bill No.",
                render: (r) => r.billNo || r.billId,
              },
              {
                key: "createdAt",
                label: "Date & Time",
                render: (row) => dateText(row.createdAt),
              },
              { key: "method", label: "Method" },
              {
                key: "amount",
                label: "Amount",
                render: (row) => money(row.amount),
              },
              { key: "referenceNo", label: "Reference" },
              {
                key: "status",
                label: "Status",
                render: (row) => (
                  <span className={statusClass(row.status)}>{row.status}</span>
                ),
              },
            ]}
          />
        </section>

        {selected ? (
          <Panel title="Payment Details" onClose={() => setSelected(null)}>
            <div className="space-y-2 text-xs">
              <p>Transaction: {selected.transactionId}</p>
              <p>Bill: {selected.billNo || selected.billId}</p>
              <p>Method: {selected.method}</p>
              <p>Amount: {money(selected.amount)}</p>
              <p>Created: {dateText(selected.createdAt)}</p>

              <h3 className="border-t border-slate-800 pt-4 font-semibold">
                Split Payment Breakdown
              </h3>
              {(selected.splitPayments || []).map((split, index) => (
                <p className="flex justify-between" key={index}>
                  <span>{split.method}</span>
                  <span>
                    {money(split.amount)} · {split.status}
                  </span>
                </p>
              ))}
            </div>

            <div className="mt-5 space-y-2">
              <button
                onClick={() => window.print()}
                className="w-full cursor-pointer rounded border border-slate-700 p-2 text-xs"
              >
                Print Receipt
              </button>
              <button
                disabled
                title="Requires email integration"
                className="w-full rounded border border-slate-700 p-2 text-xs text-slate-500"
              >
                Send via Email
              </button>
              <button
                onClick={() =>
                  window.open(
                    waLink(
                      selected.guestPhone,
                      `Payment ${selected.transactionId}\nAmount: ${money(
                        selected.amount,
                      )}\nStatus: ${selected.status}`,
                    ),
                    "_blank",
                  )
                }
                className="w-full cursor-pointer rounded border border-slate-700 p-2 text-xs"
              >
                Send via WhatsApp
              </button>
            </div>
          </Panel>
        ) : (
          <Panel title="Payment Details">
            <p className="text-sm text-slate-500">Select a transaction.</p>
          </Panel>
        )}
      </div>
    </Page>
  );
}
