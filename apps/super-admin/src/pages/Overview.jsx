import { useEffect, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import {
  Building2,
  Wallet,
  CalendarClock,
  LifeBuoy,
  Plus,
  ArrowUpRight,
} from "lucide-react";

import Topbar from "../components/layout/Topbar.jsx";
import StatCard from "../components/ui/StatCard.jsx";
import Badge from "../components/ui/Badge.jsx";
import Button from "../components/ui/Button.jsx";
import CreateHotelModal from "../components/hotels/CreateHotelModal.jsx";

import {
  fetchHotels,
  fetchSubscriptions,
  fetchTransactionSummary,
  fetchServiceRequests,
} from "../api/client.js";

// =====================================================
// FORMAT CURRENCY
// =====================================================

function formatCurrency(n) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

// =====================================================
// OVERVIEW
// =====================================================

export default function Overview() {
  const { onMenuClick } = useOutletContext();
  const navigate = useNavigate();

  // ===================================================
  // STATE
  // ===================================================

  const [hotels, setHotels] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [requests, setRequests] = useState([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // ===================================================
  // LOAD DASHBOARD DATA
  // ===================================================

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      try {
        setLoading(true);

        const [hotelsData, subscriptionsData, transactionsData, requestsData] =
          await Promise.all([
            fetchHotels(),
            fetchSubscriptions(),
            fetchTransactionSummary(),
            fetchServiceRequests(),
          ]);

        if (!mounted) return;

        setHotels(Array.isArray(hotelsData) ? hotelsData : []);

        setSubscriptions(
          Array.isArray(subscriptionsData) ? subscriptionsData : [],
        );

        setTransactions(
          Array.isArray(transactionsData) ? transactionsData : [],
        );

        setRequests(Array.isArray(requestsData) ? requestsData : []);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  // ===================================================
  // ACTIVE HOTELS
  // ===================================================

  const activeHotels = hotels.filter(
    (hotel) => hotel.status === "ACTIVE",
  ).length;

  // ===================================================
  // TOTAL HOTELS
  // ===================================================

  const totalHotels = hotels.length;

  // ===================================================
  // FOOD TRANSACTION REVENUE
  // KEEPING DUMMY DATA FOR NOW
  // ===================================================

  const totalRevenue = transactions.reduce(
    (sum, transaction) => sum + Number(transaction.amount || 0),
    0,
  );

  // ===================================================
  // EXPIRING SUBSCRIPTIONS
  //
  // IMPORTANT:
  // This now comes from the REAL subscription API.
  //
  // Backend calculates:
  // ACTIVE
  // EXPIRING_SOON
  // EXPIRED
  // ===================================================

  const expiringSoon = subscriptions.filter(
    (subscription) => subscription.status === "EXPIRING_SOON",
  ).length;

  // ===================================================
  // OPEN SERVICE REQUESTS
  //
  // This will become completely real once the
  // ServiceRequest backend is implemented.
  //
  // Supports both existing lowercase mock statuses
  // and future uppercase backend statuses.
  // ===================================================

  const openRequests = requests.filter((request) => {
    const status = String(request.status || "").toUpperCase();

    return (
      status === "OPEN" ||
      status === "IN_PROGRESS" ||
      status === "IN PROGRESS" ||
      status === "PENDING"
    );
  }).length;

  // ===================================================
  // CREATE HOTEL
  // ===================================================

  const handleHotelCreated = (hotel) => {
    if (!hotel) return;

    setHotels((previousHotels) => [hotel, ...previousHotels]);
  };

  // ===================================================
  // RENDER
  // ===================================================

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
        {/* =================================================
            STAT CARDS
        ================================================= */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {/* ACTIVE HOTELS */}

          <StatCard
            label="Active hotels"
            value={loading ? "—" : activeHotels}
            icon={Building2}
            accent="signal"
            trend={`${totalHotels} total on platform`}
          />

          {/* FOOD REVENUE
              KEEPING THIS DUMMY FOR NOW */}

          <StatCard
            label="Food transaction revenue"
            value={loading ? "—" : formatCurrency(totalRevenue)}
            icon={Wallet}
            accent="amber"
            trend="Across all properties"
          />

          {/* EXPIRING SUBSCRIPTIONS */}

          <StatCard
            label="Subscriptions expiring soon"
            value={loading ? "—" : expiringSoon}
            icon={CalendarClock}
            accent="rose"
            trend="Within the next 30 days"
          />

          {/* OPEN SERVICE REQUESTS */}

          <StatCard
            label="Open service requests"
            value={loading ? "—" : openRequests}
            icon={LifeBuoy}
            accent="ink"
            trend="Needs your attention"
          />
        </div>

        {/* =================================================
            LOWER SECTIONS
        ================================================= */}

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
          {/* =================================================
              RECENTLY ADDED HOTELS
          ================================================= */}

          <div className="border-line rounded-2xl border bg-white xl:col-span-3">
            <div className="border-line flex items-center justify-between border-b px-5 py-4">
              <h3 className="font-display text-ink-body font-bold">
                Recently added hotels
              </h3>

              <button
                onClick={() => navigate("/hotels")}
                className="text-signal-600 flex items-center gap-1 text-xs font-semibold hover:underline"
              >
                View all
                <ArrowUpRight size={13} />
              </button>
            </div>

            <div className="divide-line divide-y">
              {loading ? (
                <div className="text-ink-muted px-5 py-8 text-center text-sm">
                  Loading hotels...
                </div>
              ) : hotels.length === 0 ? (
                <p className="text-ink-muted px-5 py-8 text-center text-sm">
                  No hotels yet.
                </p>
              ) : (
                hotels.slice(0, 5).map((hotel) => (
                  <div
                    key={hotel._id || hotel.id}
                    className="flex items-center justify-between px-5 py-3.5"
                  >
                    {/* HOTEL INFORMATION */}

                    <div className="flex items-center gap-3">
                      <div className="bg-signal-100 text-signal-600 flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold">
                        {hotel.name ? hotel.name.charAt(0).toUpperCase() : "H"}
                      </div>

                      <div>
                        <p className="text-ink-body text-sm font-semibold">
                          {hotel.name}
                        </p>

                        <p className="text-ink-muted text-xs">
                          {hotel.email || "No email"}
                        </p>
                      </div>
                    </div>

                    {/* HOTEL STATUS */}

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

          {/* =================================================
              LATEST SERVICE REQUESTS
          ================================================= */}

          <div className="border-line rounded-2xl border bg-white xl:col-span-2">
            <div className="border-line flex items-center justify-between border-b px-5 py-4">
              <h3 className="font-display text-ink-body font-bold">
                Latest service requests
              </h3>

              <button
                onClick={() => navigate("/service-requests")}
                className="text-signal-600 flex items-center gap-1 text-xs font-semibold hover:underline"
              >
                View all
                <ArrowUpRight size={13} />
              </button>
            </div>

            <div className="divide-line divide-y">
              {loading ? (
                <div className="text-ink-muted px-5 py-8 text-center text-sm">
                  Loading service requests...
                </div>
              ) : requests.length === 0 ? (
                <p className="text-ink-muted px-5 py-8 text-center text-sm">
                  No service requests.
                </p>
              ) : (
                requests.slice(0, 4).map((request) => (
                  <div key={request._id || request.id} className="px-5 py-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-ink-body text-sm font-semibold">
                          {request.subject ||
                            request.title ||
                            "Service request"}
                        </p>

                        <p className="text-ink-muted mt-0.5 text-xs">
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

      {/* =================================================
          CREATE HOTEL MODAL
      ================================================= */}

      <CreateHotelModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={handleHotelCreated}
      />
    </>
  );
}
