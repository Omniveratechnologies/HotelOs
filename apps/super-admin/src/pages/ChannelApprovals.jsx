import { useEffect, useState } from "react";
import { useOutletContext, Link } from "react-router-dom";
import { BadgeCheck, Check, Copy, Eye, Info, X } from "lucide-react";
import Topbar from "../components/layout/Topbar.jsx";
import Badge from "../components/ui/Badge.jsx";
import { TableSkeleton, EmptyState } from "../components/ui/States.jsx";
import {
  getChannelApprovals,
  verifyChannelApproval,
} from "../services/hotel.service.js";

const KIND_OPTIONS = ["all", "ROOM", "RATE_PLAN", "ROOM_TYPE", "HOTEL"];
const STATUS_OPTIONS = ["under_review", "completed"];

const KIND_LABELS = {
  ROOM: "Room",
  RATE_PLAN: "Rate plan",
  ROOM_TYPE: "Room type",
  HOTEL: "Hotel",
};

const formatDate = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const userName = (user) => {
  if (!user) return "—";
  return user.name || user.username || "—";
};

// Summarize which fields changed for an edit (before vs after snapshots).
const fieldDiffSummary = (before, after) => {
  if (!before || !after) return null;

  const keys = [
    "roomCode",
    "roomType",
    "rate",
    "occupancy",
    "mealPlan",
    "floor",
    "name",
    "email",
    "phone",
    "address",
    "city",
    "checkInTime",
    "checkOutTime",
    "wifiNetworkName",
    "wifiPassword",
    "aiosellHotelCode",
    "description",
    "count",
    "active",
    "minOccupancy",
    "maxOccupancy",
  ];

  if (!before && after) {
    const afterKeys = Object.keys(after).filter((k) => k !== "desiredCount");
    return afterKeys.length ? `new: ${afterKeys.join(", ")}` : null;
  }

  const diffs = keys.filter(
    (key) =>
      before[key] !== undefined &&
      after[key] !== undefined &&
      String(before[key] ?? "") !== String(after[key] ?? ""),
  );

  return diffs.length ? diffs.join(", ") : null;
};

const renderChange = (approval) => {
  if (approval.kind === "HOTEL") {
    const beforeName = approval.before?.name;
    const afterName = approval.after?.name;

    if (beforeName && afterName && beforeName !== afterName) {
      return (
        <>
          <span className="text-ink-muted">{beforeName}</span>
          <span className="text-ink-muted mx-1">→</span>
          <span className="font-semibold">{afterName}</span>
        </>
      );
    }

    return (
      <span className="text-ink-body font-semibold">
        {afterName || approval.code}
      </span>
    );
  }

  if (approval.kind === "ROOM_TYPE") {
    const before = approval.before || {};
    const after = approval.after || {};
    const diffSummary = fieldDiffSummary(approval.before, approval.after);
    const countChanged =
      before.count !== undefined &&
      after.count !== undefined &&
      String(before.count) !== String(after.count);

    return (
      <>
        <span className="text-ink-body font-semibold">
          {after.name || approval.code}
        </span>
        <span className="text-ink-muted"> · {approval.code}</span>
        {countChanged && (
          <p className="text-ink-muted mt-0.5 text-[11px]">
            count {before.count} → {after.count}
          </p>
        )}
        {diffSummary && (
          <p className="text-ink-muted mt-0.5 text-[11px]">
            edited: {diffSummary}
          </p>
        )}
      </>
    );
  }

  if (approval.kind === "ROOM" && approval.roomNumber) {
    const typeLabel = approval.after?.roomType || approval.code;
    const desired = Number(approval.desiredCount) || 0;

    if (approval.action === "delete" && !approval.after) {
      return (
        <>
          <span className="text-ink-body font-semibold">
            Room {approval.roomNumber}
          </span>
          <span className="text-ink-muted"> · {typeLabel} · removed</span>
          <p className="text-ink-muted mt-0.5 text-[11px]">
            Remove this room from Aiosell to finish the delete
          </p>
        </>
      );
    }

    return (
      <>
        <span className="text-ink-body font-semibold">
          Room {approval.roomNumber}
        </span>
        <span className="text-ink-muted"> · {typeLabel}</span>
        {desired > 0 && (
          <p className="text-ink-muted mt-0.5 text-[11px]">
            needs {desired} {typeLabel} room{desired === 1 ? "" : "s"} in
            Aiosell
          </p>
        )}
      </>
    );
  }

  const diffSummary = fieldDiffSummary(approval.before, approval.after);

  return (
    <>
      <span className="text-ink-body font-mono text-xs font-semibold">
        {approval.code}
      </span>
      {diffSummary && (
        <p className="text-ink-muted mt-0.5 text-[11px]">
          edited: {diffSummary}
        </p>
      )}
    </>
  );
};

