import React, { useState } from "react";
import {
  Header,
  KpiTile,
  KpiTileRow,
  Button,
  InlineBanner,
  Input,
} from "@hotelos/ui/components";
import {
  Key,
  Plus,
  Search,
  CheckCircle2,
  RotateCcw,
  Ban,
  Trash2,
  X,
  CreditCard,
  User,
  DoorOpen,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@hotelos/query";
import {
  getKeyCards,
  getKeyCardStats,
  createKeyCard,
  blockKeyCard,
  deactivateKeyCard,
  deleteKeyCard,
} from "@hotelos/api";

export default function KeyCardsInventoryPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [bannerMsg, setBannerMsg] = useState("");
  const [bannerVariant, setBannerVariant] = useState("success");

  // Create form state
  const [cardNumber, setCardNumber] = useState("");
  const [keyType, setKeyType] = useState("RFID_CARD");
  const [batchCount, setBatchCount] = useState(10);
  const [batchPrefix, setBatchPrefix] = useState("RC-2026-");

  const { data: listData, isLoading } = useQuery({
    queryKey: ["key-cards", "list", { q: searchQuery, status: statusFilter }],
    queryFn: () => getKeyCards({ q: searchQuery, status: statusFilter }),
  });

  const { data: statsData } = useQuery({
    queryKey: ["key-cards", "stats"],
    queryFn: () => getKeyCardStats(),
  });

  const cards = listData?.cards || [];
  const stats = statsData || {
    total: 0,
    active: 0,
    available: 0,
    lost: 0,
    reissuedToday: 0,
  };

  const createMutation = useMutation({
    mutationFn: (body) => createKeyCard(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["key-cards"] });
      setBannerVariant("success");
      setBannerMsg("Key card(s) added to inventory successfully!");
      setModalOpen(false);
      setCardNumber("");
      setTimeout(() => setBannerMsg(""), 4000);
    },
    onError: (err) => {
      setBannerVariant("error");
      setBannerMsg(err?.message || "Failed to register key card");
    },
  });

  const blockMutation = useMutation({
    mutationFn: (id) =>
      blockKeyCard(id, { reason: "Reported lost by front desk" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["key-cards"] });
      setBannerVariant("warning");
      setBannerMsg("Card marked as LOST and blocked from door access.");
      setTimeout(() => setBannerMsg(""), 4000);
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id) => deactivateKeyCard(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["key-cards"] });
      setBannerVariant("success");
      setBannerMsg("Card returned to available stock.");
      setTimeout(() => setBannerMsg(""), 4000);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteKeyCard(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["key-cards"] });
      setBannerVariant("success");
      setBannerMsg("Key card removed from inventory.");
      setTimeout(() => setBannerMsg(""), 4000);
    },
  });

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (batchMode) {
      createMutation.mutate({
        keyType,
        count: Number(batchCount) || 10,
        prefix: batchPrefix || "RC-2026-",
      });
    } else {
      createMutation.mutate({
        cardNumber,
        keyType,
      });
    }
  };

  return (
    <div className="bg-background-50/50 min-h-screen pb-24">
      <Header
        pageTitle="Key Cards & Hardware Inventory"
        pageDescription="Manage RFID key cards, physical keys, stock status, and guest room assignments"
      >
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => setModalOpen(true)}
        >
          Register New Cards
        </Button>
      </Header>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* KPI Row */}
        <KpiTileRow>
          <KpiTile
            label="Total Stock"
            value={stats.total}
            icon={Key}
            iconClassName="bg-brand-50 text-brand-700"
          />
          <KpiTile
            label="In Use / Active"
            value={stats.active}
            icon={DoorOpen}
            iconClassName="bg-emerald-50 text-emerald-700"
          />
          <KpiTile
            label="Available in Tray"
            value={stats.available}
            icon={CheckCircle2}
            iconClassName="bg-blue-50 text-blue-700"
          />
          <KpiTile
            label="Reissued Today"
            value={stats.reissuedToday || 0}
            icon={RotateCcw}
            iconClassName="bg-amber-50 text-amber-700"
          />
          <KpiTile
            label="Lost / Blocked"
            value={stats.lost}
            icon={Ban}
            iconClassName="bg-rose-50 text-rose-700"
          />
        </KpiTileRow>

        {bannerMsg && (
          <InlineBanner variant={bannerVariant}>{bannerMsg}</InlineBanner>
        )}

        {/* Filters */}
        <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-xs sm:flex-row">
          <div className="relative w-full sm:w-80">
            <Search className="absolute top-2.5 left-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by card # or UID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="focus:border-brand-500 w-full rounded-lg border border-gray-200 py-2 pr-3 pl-9 text-sm focus:outline-none"
            />
          </div>

          <div className="flex w-full items-center gap-2 sm:w-auto">
            <span className="text-xs font-semibold text-gray-500">Status:</span>
            {["ALL", "AVAILABLE", "ACTIVE", "LOST", "DEACTIVATED"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  statusFilter === st
                    ? "bg-brand-600 text-white shadow-xs"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
          {isLoading ? (
            <div className="p-12 text-center text-sm text-gray-500">
              Loading key card inventory...
            </div>
          ) : cards.length === 0 ? (
            <div className="p-16 text-center">
              <Key className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-3 text-sm font-bold text-gray-900">
                No key cards found
              </h3>
              <p className="mx-auto mt-1 max-w-sm text-xs text-gray-500">
                No cards match the current filter. Click below to add key cards
                to your hotel stock.
              </p>
              <div className="mt-5">
                <Button
                  variant="primary"
                  size="sm"
                  icon={Plus}
                  onClick={() => setModalOpen(true)}
                >
                  Add Cards to Tray
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-gray-200 bg-gray-50 font-semibold tracking-wider text-gray-600 uppercase">
                  <tr>
                    <th className="px-5 py-3.5">Card Number</th>
                    <th className="px-4 py-3.5">Type</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5">Current Room</th>
                    <th className="px-4 py-3.5">Assigned Guest</th>
                    <th className="px-4 py-3.5">Issued At</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {cards.map((c) => (
                    <tr key={c._id} className="transition hover:bg-gray-50/70">
                      <td className="px-5 py-4 font-mono text-sm font-bold text-gray-900">
                        {c.cardNumber}
                      </td>
                      <td className="px-4 py-4 text-gray-600">
                        <span className="inline-flex items-center gap-1 font-medium">
                          <CreditCard className="h-3.5 w-3.5 text-gray-400" />
                          {c.keyType === "RFID_CARD"
                            ? "RFID Key Card"
                            : c.keyType}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                            c.status === "ACTIVE"
                              ? "bg-emerald-100 text-emerald-800"
                              : c.status === "AVAILABLE"
                                ? "bg-blue-100 text-blue-800"
                                : c.status === "LOST"
                                  ? "bg-rose-100 text-rose-800"
                                  : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {c.assignedRoomId?.roomNumber ? (
                          <span className="text-brand-900 font-bold">
                            Room {c.assignedRoomId.roomNumber}
                          </span>
                        ) : (
                          <span className="text-gray-400">In Tray</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {c.assignedGuestId?.name ? (
                          <div className="flex items-center gap-1.5 font-medium text-gray-800">
                            <User className="h-3.5 w-3.5 text-gray-400" />
                            {c.assignedGuestId.name}
                          </div>
                        ) : (
                          <span className="text-gray-400">Not assigned</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-gray-500">
                        {c.issuedAt
                          ? new Date(c.issuedAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Not issued"}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {c.status === "ACTIVE" && (
                            <>
                              <button
                                type="button"
                                onClick={() => blockMutation.mutate(c._id)}
                                className="rounded px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50"
                                title="Report Lost / Block"
                              >
                                Block
                              </button>
                              <button
                                type="button"
                                onClick={() => deactivateMutation.mutate(c._id)}
                                className="rounded px-2 py-1 text-[11px] font-semibold text-amber-700 hover:bg-amber-50"
                                title="Deactivate & Return to Stock"
                              >
                                Return
                              </button>
                            </>
                          )}
                          {c.status === "AVAILABLE" && (
                            <button
                              type="button"
                              onClick={() => {
                                if (
                                  confirm(
                                    `Remove card ${c.cardNumber} from inventory?`,
                                  )
                                ) {
                                  deleteMutation.mutate(c._id);
                                }
                              }}
                              className="rounded p-1 text-gray-400 hover:text-rose-600"
                              title="Delete from Stock"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal for adding cards */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">
                Register Key Cards
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex gap-2 border-b border-gray-100 pb-2 text-xs">
              <button
                type="button"
                onClick={() => setBatchMode(false)}
                className={`rounded-lg px-3 py-1.5 font-semibold ${
                  !batchMode
                    ? "bg-brand-600 text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                Single Card
              </button>
              <button
                type="button"
                onClick={() => setBatchMode(true)}
                className={`rounded-lg px-3 py-1.5 font-semibold ${
                  batchMode
                    ? "bg-brand-600 text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                Batch Generate
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="mb-1 block font-semibold text-gray-700">
                  Card / Key Type
                </label>
                <select
                  value={keyType}
                  onChange={(e) => setKeyType(e.target.value)}
                  className="focus:border-brand-500 w-full rounded-lg border border-gray-200 bg-white p-2.5 outline-none"
                >
                  <option value="RFID_CARD">
                    RFID Key Card (Door Contactless)
                  </option>
                  <option value="PHYSICAL_KEY">Physical Metal Key</option>
                  <option value="MOBILE_KEY">Mobile Digital Key</option>
                </select>
              </div>

              {!batchMode ? (
                <div>
                  <Input
                    label="Card Number / UID *"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="e.g. RC-2026-1045"
                    required
                  />
                </div>
              ) : (
                <>
                  <div>
                    <Input
                      label="Card Prefix"
                      value={batchPrefix}
                      onChange={(e) => setBatchPrefix(e.target.value)}
                      placeholder="RC-2026-"
                    />
                  </div>
                  <div>
                    <Input
                      label="Quantity of Cards to Register"
                      type="number"
                      value={batchCount}
                      onChange={(e) => setBatchCount(e.target.value)}
                      placeholder="10"
                      min={1}
                      max={100}
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-3">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={createMutation.isPending}
                >
                  {batchMode ? `Register ${batchCount} Cards` : "Register Card"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
