import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { BadgeCheck } from "lucide-react";
import Topbar from "../components/layout/Topbar.jsx";
import Badge from "../components/ui/Badge.jsx";
import { TableSkeleton, EmptyState } from "../components/ui/States.jsx";
import {
  getChannelApprovals,
  approveChannelCode,
} from "../services/hotel.service.js";

const KIND_OPTIONS = ["all", "ROOM", "RATE_PLAN"];
const STATUS_OPTIONS = ["under_review", "completed"];

const formatDate = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

export default function ChannelApprovals() {
  const { onMenuClick } = useOutletContext();
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [kind, setKind] = useState("all");
  const [status, setStatus] = useState("under_review");
  const [approvingId, setApprovingId] = useState(null);
  const [toast, setToast] = useState(null);

  const refresh = async (kindValue = kind, statusValue = status) => {
    try {
      const data = await getChannelApprovals({
        kind: kindValue === "all" ? undefined : kindValue,
        status: statusValue,
      });
      setApprovals(data);
      setError("");
    } catch (err) {
      console.error("Failed to load channel approvals:", err);
      setError(err.message || "Failed to load channel approvals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleKindChange = (value) => {
    setKind(value);
    refresh(value, status);
  };

  const handleStatusChange = (value) => {
    setStatus(value);
    refresh(kind, value);
  };

  const handleApprove = async (id) => {
    setApprovingId(id);
    setToast(null);
    try {
      const result = await approveChannelCode(id);
      setToast({
        ok: result.success,
        message: result.message || "Code approved",
      });
      await refresh();
    } catch (err) {
      console.error("Approval failed:", err);
      setToast({
        ok: false,
        message: err.message || "Failed to approve code",
      });
    } finally {
      setApprovingId(null);
    }
  };

  const pendingCount = approvals.filter(
    (a) => a.status === "under_review",
  ).length;

  return (
    <>
      <Topbar
        title="Channel Approvals"
        subtitle={`${pendingCount} code${
          pendingCount === 1 ? "" : "s"
        } awaiting Aiosell approval`}
        onMenuClick={onMenuClick}
      />

      <main className="flex-1 px-5 pb-10 lg:px-8">
        {toast && (
          <div
            className={`mb-5 rounded-xl px-4 py-3 text-sm ${
              toast.ok
                ? "bg-signal-100 text-signal-600"
                : "bg-rose-100 text-rose-500"
            }`}
          >
            {toast.message}
          </div>
        )}

        {/* Filters */}
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <div className="bg-ink-950/5 flex gap-1 rounded-xl p-1">
            {KIND_OPTIONS.map((k) => (
              <button
                key={k}
                onClick={() => handleKindChange(k)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  kind === k
                    ? "text-ink-900 bg-white shadow-xs"
                    : "text-ink-muted hover:text-ink-700"
                }`}
              >
                {k === "all" ? "All" : k === "ROOM" ? "Rooms" : "Rate Plans"}
              </button>
            ))}
          </div>
          <div className="bg-ink-950/5 flex gap-1 rounded-xl p-1">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  status === s
                    ? "text-ink-900 bg-white shadow-xs"
                    : "text-ink-muted hover:text-ink-700"
                }`}
              >
                {s === "under_review" ? "Under review" : "Completed"}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={4} cols={5} />
        ) : error ? (
          <div className="mb-4 rounded-xl border border-rose-100 bg-rose-100 px-4 py-3 text-sm text-rose-500">
            {error}
          </div>
        ) : approvals.length === 0 ? (
          <EmptyState
            icon={BadgeCheck}
            title="No approvals here"
            description="Room and rate-plan codes created with Aiosell will queue here until a super admin approves them."
          />
        ) : (
          <div className="border-line overflow-hidden rounded-2xl border bg-white">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-line text-ink-muted border-b text-xs font-semibold tracking-wide uppercase">
                  <th className="px-5 py-3.5 font-semibold">Hotel</th>
                  <th className="px-5 py-3.5 font-semibold">Type</th>
                  <th className="px-5 py-3.5 font-semibold">Code</th>
                  <th className="px-5 py-3.5 font-semibold">Linked</th>
                  <th className="px-5 py-3.5 font-semibold">Status</th>
                  <th className="px-5 py-3.5 font-semibold">Created</th>
                  <th className="px-5 py-3.5 text-right font-semibold">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-line divide-y">
                {approvals.map((approval) => (
                  <tr key={approval.id} className="hover:bg-canvas/60">
                    <td className="px-5 py-4">
                      <p className="text-ink-body font-semibold">
                        {approval.hotelName || "—"}
                      </p>
                      {approval.hotelCode && (
                        <p className="text-ink-muted font-mono text-xs">
                          {approval.hotelCode}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-ink-body text-xs font-semibold">
                        {approval.kind === "ROOM" ? "Room" : "Rate plan"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-ink-body font-mono text-xs font-semibold">
                        {approval.code}
                      </span>
                    </td>
                    <td className="text-ink-muted px-5 py-4 text-xs">
                      {approval.kind === "ROOM"
                        ? `${approval.rooms} room${
                            approval.rooms === 1 ? "" : "s"
                          }`
                        : `${approval.ratePlans} plan${
                            approval.ratePlans === 1 ? "" : "s"
                          }`}
                    </td>
                    <td className="px-5 py-4">
                      <Badge status={approval.status} />
                    </td>
                    <td className="text-ink-muted px-5 py-4 text-xs">
                      {formatDate(approval.createdAt)}
                      {approval.status === "completed" &&
                        approval.approvedBy && (
                          <p className="mt-0.5">
                            by{" "}
                            {approval.approvedBy.name ||
                              approval.approvedBy.username}{" "}
                            · {formatDate(approval.approvedAt)}
                          </p>
                        )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {approval.status === "under_review" ? (
                        <button
                          onClick={() => handleApprove(approval.id)}
                          disabled={approvingId !== null}
                          className="bg-signal-600 hover:bg-signal-500 inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold text-white transition-colors disabled:opacity-50"
                        >
                          <BadgeCheck size={14} strokeWidth={2.25} />
                          {approvingId === approval.id
                            ? "Syncing..."
                            : "Approve & Sync"}
                        </button>
                      ) : (
                        <span className="text-ink-muted text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
