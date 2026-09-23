import { useState } from "react";
import { useOutletContext, useNavigate } from "react-router";
import {
  Building2,
  Wallet,
  CalendarClock,
  LifeBuoy,
  Plus,
  ArrowUpRight,
} from "lucide-react";

import Topbar from "../../../components/layout/Topbar.jsx";
import StatCard from "../../../components/ui/StatCard.jsx";
import Badge from "../../../components/ui/Badge.jsx";
import Button from "../../../components/ui/Button.jsx";
import CreateHotelModal from "../../hotels/components/CreateHotelModal.jsx";

import { useHotels } from "../../hotels/hooks/useHotels.js";
import { useSubscriptions } from "../../subscriptions/hooks/useSubscriptions.js";
import { useTransactions } from "../../transactions/hooks/useTransactions.js";
import { useSuperAdminServiceRequests } from "../../service-requests/hooks/useSuperAdminServiceRequests.js";

function formatCurrency(n) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function DashboardPage() {
  const { onMenuClick } = useOutletContext();
  const navigate = useNavigate();

  const { hotels = [], isLoading: hotelsLoading } = useHotels();
  const { subscriptions = [], isLoading: subsLoading } = useSubscriptions();
  const { transactions = [], isLoading: txLoading } = useTransactions();
  const { serviceRequests: requests = [], isLoading: reqsLoading } =
    useSuperAdminServiceRequests();

  const [createOpen, setCreateOpen] = useState(false);
  const loading = hotelsLoading || subsLoading || txLoading || reqsLoading;

  const hotelList = Array.isArray(hotels) ? hotels : [];
  const subList = Array.isArray(subscriptions) ? subscriptions : [];
  const txList = Array.isArray(transactions) ? transactions : [];
  const reqList = Array.isArray(requests) ? requests : [];

  const activeHotels = hotelList.filter(
    (hotel) => String(hotel.status || "").toUpperCase() === "ACTIVE",
  ).length;
  const totalHotels = hotelList.length;

  const totalRevenue = txList.reduce(
    (sum, transaction) => sum + Number(transaction.amount || 0),
    0,
  );

  const expiringSoon = subList.filter((subscription) => {
    const s = String(subscription.status || "").toLowerCase();
    return s === "expiring_soon" || s === "expiring soon";
  }).length;

  const openRequests = reqList.filter((request) => {
    const status = String(request.status || "").toUpperCase();

    return (
      status === "OPEN" ||
      status === "IN_PROGRESS" ||
      status === "IN PROGRESS" ||
      status === "PENDING"
    );
  }).length;

  return (
    <>
      <Topbar
        title="Overview"
        subtitle="A snapshot of every hotel on your platform."
        onMenuClick={onMenuClick}
        actions={
          <Button icon={Plus} onClick={() => setCreateOpen(true)}>
            Create hotel
          </Button>
        }
      />

      <main className="flex-1 space-y-6 px-5 pb-10 lg:px-8">
        {/* STAT CARDS */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Active hotels"
            value={loading ? "—" : activeHotels}
            icon={Building2}
            accent="signal"
            trend={`${totalHotels} total on platform`}
          />

          <StatCard
            label="Food transaction revenue"
            value={loading ? "—" : formatCurrency(totalRevenue)}
            icon={Wallet}
            accent="amber"
            trend="Across all properties"
          />

          <StatCard
            label="Subscriptions expiring soon"
            value={loading ? "—" : expiringSoon}
            icon={CalendarClock}
            accent="rose"
            trend="Within the next 30 days"
          />

          <StatCard
            label="Open service requests"
            value={loading ? "—" : openRequests}
            icon={LifeBuoy}
            accent="ink"
            trend="Needs your attention"
          />
        </div>

        {/* LOWER SECTIONS */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
          {/* RECENTLY ADDED HOTELS */}
          <div className="border-surface-200 rounded-2xl border bg-white xl:col-span-3">
            <div className="border-surface-200 flex items-center justify-between border-b px-5 py-4">
              <h3 className="font-display text-brand-900 font-bold">
                Recently added hotels
              </h3>

              <button
                onClick={() => navigate("/hotels")}
                className="text-primary-600 hover:text-primary-700 flex items-center gap-1 text-xs font-semibold hover:underline"
              >
                View all
                <ArrowUpRight size={13} />
              </button>
            </div>

            <div className="divide-surface-200 divide-y">
              {loading ? (
                <div className="text-brand-700/60 px-5 py-8 text-center text-sm">
                  Loading hotels...
                </div>
              ) : hotels.length === 0 ? (
                <p className="text-brand-700/60 px-5 py-8 text-center text-sm">
                  No hotels yet.
                </p>
              ) : (
                hotels.slice(0, 5).map((hotel) => (
                  <div
                    key={hotel._id || hotel.id}
                    className="flex items-center justify-between px-5 py-3.5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-primary-100 text-primary-800 flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold">
                        {hotel.name ? hotel.name.charAt(0).toUpperCase() : "H"}
                      </div>

                      <div>
                        <p className="text-brand-900 text-sm font-semibold">
                          {hotel.name}
                        </p>

                        <p className="text-brand-700/60 text-xs">
                          {hotel.email || "No email"}
                        </p>
                      </div>
                    </div>

                    <Badge
                      status={
                        hotel.status === "ACTIVE" ? "active" : "deactivated"
                      }
                    />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* LATEST SERVICE REQUESTS */}
          <div className="border-surface-200 rounded-2xl border bg-white xl:col-span-2">
            <div className="border-surface-200 flex items-center justify-between border-b px-5 py-4">
              <h3 className="font-display text-brand-900 font-bold">
                Latest service requests
              </h3>

              <button
                onClick={() => navigate("/service-requests")}
                className="text-primary-600 hover:text-primary-700 flex items-center gap-1 text-xs font-semibold hover:underline"
              >
                View all
                <ArrowUpRight size={13} />
              </button>
            </div>

            <div className="divide-surface-200 divide-y">
              {loading ? (
                <div className="text-brand-700/60 px-5 py-8 text-center text-sm">
                  Loading service requests...
                </div>
              ) : requests.length === 0 ? (
                <p className="text-brand-700/60 px-5 py-8 text-center text-sm">
                  No service requests.
                </p>
              ) : (
                requests.slice(0, 4).map((request) => (
                  <div key={request._id || request.id} className="px-5 py-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-brand-900 text-sm font-semibold">
                          {request.subject ||
                            request.title ||
                            "Service request"}
                        </p>

                        <p className="text-brand-700/60 mt-0.5 text-xs">
                          {request.hotelName || request.hotel?.name || "Hotel"}
                        </p>
                      </div>

                      <Badge status={request.status} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      <CreateHotelModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => setCreateOpen(false)}
      />
    </>
  );
}
