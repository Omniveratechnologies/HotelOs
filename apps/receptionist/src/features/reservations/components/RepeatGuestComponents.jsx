import React from "react";
import { Crown, Search, Star, Clock, Sparkles, Award } from "lucide-react";
import { SectionCard, Input } from "@hotelos/ui/components";
import { formatCurrency } from "@hotelos/utils";
import { useQuery } from "@hotelos/query";
import { searchGuests } from "@hotelos/api";

/**
 * Step 1: Search & Select Repeat Guest
 */
export function RepeatGuestSearchPane({
  searchQuery,
  onSearchChange,
  selectedGuest,
  onSelectGuest,
  error,
}) {
  const { data: guestsData, isLoading } = useQuery({
    queryKey: ["guests", "search", searchQuery || ""],
    queryFn: () => searchGuests(searchQuery || ""),
  });

  const guests = guestsData?.guests || guestsData || [];

  return (
    <SectionCard
      title="Search & Select Returning Guest"
      subtitle="Lookup guest history, loyalty status and historical stay preferences"
      icon={Search}
    >
      <div className="space-y-6">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
            {error}
          </div>
        )}

        {/* Search Bar */}
        <div className="relative">
          <Input
            label="Guest Lookup"
            placeholder="Search by name, phone (+91), email, or ID..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            error={error}
          />
        </div>

        {/* Two-Pane Search and Profile Display */}
        <div className="grid grid-cols-12 gap-4">
          {/* Left: Result List */}
          <div className="col-span-12 max-h-[380px] space-y-2 overflow-y-auto pr-1 md:col-span-5">
            <span className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
              Matching Records ({guests.length})
            </span>

            {isLoading ? (
              <div className="p-6 text-center text-xs text-gray-400">
                Searching guest records...
              </div>
            ) : guests.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-400">
                {searchQuery
                  ? "No guests found matching search."
                  : "Type a name or phone number to look up returning guests."}
              </div>
            ) : (
              guests.map((g) => {
                const isSelected = selectedGuest?.id === g.id;
                return (
                  <div
                    key={g.id}
                    onClick={() => onSelectGuest(g)}
                    className={`cursor-pointer rounded-xl border p-3 transition ${
                      isSelected
                        ? "border-blue-500 bg-blue-50/70 shadow-xs ring-1 ring-blue-500"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
                          {g.name}
                          {g.tier === "Gold" && (
                            <span className="py-0.2 inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 text-[10px] font-bold text-amber-800">
                              <Crown className="h-2.5 w-2.5" /> VIP
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 text-xs text-gray-600">
                          {g.phone || "No phone"}
                        </div>
                        <div className="text-[11px] text-gray-400">
                          {g.email || "No email"}
                        </div>
                      </div>
                      <div className="text-right text-[11px]">
                        <span className="text-brand-900 block font-semibold">
                          {g.totalStays || 0} Stays
                        </span>
                        <span className="text-gray-400">
                          Last: {g.lastStay || "First stay"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right: Guest Profile & Past Preferences */}
          <div className="col-span-12 rounded-xl border border-gray-200 bg-gray-50/50 p-4 md:col-span-7">
            {selectedGuest ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between border-b border-gray-200 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-gray-900">
                        {selectedGuest.name}
                      </h4>
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                        {selectedGuest.tier || "Standard"} Member
                      </span>
                    </div>
                    <p className="mt-0.5 font-mono text-xs text-gray-500">
                      ID: {selectedGuest.id}
                    </p>
                  </div>
                  <div className="text-right text-xs">
                    <div className="text-brand-900 font-semibold">
                      {selectedGuest.totalStays || 1} Stays Recorded
                    </div>
                  </div>
                </div>

                {/* Stats Tiles */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg border border-gray-200 bg-white p-2.5 shadow-2xs">
                    <span className="text-brand-900 block text-base font-bold">
                      {selectedGuest.totalStays || 0}
                    </span>
                    <span className="text-[11px] text-gray-500">
                      Total Stays
                    </span>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white p-2.5 shadow-2xs">
                    <span className="text-brand-900 block text-base font-bold">
                      {selectedGuest.totalNights || 0}
                    </span>
                    <span className="text-[11px] text-gray-500">
                      Total Nights
                    </span>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white p-2.5 shadow-2xs">
                    <span className="block text-base font-bold text-emerald-700">
                      {formatCurrency(selectedGuest.totalSpend || 0)}
                    </span>
                    <span className="text-[11px] text-gray-500">
                      Total Spend
                    </span>
                  </div>
                </div>

                {/* Saved Preferences Chips */}
                <div>
                  <span className="mb-2 block flex items-center gap-1 text-xs font-semibold text-gray-700">
                    <Sparkles className="h-3.5 w-3.5 text-amber-600" /> Saved
                    Preferences
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(
                      selectedGuest.preferences || ["Non-Smoking", "High Floor"]
                    ).map((p) => (
                      <span
                        key={p}
                        className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-700 shadow-2xs"
                      >
                        ✓ {p}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                {selectedGuest.notes && (
                  <div className="rounded-lg border border-amber-200/60 bg-amber-50 p-2.5 text-xs text-amber-900">
                    <strong>Special Guest Instructions:</strong>{" "}
                    {selectedGuest.notes}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center py-12 text-center text-sm text-gray-400">
                Select a returning guest from the list to preview profile and
                saved preferences.
              </div>
            )}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

/**
 * Right Column: Repeat Guest Stay History & Loyalty
 */
export function RepeatGuestHistoryPanel({ selectedGuest }) {
  if (!selectedGuest) return null;

  const stayHistory = selectedGuest.stayHistory || [];
  const favoriteRooms = selectedGuest.favoriteRooms || [];

  return (
    <div className="space-y-6">
      {/* Loyalty Card */}
      <div className="rounded-2xl border border-amber-300 bg-linear-to-br from-amber-500 to-amber-600 p-5 text-white shadow-xs">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Award className="h-5 w-5 text-amber-100" />
            <span className="text-xs font-bold tracking-wider uppercase">
              {selectedGuest.tier || "Standard"} Loyalty Tier
            </span>
          </div>
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold">
            {selectedGuest.totalStays || 1} Stays
          </span>
        </div>
        <div className="text-lg font-bold">{selectedGuest.name}</div>
        <div className="mt-1 text-xs text-amber-100">
          Guest: {selectedGuest.phone || selectedGuest.email}
        </div>
      </div>

      {/* Past Stay Timeline */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
        <h4 className="mb-3 flex items-center gap-1.5 text-xs font-bold tracking-wider text-gray-600 uppercase">
          <Clock className="text-brand-900 h-4 w-4" /> Past Stay History
        </h4>
        {stayHistory.length === 0 ? (
          <div className="py-2 text-xs text-gray-400">
            No prior stay records found.
          </div>
        ) : (
          <div className="space-y-3">
            {stayHistory.map((s, idx) => (
              <div
                key={s.dates || `stay-${idx}`}
                className="border-l-2 border-emerald-500 py-0.5 pl-3 text-xs"
              >
                <div className="flex justify-between font-semibold text-gray-900">
                  <span>{s.dates}</span>
                  <span className="text-emerald-700">
                    {formatCurrency(s.amount)}
                  </span>
                </div>
                <div className="mt-0.5 flex justify-between text-gray-500">
                  <span>{s.room}</span>
                  <span className="py-0.2 rounded-full bg-emerald-50 px-1.5 text-[10px] text-emerald-800">
                    {s.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Favorite Rooms */}
      {favoriteRooms.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
          <h4 className="mb-3 flex items-center gap-1.5 text-xs font-bold tracking-wider text-gray-600 uppercase">
            <Star className="h-4 w-4 text-amber-500" /> Favorite Rooms
          </h4>
          <div className="flex gap-2">
            {favoriteRooms.map((rm) => (
              <div
                key={rm}
                className="flex-1 rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-center text-xs"
              >
                <span className="block font-bold text-gray-900">{rm}</span>
                <span className="text-[11px] text-gray-500">
                  Booked multiple times
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
