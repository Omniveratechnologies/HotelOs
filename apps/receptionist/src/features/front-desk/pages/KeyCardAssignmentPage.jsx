import React, { useState } from "react";
import {
  Header,
  KpiTile,
  KpiTileRow,
  Button,
  InlineBanner,
} from "@hotelos/ui/components";
import { Key, CheckCircle2, RotateCcw, Ban, Clock } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@hotelos/query";
import { getArrivalsQueue, getKeyCardStats, assignKeyCard } from "@hotelos/api";

export default function KeyCardAssignmentPage() {
  const queryClient = useQueryClient();
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [keyType, setKeyType] = useState("RFID_CARD");
  const [cardNo, setCardNo] = useState("RC-2026-1001");
  const [bannerMsg, setBannerMsg] = useState("");
  const [bannerVariant, setBannerVariant] = useState("success");

  // Fetch live active arrivals
  const { data: arrivalsData, isLoading: arrivalsLoading } = useQuery({
    queryKey: ["front-desk", "arrivals"],
    queryFn: () => getArrivalsQueue(),
  });

  const { data: statsData } = useQuery({
    queryKey: ["key-cards", "stats"],
    queryFn: () => getKeyCardStats(),
  });

  const arrivals = arrivalsData || [];
  const stats = statsData || {
    total: 0,
    active: 0,
    available: 0,
    lost: 0,
    reissuedToday: 0,
  };
  const currentGuest =
    selectedGuest || (arrivals.length > 0 ? arrivals[0] : null);

  const assignMutation = useMutation({
    mutationFn: (body) => assignKeyCard(body),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["key-cards"] });
      queryClient.invalidateQueries({ queryKey: ["front-desk"] });
      setBannerVariant("success");
      setBannerMsg(res.message || `Card assigned successfully!`);
      setTimeout(() => setBannerMsg(""), 4000);
    },
    onError: (err) => {
      setBannerVariant("error");
      setBannerMsg(err?.message || "Failed to assign key card");
    },
  });

  const handleGenerateNew = () => {
    const randomHex = Math.floor(1000 + Math.random() * 9000);
    setCardNo(`RC-2026-${randomHex}`);
  };

  const handleAssignCard = () => {
    if (!currentGuest?.id) return;
    assignMutation.mutate({
      cardNumber: cardNo,
      bookingId: currentGuest.id,
      roomId: currentGuest.roomId,
      notes: `Issued via Key Assignment Console for Room ${currentGuest.room}`,
    });
  };

  return (
    <div className="bg-background-50/50 min-h-screen pb-24">
      <Header
        pageTitle="Key & Card Assignment"
        pageDescription="Issue, reissue and manage RFID key cards and physical keys for active guests"
      />

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* KPI Row (5) */}
        <KpiTileRow>
          <KpiTile
            label="Available in Tray"
            value={stats.available}
            icon={Key}
            iconClassName="bg-blue-50 text-blue-700"
          />
          <KpiTile
            label="Total In Use"
            value={stats.active}
            icon={CheckCircle2}
            iconClassName="bg-emerald-50 text-emerald-700"
          />
          <KpiTile
            label="Reissued Today"
            value={stats.reissuedToday}
            icon={RotateCcw}
            iconClassName="bg-amber-50 text-amber-700"
          />
          <KpiTile
            label="Lost / Blocked"
            value={stats.lost}
            icon={Ban}
            iconClassName="bg-rose-50 text-rose-700"
          />
          <KpiTile
            label="Arrivals in Queue"
            value={arrivals.length}
            icon={Clock}
            iconClassName="bg-brand-50 text-brand-700"
          />
        </KpiTileRow>

        {bannerMsg && (
          <InlineBanner variant={bannerVariant}>{bannerMsg}</InlineBanner>
        )}

        <div className="grid grid-cols-12 items-start gap-6">
          {/* Left Column: Guest Queue */}
          <div className="col-span-12 space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-xs lg:col-span-4">
            <h3 className="text-xs font-bold tracking-wider text-gray-700 uppercase">
              Arrivals Requiring Keys ({arrivals.length})
            </h3>

            {arrivalsLoading ? (
              <div className="p-8 text-center text-xs text-gray-500">
                Loading guests...
              </div>
            ) : arrivals.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-500">
                No active arrivals waiting for key cards.
              </div>
            ) : (
              <div className="max-h-[500px] space-y-2 overflow-y-auto">
                {arrivals.map((g) => (
                  <div
                    key={g.id}
                    onClick={() => setSelectedGuest(g)}
                    className={`cursor-pointer rounded-xl border p-3 text-xs transition ${
                      currentGuest?.id === g.id
                        ? "border-brand-500 bg-brand-50/50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex justify-between font-bold text-gray-900">
                      <span>{g.name}</span>
                      <span className="text-brand-900">{g.room}</span>
                    </div>
                    <div className="mt-1 font-mono text-[11px] text-gray-500">
                      {g.bookingNo}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Issuance Console */}
          <div className="col-span-12 space-y-6 lg:col-span-8">
            {!currentGuest ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-16 text-center shadow-xs">
                <Key className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-3 text-sm font-bold text-gray-900">
                  Select a Guest to Issue Keys
                </h3>
                <p className="mx-auto mt-1 max-w-sm text-xs text-gray-500">
                  Pick a guest from the left arrivals list to assign or re-issue
                  room key cards.
                </p>
              </div>
            ) : (
              <div className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">
                <div className="flex items-start justify-between border-b border-gray-100 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">
                      {currentGuest.name}
                    </h3>
                    <p className="mt-0.5 font-mono text-xs text-gray-500">
                      Booking: {currentGuest.bookingNo} · {currentGuest.phone}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="block text-xs text-gray-500">
                      Assigned Room
                    </span>
                    <span className="text-brand-900 text-base font-bold">
                      {currentGuest.room}
                    </span>
                  </div>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="mb-1 block font-semibold text-gray-700">
                      Key Type
                    </label>
                    <select
                      value={keyType}
                      onChange={(e) => setKeyType(e.target.value)}
                      className="focus:border-brand-500 w-full rounded-lg border border-gray-200 p-2.5 outline-none"
                    >
                      <option value="RFID_CARD">
                        RFID Contactless Key Card
                      </option>
                      <option value="PHYSICAL_KEY">Physical Metal Key</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block font-semibold text-gray-700">
                      Card Number / UID
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={cardNo}
                        onChange={(e) => setCardNo(e.target.value)}
                        className="focus:border-brand-500 flex-1 rounded-lg border border-gray-200 px-3 py-2 font-mono text-sm focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleGenerateNew}
                        className="rounded-lg bg-gray-100 px-3 py-2 font-semibold text-gray-700 hover:bg-gray-200"
                      >
                        Auto-Generate
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                  <Button
                    variant="primary"
                    icon={CheckCircle2}
                    onClick={handleAssignCard}
                    disabled={assignMutation.isPending}
                  >
                    {assignMutation.isPending
                      ? "Assigning..."
                      : "Assign Key Card"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
