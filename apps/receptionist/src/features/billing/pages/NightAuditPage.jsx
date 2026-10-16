import { useState } from "react";
import { useQuery } from "@hotelos/query";
import {
  AlertTriangle,
  BedDouble,
  CalendarDays,
  CheckCircle2,
  FileText,
  Moon,
} from "lucide-react";
import { billingApi } from "../billingApi.js";
import {
  ActionDrawer,
  Field,
  KpiCard,
  Panel,
  StatusPill,
  money,
} from "../billingUi.jsx";

const button =
  "inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-[#102b5c]";

export default function NightAuditPage() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [drawer, setDrawer] = useState("");
  const query = useQuery({
    queryKey: ["billing", "night-audit", date],
    queryFn: () => billingApi.nightAuditOverview({ date }),
  });
  const data = query.data || {};
  const reload = () => {
    setDrawer("");
    query.refetch();
  };
  const run = async () => {
    try {
      await billingApi.startNightAudit({ businessDate: date });
      reload();
    } catch (error) {
      window.alert(error.message || "Night audit could not start");
    }
  };
  const execute = async (step) => {
    if (!data.run) return run();
    try {
      await billingApi.executeNightAuditStep(data.run._id, step.stepNo);
      reload();
    } catch (error) {
      window.alert(error.message || "Audit step could not complete");
    }
  };
  const completed = (data.steps || []).filter((step) =>
    ["completed", "confirmed"].includes(step.status),
  ).length;
  if (query.isLoading)
    return (
      <div className="p-8 text-sm text-slate-500">Loading night audit…</div>
    );
  if (query.isError)
    return (
      <div className="m-6 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
        Night audit data could not be loaded.
      </div>
    );
  return (
    <div className="min-h-full bg-[#f4f7fb] p-4 text-[#102b5c] sm:p-6">
      <header className="mb-4 flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
        <div>
          <div className="mb-1 text-[11px] font-semibold text-blue-600">
            Billing &amp; Folio <span className="px-2 text-slate-400">›</span>{" "}
            Night Audit
          </div>
          <h1 className="text-2xl font-bold">Night Audit</h1>
          <p className="text-xs text-slate-500">
            Close the day, post charges, generate reports and roll over to the
            next business date.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className={`${button} cursor-pointer`}>
            <CalendarDays size={14} />
            <input
              className="w-28 bg-transparent outline-none"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </label>
          <button
            className="inline-flex items-center gap-2 rounded-lg bg-[#102b5c] px-4 py-2 text-xs font-bold text-white"
            onClick={run}
          >
            <Moon size={14} />{" "}
            {data.run ? "Audit In Progress" : "Start Night Audit"}
          </button>
        </div>
      </header>
      <div className="mb-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          label="Occupied Rooms Tonight"
          value={`${data.metrics?.occupied || 0} / ${data.metrics?.totalRooms || 0}`}
          detail={`${data.metrics?.occupancy || 0}% occupancy`}
          icon={BedDouble}
        />
        <KpiCard
          label="Arrivals Today"
          value={data.metrics?.arrivals || 0}
          detail="Check-ins completed"
          tone="purple"
        />
        <KpiCard
          label="Departures Today"
          value={data.metrics?.departures || 0}
          detail="Check-outs completed"
          tone="amber"
        />
        <KpiCard
          label="Room Revenue Today"
          value={money(data.metrics?.roomRevenue)}
          detail="From occupied rooms"
          tone="blue"
        />
        <KpiCard
          label="Total Revenue Today"
          value={money(data.metrics?.totalRevenue)}
          detail="Room + POS + others"
          tone="red"
        />
      </div>
      <div className="mb-3 grid gap-3 lg:grid-cols-[1.2fr_1fr_285px]">
        <Panel title="Revenue Summary">
          <Bars rows={data.revenue} />
        </Panel>
        <Panel title="Occupancy Overview">
          <Occupancy rows={data.occupancy} total={data.metrics?.totalRooms} />
        </Panel>
        <Panel title={`Night Audit Checklist (${completed}/8)`}>
          <div className="space-y-2">
            {(data.steps || []).map((step) => (
              <button
                className="flex w-full items-center gap-2 text-left text-xs"
                key={step.stepNo}
                onClick={() => execute(step)}
              >
                <span
                  className={`grid size-5 place-items-center rounded-full text-[10px] ${step.status === "completed" || step.status === "confirmed" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                >
                  {step.stepNo}
                </span>
                <span className="flex-1">{step.name}</span>
                <span
                  className={
                    step.status === "completed" || step.status === "confirmed"
                      ? "text-emerald-600"
                      : "text-slate-300"
                  }
                >
                  □
                </span>
              </button>
            ))}
          </div>
          <button
            className="mt-3 w-full rounded-lg bg-[#102b5c] px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
            disabled={!data.run || completed < 8}
            onClick={() => setDrawer("complete")}
          >
            <CheckCircle2 size={13} className="mr-1 inline" /> Complete Night
            Audit
          </button>
        </Panel>
      </div>
      <div className="mb-3 grid gap-3 lg:grid-cols-3">
        <Summary
          title={`Arrivals (${data.metrics?.arrivals || 0})`}
          rows={data.arrivals}
          label="status"
        />
        <Summary
          title={`Departures (${data.metrics?.departures || 0})`}
          rows={data.departures}
          label="status"
        />
        <Summary
          title={`In-House Guests (${data.inHouse?.length || 0})`}
          rows={data.inHouse}
          label="guest"
        />
      </div>
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_285px]">
        <Panel title={`In-House Guest Folios (${data.inHouse?.length || 0})`}>
          <div className="mb-3 flex gap-2">
            <input
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none"
              placeholder="Search guest name, booking or room..."
            />
            <button className={button}>
              <FileText size={14} /> Export
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-[11px]">
              <thead className="border-b border-slate-100 text-[10px] text-slate-500 uppercase">
                <tr>
                  {[
                    "Room",
                    "Guest",
                    "Booking ID",
                    "Arrival",
                    "Departure",
                    "Status",
                  ].map((label) => (
                    <th className="px-3 py-3" key={label}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data.inHouse || []).map((row) => (
                  <tr className="border-b border-slate-50" key={row._id}>
                    <td className="px-3 py-3">{row.roomId || "—"}</td>
                    <td className="px-3 py-3 font-semibold">
                      {row.guestName || "Guest"}
                    </td>
                    <td className="px-3 py-3">{row._id}</td>
                    <td className="px-3 py-3">{dateText(row.checkIn)}</td>
                    <td className="px-3 py-3">{dateText(row.checkOut)}</td>
                    <td className="px-3 py-3">
                      <StatusPill
                        value={
                          row.status === "checked-in" ? "in-house" : "due-out"
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!data.inHouse?.length && (
              <p className="p-8 text-center text-xs text-slate-400">
                No in-house guests found.
              </p>
            )}
          </div>
        </Panel>
        <div className="space-y-3">
          <Panel title="Important Alerts">
            {(data.alerts || []).map((alert) => (
              <div
                className="flex gap-2 border-b border-slate-50 py-2 text-xs"
                key={alert}
              >
                <AlertTriangle size={14} className="text-amber-500" />
                {alert}
              </div>
            ))}
            {!data.alerts?.length && (
              <p className="text-xs text-emerald-600">No blocking alerts.</p>
            )}
          </Panel>
          <Panel title="Reports After Audit">
            <div className="grid grid-cols-2 gap-2">
              {[
                "night-audit",
                "arrivals",
                "occupancy",
                "manager",
                "revenue",
                "cashier",
              ].map((type) => (
                <button
                  className={button}
                  key={type}
                  onClick={() =>
                    billingApi
                      .nightAuditReport(type, { date })
                      .catch((error) =>
                        window.alert(error.message || "Report unavailable"),
                      )
                  }
                >
                  <FileText size={13} /> {type}
                </button>
              ))}
            </div>
          </Panel>
        </div>
      </div>
      {drawer === "complete" && (
        <CompleteDrawer
          run={data.run}
          onClose={() => setDrawer("")}
          onComplete={reload}
        />
      )}
    </div>
  );
}

function dateText(value) {
  return value
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
      })
    : "—";
}
function Bars({ rows = [] }) {
  const max = Math.max(...rows.map((row) => row.value), 1);
  return (
    <div className="flex h-32 items-end gap-3">
      {rows.map((row) => (
        <div
          className="flex flex-1 flex-col items-center gap-1"
          key={row.label}
        >
          <b className="text-[9px]">{money(row.value)}</b>
          <div
            className="w-full rounded-t bg-blue-500"
            style={{ height: `${Math.max((row.value / max) * 90, 5)}px` }}
          />
          <span className="text-center text-[9px] text-slate-500">
            {row.label}
          </span>
        </div>
      ))}
    </div>
  );
}
function Occupancy({ rows = [], total = 0 }) {
  const occupied = rows.find((row) => row.label === "Occupied")?.value || 0;
  return (
    <div className="flex items-center gap-4">
      <div
        className="grid size-28 place-items-center rounded-full"
        style={{
          background:
            "conic-gradient(#10b981 0 72%, #cbd5e1 72% 90%, #f59e0b 90% 96%, #ef4444 96% 100%)",
        }}
      >
        <div className="grid size-16 place-items-center rounded-full bg-white text-center text-lg font-bold">
          {total ? Math.round((occupied / total) * 100) : 0}%
        </div>
      </div>
      <div className="space-y-2 text-xs">
        {rows.map((row) => (
          <div className="flex justify-between gap-5" key={row.label}>
            <span>{row.label}</span>
            <b>{row.value}</b>
          </div>
        ))}
      </div>
    </div>
  );
}
function Summary({ title, rows = [], label }) {
  return (
    <Panel title={title}>
      <div className="space-y-2 text-xs">
        {rows.slice(0, 4).map((row) => (
          <div className="flex justify-between" key={row._id}>
            <span>{row.guestName || row._id}</span>
            <StatusPill
              value={label === "guest" ? "in-house" : row.status || "pending"}
            />
          </div>
        ))}
      </div>
    </Panel>
  );
}
function CompleteDrawer({ run, onClose, onComplete }) {
  const [reason, setReason] = useState("");
  const submit = async (event) => {
    event.preventDefault();
    try {
      await billingApi.completeNightAudit(
        run._id,
        reason ? { overrideReason: reason } : {},
      );
      onComplete();
    } catch (error) {
      window.alert(error.message || "Night audit could not be completed");
    }
  };
  return (
    <ActionDrawer
      title="Complete Night Audit"
      onClose={onClose}
      onSubmit={submit}
      submitLabel="Roll to Next Business Date"
    >
      <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
        This closes the audit, freezes the day snapshot and rolls the property
        to the next business date.
      </p>
      <Field
        label="Manager override reason (only if required)"
        value={reason}
        onChange={(event) => setReason(event.target.value)}
      />
    </ActionDrawer>
  );
}
