import { Search } from "lucide-react";
import { SectionCard, Input } from "@hotelos/ui/components";
import { cn } from "@hotelos/utils";
import { ID_TYPE_OPTIONS, PHONE_PREFIXES } from "./options.js";

const selectClass =
  "text-brand-900 focus:border-primary-500 focus:ring-primary-500/15 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm transition outline-none focus:ring-2";

const labelClass = "text-brand-900 mb-1.5 block text-sm font-semibold";

const initial = (name) => (name || "G").trim().charAt(0).toUpperCase();

const NO_ERRORS = {};
const NO_RESULTS = [];

/**
 * Wizard step 3 — guest identity. Two modes: pick an existing repeat guest
 * (search + auto-fill) or enter a new guest.
 *
 * @param {Object} props
 * @param {'new'|'existing'} props.mode
 * @param {(mode: 'new'|'existing') => void} props.onModeChange
 * @param {{ name: string, phone: string, phonePrefix: string, email: string,
 *   nationality: string, idType: string, idNumber: string }} props.form
 * @param {(field: string, value: string) => void} props.onField
 * @param {Record<string, string>} [props.errors]
 * @param {string} props.searchQuery
 * @param {(q: string) => void} props.onSearchChange
 * @param {{ id: string, name: string, email?: string, phone?: string, repeatGuest?: boolean }[]} props.searchResults
 * @param {(guest: object) => void} props.onSelectGuest
 * @param {boolean} [props.searching]
 * @param {boolean} [props.open] @param {string} [props.summary] @param {() => void} [props.onEdit]
 * @returns {React.ReactElement}
 */
export function GuestSection({
  mode,
  onModeChange,
  form,
  onField,
  errors = NO_ERRORS,
  searchQuery,
  onSearchChange,
  searchResults = NO_RESULTS,
  onSelectGuest,
  searching = false,
  open = true,
  summary,
  onEdit,
}) {
  return (
    <SectionCard
      number="3"
      title="Guest Details"
      open={open}
      summary={summary}
      onEdit={onEdit}
      action={
        <div
          role="tablist"
          aria-label="Guest mode"
          className="bg-background-100 flex rounded-lg p-1"
        >
          {[
            { id: "new", label: "New Guest" },
            { id: "existing", label: "Existing Guest" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={mode === t.id}
              onClick={() => onModeChange(t.id)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                mode === t.id
                  ? "text-brand-900 bg-white shadow-2xs"
                  : "text-surface-500 hover:text-brand-800",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      }
    >
      {mode === "existing" && (
        <div className="mb-4">
          <div className="border-surface-200 flex items-center gap-2 rounded-lg border bg-white px-3">
            <Search size={16} className="text-surface-400 shrink-0" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by name, phone or email…"
              className="text-brand-900 h-10 w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
            />
          </div>
          <div className="mt-3 space-y-2">
            {searching && (
              <p className="text-surface-500 py-2 text-sm">Searching…</p>
            )}
            {!searching && searchResults.length === 0 && (
              <p className="border-surface-200 text-surface-500 rounded-lg border border-dashed px-4 py-3 text-sm">
                {searchQuery.trim().length >= 2
                  ? "No guests found. Switch to New Guest to create one."
                  : "Type a name, phone or email to find returning guests."}
              </p>
            )}
            {searchResults.map((g) => (
              <div
                key={g.id}
                className="border-surface-200 flex items-center gap-3 rounded-lg border bg-white p-3"
              >
                <span className="bg-brand-50 text-brand-700 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
                  {initial(g.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-brand-900 truncate text-sm font-semibold">
                    {g.name}
                    {g.repeatGuest && (
                      <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                        Repeat Guest
                      </span>
                    )}
                  </p>
                  <p className="text-surface-500 truncate text-xs">
                    {g.phone || g.email || "—"}
                    {g.staysCount
                      ? ` · ${g.staysCount} stay${g.staysCount === 1 ? "" : "s"}`
                      : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectGuest(g)}
                  className="border-surface-300 text-brand-900 hover:bg-background-100 shrink-0 rounded-lg border bg-white px-3 py-1.5 text-xs font-semibold"
                >
                  Select
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 sm:col-span-6">
          <Input
            label="Full Name"
            name="guest-name"
            required
            placeholder="e.g. Rohit Sharma"
            value={form.name}
            onChange={(e) => onField("name", e.target.value)}
            error={errors.name}
          />
        </div>

        <div className="col-span-6 sm:col-span-3">
          <label htmlFor="guest-phone" className={labelClass}>
            Phone <span className="text-rose-500">*</span>
          </label>
          <div className="flex">
            <select
              aria-label="Country code"
              value={form.phonePrefix}
              onChange={(e) => onField("phonePrefix", e.target.value)}
              className={cn(selectClass, "w-20 rounded-r-none border-r-0")}
            >
              {PHONE_PREFIXES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <input
              id="guest-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => onField("phone", e.target.value)}
              placeholder="98765 43210"
              className={cn(
                selectClass,
                "rounded-l-none",
                errors.phone && "border-rose-500",
              )}
            />
          </div>
          {errors.phone && (
            <p className="mt-1.5 text-xs font-medium text-rose-500">
              {errors.phone}
            </p>
          )}
        </div>

        <div className="col-span-6 sm:col-span-3">
          <Input
            label="Email (optional)"
            name="guest-email"
            type="email"
            placeholder="guest@example.com"
            value={form.email}
            onChange={(e) => onField("email", e.target.value)}
            error={errors.email}
          />
        </div>

        <div className="col-span-6 sm:col-span-4">
          <Input
            label="Nationality"
            name="guest-nationality"
            placeholder="Indian"
            value={form.nationality}
            onChange={(e) => onField("nationality", e.target.value)}
          />
        </div>

        <div className="col-span-6 sm:col-span-4">
          <label htmlFor="guest-idType" className={labelClass}>
            ID Type <span className="text-rose-500">*</span>
          </label>
          <select
            id="guest-idType"
            value={form.idType}
            onChange={(e) => onField("idType", e.target.value)}
            className={selectClass}
          >
            {ID_TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="col-span-12 sm:col-span-4">
          <Input
            label="ID Number"
            name="guest-idNumber"
            required
            placeholder="e.g. 1234-5678-9012"
            value={form.idNumber}
            onChange={(e) => onField("idNumber", e.target.value)}
            error={errors.idNumber}
          />
        </div>
      </div>
    </SectionCard>
  );
}

export default GuestSection;
