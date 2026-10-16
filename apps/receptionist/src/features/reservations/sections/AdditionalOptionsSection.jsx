import { useState } from "react";
import { Gift, PlusCircle, StickyNote, Trash2, Plus } from "lucide-react";
import { SectionCard, InlineBanner } from "@hotelos/ui/components";
import { cn } from "@hotelos/utils";

const rowClass =
  "flex h-16 items-center gap-3 rounded-xl border border-gray-200 bg-white px-4";

const iconTileClass =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg";

/**
 * @typedef {Object} AddOnLine
 * @property {string} label
 * @property {number} amount
 * @property {number} [quantity]
 */

/**
 * Wizard step 4 — collapsible rows for packages, chargeable add-ons and
 * special requests.
 *
 * @param {Object} props
 * @param {AddOnLine[]} props.addOns
 * @param {(addOns: AddOnLine[]) => void} props.onAddOnsChange
 * @param {string} props.specialRequests
 * @param {(value: string) => void} props.onSpecialRequestsChange
 * @param {boolean} [props.open] @param {string} [props.summary] @param {() => void} [props.onEdit]
 * @returns {React.ReactElement}
 */
export function AdditionalOptionsSection({
  form,
  onChange,
  addOns: directAddOns,
  onAddOnsChange: directOnAddOnsChange,
  specialRequests: directSpecialRequests,
  onSpecialRequestsChange: directOnSpecialRequestsChange,
  open = true,
  summary,
  onEdit,
}) {
  const addOns = form?.addOns ?? directAddOns ?? [];
  const onAddOnsChange =
    directOnAddOnsChange || ((val) => onChange && onChange("addOns", val));
  const specialRequests = form?.specialRequests ?? directSpecialRequests ?? "";
  const onSpecialRequestsChange =
    directOnSpecialRequestsChange ||
    ((val) => onChange && onChange("specialRequests", val));

  const [expanded, setExpanded] = useState(null);
  const [draftLabel, setDraftLabel] = useState("");
  const [draftAmount, setDraftAmount] = useState("");

  const toggle = (key) => setExpanded((cur) => (cur === key ? null : key));

  const addLine = () => {
    const amount = Number(draftAmount);
    if (!draftLabel.trim() || !Number.isFinite(amount) || amount <= 0) return;
    onAddOnsChange([
      ...addOns,
      { label: draftLabel.trim(), amount: Math.round(amount), quantity: 1 },
    ]);
    setDraftLabel("");
    setDraftAmount("");
  };

  const removeLine = (index) =>
    onAddOnsChange(addOns.filter((_, i) => i !== index));

  const chevron = (key) => (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={cn(
        "text-surface-400 h-4 w-4 transition-transform",
        expanded === key && "rotate-180",
      )}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );

  return (
    <SectionCard
      number="4"
      title="Additional Options"
      open={open}
      summary={summary}
      onEdit={onEdit}
    >
      <div className="space-y-3">
        {/* Packages row — informational (packages are sold via rate plans) */}
        <div className={rowClass}>
          <span className={cn(iconTileClass, "bg-primary-50 text-primary-600")}>
            <Gift size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-brand-900 text-sm font-semibold">Packages</p>
            <p className="text-surface-500 text-xs">
              Meal plans and bundles are part of the selected rate plan.
            </p>
          </div>
          {expanded === "packages" ? (
            chevron("packages")
          ) : (
            <button
              type="button"
              onClick={() => toggle("packages")}
              className="text-brand-700 text-xs font-semibold"
            >
              View
            </button>
          )}
        </div>

        {/* Add-ons row with inline editor */}
        <div>
          <div className={rowClass}>
            <span className={cn(iconTileClass, "bg-blue-50 text-blue-600")}>
              <PlusCircle size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-brand-900 text-sm font-semibold">Add-ons</p>
              <p className="text-surface-500 text-xs">
                Extra bed, airport pickup, early check-in…
              </p>
            </div>
            <button
              type="button"
              onClick={() => toggle("addons")}
              className="text-brand-700 inline-flex items-center gap-1 text-xs font-semibold"
            >
              {addOns.length ? `Edit (${addOns.length})` : "Add"}{" "}
              {chevron("addons")}
            </button>
          </div>
          {expanded === "addons" && (
            <div className="border-surface-200 mt-2 space-y-2 rounded-xl border p-3">
              {addOns.length === 0 && (
                <p className="text-surface-500 text-xs">No add-ons yet.</p>
              )}
              {addOns.map((a, i) => (
                // Free-form labels can repeat; order is stable within a session.
                // oxlint-disable-next-line react/no-array-index-key
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="text-brand-900 flex-1 truncate">
                    {a.label}
                  </span>
                  <span className="text-surface-600 font-medium">
                    ₹{a.amount}
                    {a.quantity > 1 ? ` × ${a.quantity}` : ""}
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove ${a.label}`}
                    onClick={() => removeLine(i)}
                    className="rounded p-1 text-rose-500 hover:bg-rose-50"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <div className="flex gap-2 pt-1">
                <input
                  aria-label="Add-on name"
                  placeholder="e.g. Airport pickup"
                  value={draftLabel}
                  onChange={(e) => setDraftLabel(e.target.value)}
                  className="text-brand-900 focus:border-primary-500 focus:ring-primary-500/15 h-9 flex-1 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2"
                />
                <input
                  aria-label="Amount (₹)"
                  type="number"
                  min="1"
                  placeholder="₹"
                  value={draftAmount}
                  onChange={(e) => setDraftAmount(e.target.value)}
                  className="text-brand-900 focus:border-primary-500 focus:ring-primary-500/15 h-9 w-28 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2"
                />
                <button
                  type="button"
                  onClick={addLine}
                  className="border-surface-300 text-brand-900 hover:bg-background-100 inline-flex h-9 items-center gap-1 rounded-lg border bg-white px-3 text-xs font-semibold"
                >
                  <Plus size={14} /> Add
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Special requests row */}
        <div>
          <div className={rowClass}>
            <span className={cn(iconTileClass, "bg-amber-50 text-amber-600")}>
              <StickyNote size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-brand-900 text-sm font-semibold">
                Special Requests
              </p>
              <p className="text-surface-500 text-xs">
                Notes for housekeeping / the kitchen / the front desk.
              </p>
            </div>
            <button
              type="button"
              onClick={() => toggle("requests")}
              className="text-brand-700 text-xs font-semibold"
            >
              {specialRequests ? "Edit" : "Add"} {chevron("requests")}
            </button>
          </div>
          {expanded === "requests" && (
            <div className="border-surface-200 mt-2 rounded-xl border p-3">
              <textarea
                aria-label="Special requests"
                rows={3}
                value={specialRequests}
                onChange={(e) => onSpecialRequestsChange(e.target.value)}
                placeholder="e.g. High floor, early check-in, extra bed…"
                className="text-brand-900 focus:border-primary-500 focus:ring-primary-500/15 w-full resize-none rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none placeholder:text-gray-400 focus:ring-2"
              />
            </div>
          )}
        </div>

        {addOns.length > 0 && expanded !== "addons" && (
          <InlineBanner variant="info">
            {addOns.length} add-on{addOns.length === 1 ? "" : "s"} added — total
            ₹{addOns.reduce((s, a) => s + a.amount * (a.quantity || 1), 0)}.
          </InlineBanner>
        )}
      </div>
    </SectionCard>
  );
}

export default AdditionalOptionsSection;