// One-line snippet the super admin copies + pastes into Aiosell for this kind.
const requiredSnippet = (approval) => {
  const codes = Array.isArray(approval.rooms) ? approval.rooms : [];

  if (approval.kind === "ROOM" && approval.roomNumber) {
    const typeLabel = approval.after?.roomType || approval.code;

    if (approval.action === "delete" || !approval.after) {
      return `Remove room ${approval.roomNumber} (${typeLabel}) from the property in Aiosell.`;
    }

    const count = Number(approval.desiredCount) || 1;
    const codeList = codes.join(", ") || approval.roomCode || approval.code;

    return `Add ${count} ${typeLabel} room${count === 1 ? "" : "s"} in Aiosell — codes: ${codeList}`;
  }

  if (approval.kind === "ROOM_TYPE") {
    const typeName = approval.after?.name || approval.code;
    const count = Number(approval.count) || 0;
    const planCount = Number(approval.ratePlans) || 0;
    const codeList =
      codes.length > 0
        ? codes.join(", ")
        : Array.isArray(approval.linkedRooms) && approval.linkedRooms.length
          ? approval.linkedRooms.join(", ")
          : "—";

    return `Add ${count} ${typeName} room${count === 1 ? "" : "s"} in Aiosell — codes: ${codeList}${planCount ? ` · then add ${planCount} rate plan${planCount === 1 ? "" : "s"}` : ""}`;
  }

  if (approval.kind === "RATE_PLAN") {
    const planCode = approval.ratePlanCode || approval.code;
    const type = approval.after?.roomType || approval.roomType || "";

    return `Add/update rate plan ${planCode} in Aiosell${type ? ` (${type})` : ""}.`;
  }

  if (approval.kind === "HOTEL") {
    const name = approval.after?.name || approval.code;

    return `Name: ${name}${approval.hotelCode ? ` · Code: ${approval.hotelCode}` : ""}`;
  }

  return approval.code || "";
};

