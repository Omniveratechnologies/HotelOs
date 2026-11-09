import { useState } from "react";
import { useQuery } from "@hotelos/query";
import {
  AlertTriangle,
  BedDouble,
  CalendarDays,
  CheckCircle2,
  Download,
  FileText,
  Moon,
} from "lucide-react";
import {
  Button,
  Header,
  KpiTile,
  KpiTileRow,
  StatusChip,
} from "@hotelos/ui/components";
import { formatDate as dateText } from "@hotelos/utils";
import { billingApi } from "../billingApi.js";
import { ActionDrawer, Field, Panel, money } from "../billingUi.jsx";

export default function NightAuditPage() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [drawer, setDrawer] = useState("");
  const [search, setSearch] = useState("");
  const [actionError, setActionError] = useState("");
  const [reportData, setReportData] = useState(null);
  const [startingAudit, setStartingAudit] = useState(false);

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
    setActionError("");
    setStartingAudit(true);
    try {
      await billingApi.startNightAudit({ businessDate: date });
      reload();
    } catch (error) {
      setActionError(error.message || "Night audit could not start");
    } finally {
      setStartingAudit(false);
    }
  };
  const execute = async (step) => {
    setActionError("");
    if (!data.run) return run();
    try {
      await billingApi.executeNightAuditStep(data.run._id, step.stepNo);
      reload();
    } catch (error) {
      setActionError(error.message || "Audit step could not complete");
    }
  };
  const completed = (data.steps || []).filter((step) =>
    ["completed", "confirmed"].includes(step.status),
  ).length;

  const inHouseRows = (data.inHouse || []).filter((row) =>
    `${row.roomId || ""} ${row.guestName || ""} ${row._id || ""}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const exportMorningBriefing = () => {
    const metrics = data.metrics || {};
    const revenueRows = data.revenue || [];
    const alerts = data.alerts || [];

    const lines = [
      ["HOTELOS MORNING MANAGEMENT BRIEFING", ""],
      ["Business Date", date],
      ["Generated At", new Date().toLocaleString("en-IN")],
      ["", ""],
      ["--- OCCUPANCY METRICS ---", ""],
      [
        "Occupied Rooms",
        `${metrics.occupied || 0} / ${metrics.totalRooms || 0}`,
      ],
      ["Occupancy Rate", `${metrics.occupancy || 0}%`],
      ["Arrivals Today", metrics.arrivals || 0],
      ["Departures Today", metrics.departures || 0],
      ["", ""],
      ["--- REVENUE BREAKDOWN ---", ""],
      ...revenueRows.map((r) => [r.label, r.value || 0]),
      ["", ""],
      ["--- AUDIT STATUS & ALERTS ---", ""],
      ["Night Audit Run Status", data.run?.status || "Pending"],
      ...alerts.map((alert, i) => [`Alert ${i + 1}`, alert]),
    ];

    const csvContent = lines
      .map((row) =>
        row
          .map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`)
          .join(","),
      )
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `morning-briefing-${date}.csv`;
    a.click();
  };

  if (query.isLoading)
    return (
      <div className="p-8 text-sm text-gray-500">Loading night audit…</div>
    );
  if (query.isError)
    return (
      <div className="m-6 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
        Night audit data could not be loaded.
      </div>
    );

  return (
    <div>
      <Header
        pageTitle="Night Audit Automation"
        pageDescription="Close the day, post charges, generate reports and roll over to the next business date."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm">
              <CalendarDays size={14} className="text-gray-500" />
              <input
                className="w-28 bg-transparent text-xs outline-none"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </label>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-gray-200 text-gray-700"
              onClick={exportMorningBriefing}
              title="Download Morning Management Summary Report"
            >
              <Download size={14} /> Morning Briefing (CSV)
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="bg-brand-900 hover:bg-brand-950 gap-2 text-white disabled:opacity-50"
              disabled={startingAudit}
              onClick={run}
            >
              <Moon size={14} />{" "}
              {startingAudit
                ? "Starting..."
                : data.run
                  ? "Audit In Progress"
                  : "Start Night Audit"}
            </Button>
          </div>
        }
      />

      <div className="space-y-6 p-6">
        {actionError && (
          <div className="flex items-center justify-between rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            <span>{actionError}</span>
            <button
              className="font-bold underline hover:text-rose-900"
              onClick={() => setActionError("")}
            >
              Dismiss
            </button>
          </div>
        )}

        <KpiTileRow>
          <KpiTile
            title="Occupied Rooms Tonight"
            value={`${data.metrics?.occupied || 0} / ${data.metrics?.totalRooms || 0}`}
            subtitle={`${data.metrics?.occupancy || 0}% occupancy`}
            icon={BedDouble}
          />
          <KpiTile
            title="Arrivals Today"
            value={data.metrics?.arrivals || 0}
            subtitle="Check-ins completed"
          />
          <KpiTile
            title="Departures Today"
            value={data.metrics?.departures || 0}
            subtitle="Check-outs completed"
          />
          <KpiTile
            title="Room Revenue Today"
            value={money(data.metrics?.roomRevenue)}
            subtitle="From occupied rooms"
          />
          <KpiTile
            title="Total Revenue Today"
            value={money(data.metrics?.totalRevenue)}
            subtitle="Room + POS + others"
          />
        </KpiTileRow>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr_320px]">
          <Panel title="Revenue Summary">
            <Bars rows={data.revenue} />
          </Panel>
          <Panel title="Occupancy Overview">
            <Occupancy rows={data.occupancy} total={data.metrics?.totalRooms} />
          </Panel>
          <Panel title={`Night Audit Checklist (${completed}/8)`}>
            <div className="space-y-2">
              {(data.steps || []).map((step) => {
                const isDone =
                  step.status === "completed" || step.status === "confirmed";
                return (
                  <button
                    className="flex w-full items-center gap-2 rounded-lg border border-transparent p-2 text-left text-xs transition-colors hover:border-gray-200 hover:bg-gray-50"
                    key={step.stepNo}
                    onClick={() => execute(step)}
                  >
                    <span
                      className={`grid size-5 place-items-center rounded-full text-[10px] font-bold ${
                        isDone
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {step.stepNo}
                    </span>
                    <span
                      className={`flex-1 ${isDone ? "font-semibold text-gray-900" : "text-gray-600"}`}
                    >
                      {step.name}
                    </span>
                    {isDone ? (
                      <CheckCircle2 size={16} className="text-emerald-600" />
                    ) : (
                      <span className="size-3.5 rounded-sm border border-gray-300" />
                    )}
                  </button>
                );
              })}
            </div>
            <Button
              variant="primary"
              className="bg-brand-900 hover:bg-brand-950 mt-4 w-full text-white disabled:opacity-50"
              disabled={!data.run || completed < 8}
              onClick={() => setDrawer("complete")}
            >
              <CheckCircle2 size={14} className="mr-1.5 inline" /> Complete
              Night Audit
            </Button>
          </Panel>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
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

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <Panel title={`In-House Guest Folios (${inHouseRows.length})`}>
            <div className="mb-4 flex gap-2">
              <input
                className="focus:ring-primary-500 flex-1 rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:ring-1 focus:outline-none"
                placeholder="Search guest name, booking or room..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-gray-200 text-gray-700"
                onClick={() => {
                  if (!inHouseRows.length) return;
                  const headers = [
                    "Room",
                    "Guest",
                    "Booking ID",
                    "Arrival",
                    "Departure",
                    "Status",
                  ];
                  const csv = [
                    headers.join(","),
                    ...inHouseRows.map((r) =>
                      [
                        `"${r.roomId || ""}"`,
                        `"${r.guestName || "Guest"}"`,
                        `"${r._id || ""}"`,
                        `"${dateText(r.checkIn)}"`,
                        `"${dateText(r.checkOut)}"`,
                        `"${r.status || ""}"`,
                      ].join(","),
                    ),
                  ].join("\n");
                  const blob = new Blob([csv], {
                    type: "text/csv;charset=utf-8;",
                  });
                  const a = document.createElement("a");
                  a.href = URL.createObjectURL(blob);
                  a.download = `in-house-guests-${date}.csv`;
                  a.click();
                }}
              >
                <FileText size={14} /> Export
              </Button>
            </div>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full min-w-[700px] text-left text-xs">
                <thead className="border-b border-gray-200 bg-gray-50/75 text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
                  <tr>
                    {[
                      "Room",
                      "Guest",
                      "Booking ID",
                      "Arrival",
                      "Departure",
                      "Status",
                    ].map((label) => (
                      <th className="px-4 py-3" key={label}>
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {inHouseRows.map((row) => (
                    <tr className="hover:bg-primary-50/20" key={row._id}>
                      <td className="text-primary-700 px-4 py-3 font-semibold">
                        {row.roomId || "—"}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {row.guestName || "Guest"}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-gray-500">
                        {row._id}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {dateText(row.checkIn)}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {dateText(row.checkOut)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusChip
                          status={
                            row.status === "checked-in" ? "in-house" : "due-out"
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!inHouseRows.length && (
                <p className="p-8 text-center text-xs text-gray-400">
                  No in-house guests found.
                </p>
              )}
            </div>
          </Panel>

          <div className="space-y-6">
            <Panel title="Important Alerts">
              {(data.alerts || []).map((alert) => (
                <div
                  className="flex gap-2 border-b border-gray-100 py-2.5 text-xs text-gray-700"
                  key={alert}
                >
                  <AlertTriangle
                    size={15}
                    className="mt-0.5 shrink-0 text-amber-500"
                  />
                  <span>{alert}</span>
                </div>
              ))}
              {!data.alerts?.length && (
                <p className="text-xs font-medium text-emerald-600">
                  No blocking alerts.
                </p>
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
                  <Button
                    variant="outline"
                    size="sm"
                    className="justify-start gap-1.5 border-gray-200 text-xs text-gray-700 capitalize"
                    key={type}
                    onClick={async () => {
                      setActionError("");
                      try {
                        const rep = await billingApi.nightAuditReport(type, {
                          date,
                        });
                        setReportData({ type, data: rep });
                      } catch (error) {
                        setActionError(
                          error.message || `Report ${type} unavailable`,
                        );
                      }
                    }}
                  >
                    <FileText size={13} className="text-gray-400" /> {type}
                  </Button>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      </div>

      {reportData && (
        <ActionDrawer
          title={`Audit Report: ${reportData.type}`}
          onClose={() => setReportData(null)}
          onSubmit={(e) => {
            e.preventDefault();
            const dataStr =
              "data:text/json;charset=utf-8," +
              encodeURIComponent(JSON.stringify(reportData.data, null, 2));
            const dl = document.createElement("a");
            dl.setAttribute("href", dataStr);
            dl.setAttribute("download", `${reportData.type}-${date}.json`);
            dl.click();
          }}
          submitLabel="Download JSON"
        >
          <div className="max-h-96 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-3 font-mono text-[11px] text-gray-700">
            <pre>{JSON.stringify(reportData.data, null, 2)}</pre>
          </div>
        </ActionDrawer>
      )}

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

function Bars({ rows = [] }) {
  const max = Math.max(...rows.map((row) => row.value), 1);
  return (
    <div className="flex h-36 items-end gap-3 pt-4">
      {rows.map((row) => (
        <div
          className="flex flex-1 flex-col items-center gap-1.5"
          key={row.label}
        >
          <b className="text-[10px] text-gray-700">{money(row.value)}</b>
          <div
            className="bg-primary-600 w-full rounded-t transition-all"
            style={{ height: `${Math.max((row.value / max) * 90, 6)}px` }}
          />
          <span className="w-full truncate text-center text-[10px] text-gray-500">
            {row.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function Occupancy({ rows = [], total = 0 }) {
  const occupied = rows.find((row) => row.label === "Occupied")?.value || 0;
  const colors = ["#10b981", "#cbd5e1", "#f59e0b", "#ef4444", "#3b82f6"];
  const totalVal =
    rows.reduce((s, r) => s + (Number(r.value) || 0), 0) || total || 1;

  let currentPercent = 0;
  const gradientParts = rows.length
    ? rows
        .map((r, idx) => {
          const pct = ((Number(r.value) || 0) / totalVal) * 100;
          const start = currentPercent;
          currentPercent += pct;
          const color = colors[idx % colors.length];
          return `${color} ${start.toFixed(1)}% ${currentPercent.toFixed(1)}%`;
        })
        .join(", ")
    : "#10b981 0% 100%";

  return (
    <div className="flex items-center gap-6">
      <div
        className="grid size-28 shrink-0 place-items-center rounded-full shadow-inner"
        style={{
          background: `conic-gradient(${gradientParts})`,
        }}
      >
        <div className="text-brand-900 grid size-16 place-items-center rounded-full bg-white text-center text-lg font-bold shadow-sm">
          {total ? Math.round((occupied / total) * 100) : 0}%
        </div>
      </div>
      <div className="flex-1 space-y-2 text-xs">
        {rows.map((row, idx) => (
          <div
            className="flex items-center justify-between gap-4"
            key={row.label}
          >
            <span className="flex items-center gap-1.5 text-gray-600">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: colors[idx % colors.length] }}
              />
              {row.label}
            </span>
            <b className="text-gray-900">{row.value}</b>
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
          <div
            className="flex items-center justify-between border-b border-gray-50 py-1 last:border-0"
            key={row._id}
          >
            <span className="mr-2 truncate font-medium text-gray-800">
              {row.guestName || row._id}
            </span>
            <StatusChip
              status={label === "guest" ? "in-house" : row.status || "pending"}
            />
          </div>
        ))}
        {!rows.length && (
          <p className="py-2 text-center text-xs text-gray-400">
            No records today.
          </p>
        )}
      </div>
    </Panel>
  );
}

function CompleteDrawer({ run, onClose, onComplete }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await billingApi.completeNightAudit(
        run._id,
        reason ? { overrideReason: reason } : {},
      );
      onComplete();
    } catch (err) {
      setError(err.message || "Night audit could not be completed");
    } finally {
      setLoading(false);
    }
  };
  return (
    <ActionDrawer
      title="Complete Night Audit"
      onClose={onClose}
      onSubmit={submit}
      submitLabel={loading ? "Completing..." : "Roll to Next Business Date"}
    >
      {error && (
        <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700">
          {error}
        </div>
      )}
      <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
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
