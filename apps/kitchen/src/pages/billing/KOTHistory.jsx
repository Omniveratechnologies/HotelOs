import { useState } from "react";
import { getKots, updateKotStatus } from "../../services/billing.js";
import {
  Page,
  Card,
  Panel,
  Table,
  Notice,
  dateText,
  idOf,
  statusClass,
  useLoad,
} from "./billingUi.jsx";

export default function KOTHistory() {
  const { data, setData, error, setError } = useLoad(getKots);
  const [selected, setSelected] = useState(null);

  const durations = data.flatMap((kot) => {
    const events = kot.timeline || [];
    return events.length > 1
      ? [new Date(events.at(-1).timestamp) - new Date(events[0].timestamp)]
      : [];
  });

  const average = durations.length
    ? `${Math.round(
        durations.reduce((a, b) => a + b, 0) / durations.length / 60000,
      )} min`
    : "—";

  const update = async (status) => {
    try {
      const saved = await updateKotStatus(idOf(selected), status);
      setData((current) =>
        current.map((row) => (idOf(row) === idOf(saved) ? saved : row)),
      );
      setSelected(saved);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <Page title="KOT History">
      <Notice text={error} onClose={() => setError("")} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Card title="Total KOTs" value={data.length} />
        <Card
          title="Completed"
          value={data.filter((row) => row.status === "served").length}
        />
        <Card
          title="Pending"
          value={
            data.filter((row) => ["preparing", "ready"].includes(row.status))
              .length
          }
        />
        <Card
          title="Cancelled"
          value={data.filter((row) => row.status === "cancelled").length}
        />
        <Card title="Avg prep time" value={average} />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1fr_350px]">
        <Table
          rows={data}
          onRow={setSelected}
          columns={[
            { key: "kotNo", label: "KOT No." },
            {
              key: "orderNo",
              label: "Order No.",
              render: (row) => row.orderNo || "—",
            },
            { key: "locationLabel", label: "Table / Room" },
            { key: "station", label: "Station" },
            {
              key: "createdAt",
              label: "Time",
              render: (row) => dateText(row.createdAt),
            },
            {
              key: "status",
              label: "Status",
              render: (row) => (
                <span className={statusClass(row.status)}>{row.status}</span>
              ),
            },
            {
              key: "items",
              label: "Items",
              render: (row) => row.items?.length || 0,
            },
          ]}
        />
        {selected ? (
          <Panel title={`KOT ${selected.kotNo}`}>
            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 rounded border border-slate-700 p-2 text-xs"
              >
                Print KOT
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 rounded border border-slate-700 p-2 text-xs"
              >
                Reprint
              </button>
            </div>
            <div className="mt-4 space-y-2 text-xs">
              {selected.items?.map((item, index) => (
                <p className="flex justify-between" key={index}>
                  <span>
                    {item.name} × {item.quantity}
                  </span>
                  <span>{item.status}</span>
                </p>
              ))}
            </div>
            <h3 className="mt-5 border-t border-slate-800 pt-4 font-semibold">
              Timeline
            </h3>
            <div className="space-y-2 pt-2 text-xs">
              {(selected.timeline || []).map((event, index) => (
                <p key={index}>
                  <span className="text-emerald-400">●</span> {event.event}{" "}
                  <small className="text-slate-500">
                    {dateText(event.timestamp)}
                  </small>
                </p>
              ))}
            </div>
            <p className="mt-5 border-t border-slate-800 pt-4 text-xs">
              Time analysis: {average}
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {["preparing", "ready", "served"].map((status) => (
                <button
                  key={status}
                  onClick={() => update(status)}
                  className="rounded border border-slate-700 p-2 text-[11px] capitalize"
                >
                  {status}
                </button>
              ))}
            </div>
            {selected.orderId && (
              <a
                className="mt-3 block text-xs text-emerald-400"
                href={`/orders/${selected.orderId}`}
              >
                View Order
              </a>
            )}
          </Panel>
        ) : (
          <Panel title="KOT Details">
            <p className="text-sm text-slate-500">Select a KOT.</p>
          </Panel>
        )}
      </div>
    </Page>
  );
}