function ApprovalDetailModal({
  approval,
  onClose,
  onVerify,
  onVerifySuccess,
  onTabSwitch,
}) {
  const [copied, setCopied] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied("full");
      setTimeout(() => setCopied(""), 1500);
    } catch (err) {
      console.error("Copy failed:", err);

      window.prompt("Copy this:", text);
      setCopied("");
    }
  };

  const handleVerifyClick = async () => {
    setIsVerifying(true);
    setVerifyResult(null);
    try {
      const result = await onVerify(approval.id);
      const success = result?.success === true;
      if (success) {
        setVerifyResult({ ok: true, message: "Verified successfully" });
        // Optimistic update + auto-close + tab switch
        setTimeout(() => {
          onVerifySuccess?.();
          onTabSwitch?.("completed");
          onClose();
        }, 800);
      } else {
        setVerifyResult({
          ok: false,
          message:
            result?.message ||
            "Not found in Aiosell — add it manually, then retry.",
        });
      }
    } catch (err) {
      setVerifyResult({
        ok: false,
        message: err.message || "Verification failed",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClose = () => {
    if (verifyResult?.ok) {
      onVerifySuccess?.();
    }
    onClose();
  };

  const copyField = async (fieldKey, value) => {
    if (!value && value !== 0) return;
    try {
      await navigator.clipboard.writeText(String(value));
      setCopied(fieldKey);
      setTimeout(() => setCopied(""), 1500);
    } catch (err) {
      console.error("Field copy failed:", err);
    }
  };

  const comparison =
    verifyResult?.comparison || approval.verifyComparison || null;
  const updates = approval.updates || approval.after || {};

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      onClick={onClose}
    >
      <div
        className="bg-canvas flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-ink-950 flex items-start justify-between gap-3 px-6 py-5">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-ink-muted text-xs font-semibold tracking-wider uppercase">
                {KIND_LABELS[approval.kind] || approval.kind}
              </span>
              <Badge status={approval.status} />
              {approval.action && (
                <span className="text-ink-muted rounded-md bg-white/10 px-2 py-0.5 font-mono text-[10px] uppercase">
                  {approval.action}
                </span>
              )}
            </div>
            <h2 className="text-ink-body mt-1 text-lg font-semibold">
              {approval.hotelName || "Hotel"} · {approval.code}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-ink-muted hover:text-ink-body rounded-lg p-1.5 transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {/* Expected vs Current in Aiosell (Comparison Card) */}
          {comparison && (
            <section className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-amber-900 uppercase">
                  <span>Aiosell Live Comparison</span>
                </h3>
                {comparison.mismatches?.length > 0 && (
                  <span className="rounded-full bg-amber-200 px-2.5 py-0.5 text-[11px] font-semibold text-amber-900">
                    {comparison.mismatches.length} mismatch
                    {comparison.mismatches.length === 1 ? "" : "es"}
                  </span>
                )}
              </div>

              {comparison.mismatches?.length > 0 && (
                <ul className="mt-2.5 space-y-1 rounded-lg border border-amber-200 bg-white/70 p-3 text-xs text-amber-950">
                  {comparison.mismatches.map((m) => (
                    <li key={m} className="flex items-start gap-1.5">
                      <span className="font-bold text-rose-500">•</span>
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg border border-gray-200 bg-white p-3">
                  <div className="text-[10px] font-semibold tracking-wider text-gray-500 uppercase">
                    Expected in Aiosell
                  </div>
                  <pre className="mt-1.5 overflow-x-auto font-mono text-[11px] whitespace-pre-wrap text-gray-800">
                    {JSON.stringify(comparison.expected, null, 2)}
                  </pre>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-3">
                  <div className="text-[10px] font-semibold tracking-wider text-gray-500 uppercase">
                    Current in Aiosell
                  </div>
                  <pre className="mt-1.5 overflow-x-auto font-mono text-[11px] whitespace-pre-wrap text-gray-800">
                    {JSON.stringify(comparison.current, null, 2)}
                  </pre>
                </div>
              </div>

              <p className="mt-2.5 text-[11px] text-amber-800">
                Update the values in your Aiosell dashboard according to the
                Expected values above, then click <strong>Verify</strong> below.
              </p>
            </section>
          )}

          {/* Change summary */}
          <section>
            <h3 className="text-ink-muted mb-2 text-xs font-semibold tracking-wider uppercase">
              Change Request
            </h3>
            <div className="border-line bg-ink-950/2.5 rounded-xl border px-4 py-3.5 text-sm">
              {renderChange(approval)}
            </div>
          </section>

          {/* Copyable Necessary Fields */}
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-ink-muted text-xs font-semibold tracking-wider uppercase">
                Copyable Fields for Aiosell Dashboard
              </h3>
              <span className="text-ink-muted text-[11px]">
                Click icon to copy
              </span>
            </div>

            <div className="border-line divide-line text-ink-body divide-y rounded-xl border bg-white text-sm">
              {/* Code */}
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-ink-muted text-xs font-medium">
                  Identifier Code
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-brand-900 font-mono text-xs font-semibold">
                    {approval.code}
                  </span>
                  <button
                    onClick={() => copyField("code", approval.code)}
                    className="rounded p-1 text-gray-500 transition hover:bg-gray-100"
                    title="Copy code"
                  >
                    {copied === "code" ? (
                      <Check size={14} className="text-green-600" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                </div>
              </div>

              {/* Kind-specific fields */}
              {approval.kind === "ROOM" && (
                <>
                  {approval.roomNumber && (
                    <div className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-ink-muted text-xs font-medium">
                        Room Number
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs">
                          {approval.roomNumber}
                        </span>
                        <button
                          onClick={() =>
                            copyField("roomNumber", approval.roomNumber)
                          }
                          className="rounded p-1 text-gray-500 transition hover:bg-gray-100"
                          title="Copy room number"
                        >
                          {copied === "roomNumber" ? (
                            <Check size={14} className="text-green-600" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                  {updates.roomType && (
                    <div className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-ink-muted text-xs font-medium">
                        Room Type Name
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">
                          {updates.roomType}
                        </span>
                        <button
                          onClick={() =>
                            copyField("roomType", updates.roomType)
                          }
                          className="rounded p-1 text-gray-500 transition hover:bg-gray-100"
                          title="Copy room type"
                        >
                          {copied === "roomType" ? (
                            <Check size={14} className="text-green-600" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                  {approval.desiredCount != null && (
                    <div className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-ink-muted text-xs font-medium">
                        Required Room Count
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold">
                          {approval.desiredCount}
                        </span>
                        <button
                          onClick={() =>
                            copyField("desiredCount", approval.desiredCount)
                          }
                          className="rounded p-1 text-gray-500 transition hover:bg-gray-100"
                          title="Copy count"
                        >
                          {copied === "desiredCount" ? (
                            <Check size={14} className="text-green-600" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {approval.kind === "ROOM_TYPE" && (
                <>
                  {(updates.name || approval.name) && (
                    <div className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-ink-muted text-xs font-medium">
                        Room Type Name
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold">
                          {updates.name || approval.name}
                        </span>
                        <button
                          onClick={() =>
                            copyField("rt_name", updates.name || approval.name)
                          }
                          className="rounded p-1 text-gray-500 transition hover:bg-gray-100"
                          title="Copy room type name"
                        >
                          {copied === "rt_name" ? (
                            <Check size={14} className="text-green-600" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                  {(updates.count != null || approval.count != null) && (
                    <div className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-ink-muted text-xs font-medium">
                        Total Rooms Count
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold">
                          {updates.count ?? approval.count}
                        </span>
                        <button
                          onClick={() =>
                            copyField(
                              "rt_count",
                              updates.count ?? approval.count,
                            )
                          }
                          className="rounded p-1 text-gray-500 transition hover:bg-gray-100"
                          title="Copy room count"
                        >
                          {copied === "rt_count" ? (
                            <Check size={14} className="text-green-600" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {approval.kind === "RATE_PLAN" && (
                <>
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-ink-muted text-xs font-medium">
                      Rate Plan Code
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold">
                        {approval.ratePlanCode || approval.code}
                      </span>
                      <button
                        onClick={() =>
                          copyField(
                            "rp_code",
                            approval.ratePlanCode || approval.code,
                          )
                        }
                        className="rounded p-1 text-gray-500 transition hover:bg-gray-100"
                        title="Copy rate plan code"
                      >
                        {copied === "rp_code" ? (
                          <Check size={14} className="text-green-600" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    </div>
                  </div>
                  {(updates.rate != null || approval.rate != null) && (
                    <div className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-ink-muted text-xs font-medium">
                        Base Nightly Rate
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold">
                          ₹{updates.rate ?? approval.rate}
                        </span>
                        <button
                          onClick={() =>
                            copyField("rp_rate", updates.rate ?? approval.rate)
                          }
                          className="rounded p-1 text-gray-500 transition hover:bg-gray-100"
                          title="Copy rate"
                        >
                          {copied === "rp_rate" ? (
                            <Check size={14} className="text-green-600" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                  {updates.occupancy && (
                    <div className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-ink-muted text-xs font-medium">
                        Occupancy
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs uppercase">
                          {updates.occupancy}
                        </span>
                        <button
                          onClick={() => copyField("rp_occ", updates.occupancy)}
                          className="rounded p-1 text-gray-500 transition hover:bg-gray-100"
                          title="Copy occupancy"
                        >
                          {copied === "rp_occ" ? (
                            <Check size={14} className="text-green-600" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                  {updates.mealPlan && (
                    <div className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-ink-muted text-xs font-medium">
                        Meal Plan
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs uppercase">
                          {updates.mealPlan}
                        </span>
                        <button
                          onClick={() => copyField("rp_meal", updates.mealPlan)}
                          className="rounded p-1 text-gray-500 transition hover:bg-gray-100"
                          title="Copy meal plan"
                        >
                          {copied === "rp_meal" ? (
                            <Check size={14} className="text-green-600" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Requested by & Date */}
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-ink-muted text-xs">Requested by</span>
                <span className="text-xs font-medium">
                  {userName(approval.requestedBy)}
                </span>
              </div>
            </div>
          </section>

          {/* Required Action Snippet in Aiosell */}
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-ink-muted text-xs font-semibold tracking-wider uppercase">
                Aiosell Action Instruction
              </h3>
              <button
                onClick={() => copyText(requiredSnippet(approval))}
                className="bg-primary-600 hover:bg-primary-500 text-ink-invert inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors"
              >
                {copied === "full" ? (
                  <>
                    <Check size={14} strokeWidth={2.5} /> Copied
                  </>
                ) : (
                  <>
                    <Copy size={14} /> Copy All
                  </>
                )}
              </button>
            </div>
            <pre className="border-line text-ink-body overflow-x-auto rounded-xl border bg-black/3 p-3.5 font-mono text-xs leading-relaxed whitespace-pre-wrap">
              {requiredSnippet(approval)}
            </pre>
          </section>
        </div>

        {/* Footer with Verify Action */}
        <div className="border-line flex items-center justify-between border-t bg-gray-50/50 px-6 py-4">
          <div className="text-ink-muted text-xs">
            {approval.verifyAttempts > 0 && (
              <span>
                Verified {approval.verifyAttempts} time
                {approval.verifyAttempts === 1 ? "" : "s"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {verifyResult?.ok ? (
              <button
                onClick={handleClose}
                className="bg-signal-600 hover:bg-signal-500 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors"
              >
                <BadgeCheck size={16} strokeWidth={2.25} />
                Done
              </button>
            ) : (
              <>
                <button
                  onClick={handleClose}
                  className="border-line text-ink-body hover:bg-ink-950/5 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleVerifyClick}
                  disabled={isVerifying}
                  className="bg-signal-600 hover:bg-signal-500 inline-flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors disabled:opacity-50"
                >
                  <BadgeCheck size={16} strokeWidth={2.25} />
                  {isVerifying ? "Checking Aiosell…" : "Verify & Auto-Sync"}
                </button>
              </>
            )}
          </div>
        </div>
        {verifyResult && (
          <div
            className={`px-6 pb-3 text-xs font-medium ${verifyResult.ok ? "text-green-700" : "text-amber-800"}`}
          >
            {verifyResult.message}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChannelApprovals() {
  const { onMenuClick } = useOutletContext();
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [kind, setKind] = useState("all");
  const [status, setStatus] = useState("under_review");
  const [viewing, setViewing] = useState(null);
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

  const handleVerify = async (id, { skipRefresh = false } = {}) => {
    setToast(null);
    try {
      const result = await verifyChannelApproval(id);
      const success = !!result.success;
      setToast({
        ok: success,
        message:
          result.message ||
          (success ? "Request verified" : "Verification failed"),
      });
      // Optimistically update local state ONLY on actual success
      if (success) {
        setApprovals((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: "completed" } : a)),
        );
      }
      if (!skipRefresh) await refresh();
      return result;
    } catch (err) {
      console.error("Verification failed:", err);
      setToast({
        ok: false,
        message: err.message || "Failed to verify request",
      });
      throw err;
    }
  };

  const pendingCount = approvals.filter(
    (a) => a.status === "under_review",
  ).length;

  return (
    <>
      <Topbar
        title="Channel Requests"
        subtitle={`${pendingCount} change request${
          pendingCount === 1 ? "" : "s"
        } awaiting verification`}
        onMenuClick={onMenuClick}
      />

      <main className="flex-1 px-5 pb-10 lg:px-8">
        {/* How requests work */}
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-100/40 px-4 py-3">
          <Info size={16} className="mt-0.5 shrink-0 text-amber-500" />
          <p className="text-ink-muted text-sm">
            Room, rate-plan, room-type and hotel-detail changes made by the
            hotel staff queue here for review. Make the add/edit manually in the
            Aiosell dashboard, then click{" "}
            <span className="font-semibold">Verify</span> — we fetch the
            property and auto-complete the request when the change is found.{" "}
            <Link
              to="/channel-manager"
              className="text-signal-600 font-semibold hover:underline"
            >
              Open Channel Manager
            </Link>{" "}
            to sync a hotel property from Aiosell.
          </p>
        </div>

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
                {k === "all"
                  ? "All"
                  : k === "ROOM"
                    ? "Rooms"
                    : k === "RATE_PLAN"
                      ? "Rate Plans"
                      : k === "ROOM_TYPE"
                        ? "Room Types"
                        : "Hotel"}
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
          <TableSkeleton rows={4} cols={6} />
        ) : error ? (
          <div className="mb-4 rounded-xl border border-rose-100 bg-rose-100 px-4 py-3 text-sm text-rose-500">
            {error}
          </div>
        ) : approvals.length === 0 ? (
          <EmptyState
            icon={BadgeCheck}
            title={
              status === "under_review"
                ? "No pending requests"
                : "Nothing completed yet"
            }
            description="Room, rate-plan, room-type and hotel changes created by hotel staff will queue here once under review, and show as completed after verification."
          />
        ) : (
          <div className="border-line overflow-hidden rounded-2xl border bg-white">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-line text-ink-muted border-b text-xs font-semibold tracking-wide uppercase">
                  <th className="px-5 py-3.5 font-semibold">Hotel</th>
                  <th className="px-5 py-3.5 font-semibold">Type</th>
                  <th className="px-5 py-3.5 font-semibold">Change</th>
                  <th className="px-5 py-3.5 font-semibold">Requested by</th>
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
                        {KIND_LABELS[approval.kind] || approval.kind}
                      </span>
                    </td>
                    <td className="px-5 py-4">{renderChange(approval)}</td>
                    <td className="text-ink-muted px-5 py-4 text-xs">
                      {approval.requestedBy
                        ? userName(approval.requestedBy)
                        : "Unknown"}
                    </td>
                    <td className="text-ink-muted px-5 py-4 text-xs">
                      {approval.status === "completed" ? (
                        <span className="font-medium text-green-600">
                          Verified
                        </span>
                      ) : approval.kind === "ROOM" ? (
                        `${approval.rooms} room${approval.rooms === 1 ? "" : "s"}`
                      ) : approval.kind === "RATE_PLAN" ? (
                        `${approval.ratePlans} plan${approval.ratePlans === 1 ? "" : "s"}`
                      ) : approval.kind === "ROOM_TYPE" ? (
                        `${approval.rooms} room${approval.rooms === 1 ? "" : "s"} · ${approval.ratePlans} plan${approval.ratePlans === 1 ? "" : "s"}`
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {approval.status === "completed" &&
                      approval.approvedBy ? (
                        <div className="flex flex-col gap-0.5">
                          <Badge status={approval.status} />
                          <p className="text-[10px] font-medium text-green-600">
                            Verified by{" "}
                            {approval.approvedBy.name ||
                              approval.approvedBy.username}
                          </p>
                        </div>
                      ) : (
                        <Badge status={approval.status} />
                      )}
                    </td>
                    <td className="text-ink-muted px-5 py-4 text-xs">
                      {formatDate(approval.createdAt)}
                      {approval.status === "completed" &&
                        approval.approvedBy && (
                          <p className="mt-0.5 text-[10px]">
                            Verified · {formatDate(approval.approvedAt)}
                          </p>
                        )}
                      {approval.lastVerifyResult === "NOT_FOUND" && (
                        <p className="mt-0.5 font-medium text-amber-600">
                          not found yet ({approval.verifyAttempts} attempt
                          {approval.verifyAttempts === 1 ? "" : "s"})
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {approval.status === "under_review" ? (
                        <button
                          onClick={() => setViewing(approval)}
                          className="bg-signal-600 hover:bg-signal-500 text-ink-invert inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors"
                        >
                          <Eye size={14} strokeWidth={2.25} />
                          View
                        </button>
                      ) : approval.status === "completed" ? (
                        <span className="text-xs font-medium text-green-600">
                          Verified
                        </span>
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
      {viewing && (
        <ApprovalDetailModal
          approval={viewing}
          onClose={() => setViewing(null)}
          onVerify={(id) => handleVerify(id, { skipRefresh: true })}
          onVerifySuccess={refresh}
          onTabSwitch={setStatus}
        />
      )}
    </>
  );
}
