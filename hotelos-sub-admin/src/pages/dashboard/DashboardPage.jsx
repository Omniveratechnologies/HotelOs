import { useMemo } from "react";

import StatCard from "../../components/StatCard.jsx";
import AddMembers from "../../components/AddMembers.jsx";

const stats = [
  {
    label: "Total Rooms",
    value: "180",
    icon: <path d="M3 21V9l9-6 9 6v12M9 21v-6h6v6" strokeLinejoin="round" />,
  },
  {
    label: "Available Rooms",
    value: "38",
    icon: <path d="M9 12l2 2 4-4M12 3l9 4.5v9L12 21l-9-4.5v-9L12 3z" strokeLinejoin="round" />,
  },
  {
    label: "Occupied Rooms",
    value: "142",
    tone: "gold",
    icon: (
      <path
        d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    label: "Total Check-ins",
    value: "24",
    sub: "Today",
    icon: <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />,
  },
  {
    label: "Today's Checkouts",
    value: "17",
    icon: <path d="M19 12H5M11 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />,
  },
  {
    label: "Pending Reservations",
    value: "9",
    icon: <path d="M12 8v4l2.5 2.5M12 3a9 9 0 100 18 9 9 0 000-18z" strokeLinecap="round" />,
  },
  {
    label: "Today's Revenue",
    value: "$18,420",
    tone: "gold",
    sub: "+12% vs yesterday",
    icon: <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" strokeLinecap="round" />,
  },
  {
    label: "Pending Service Requests",
    value: "6",
    icon: <path d="M12 22s8-4.5 8-11V5l-8-3-8 3v6c0 6.5 8 11 8 11z" strokeLinejoin="round" />,
  },
  {
    label: "Active Staff",
    value: "31",
    icon: (
      <path
        d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    label: "Current Occupancy",
    value: "79%",
    icon: <path d="M4 20V10M11 20V4M18 20v-7" strokeLinecap="round" />,
  },
];

const activities = [
  {
    text: "Room 302 checked in — Rohan Kapoor",
    time: "5 min ago",
    tone: "gold",
  },
  {
    text: "Housekeeping completed Room 118",
    time: "18 min ago",
    tone: "default",
  },
  {
    text: "New reservation #4821 for 3 nights",
    time: "32 min ago",
    tone: "gold",
  },
  {
    text: "Room 214 requested late checkout",
    time: "48 min ago",
    tone: "default",
  },
  {
    text: "Maintenance ticket closed — Room 305",
    time: "1 hr ago",
    tone: "default",
  },
  {
    text: "Room 108 checked out — Ethan Cole",
    time: "1 hr 20 min ago",
    tone: "gold",
  },
];

export default function Dashboard() {
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("auth_user")) || {};
    } catch {
      return {};
    }
  }, []);

  const firstName =
    user.name?.trim().split(" ")[0] || "Admin";

  return (
    <div className="min-h-screen bg-ivory flex font-body">
      <div className="flex-1 min-w-0">
        {/* =====================================================
            TOPBAR
        ===================================================== */}

        <header className="sticky top-0 z-20 bg-cream/95 backdrop-blur border-b border-beige-border h-20 flex items-center justify-between px-6 lg:px-10">
          <div className="flex items-center gap-4 min-w-0">
            <button
              className="lg:hidden text-navy shrink-0"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 7h16M4 12h16M4 17h16"
                  stroke="#22324E"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            <div className="min-w-0">
              <h1 className="font-display text-2xl font-semibold text-navy truncate">
                Welcome, {firstName}
              </h1>

              <p className="text-sm text-muted hidden sm:block">
                Here's what's happening at Test Hotel today.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <button
              aria-label="Notifications"
              className="relative w-10 h-10 rounded-full bg-ivory border border-beige-border flex items-center justify-center text-navy"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0"
                  stroke="#22324E"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-gold" />
            </button>

            <div className="flex items-center gap-2.5">
              <span className="w-10 h-10 rounded-full bg-navy text-cream flex items-center justify-center font-display font-semibold">
                {(firstName || "A").charAt(0).toUpperCase()}
              </span>

              <span className="hidden sm:block text-sm font-medium text-navy">{user.name || "Admin"}</span>
            </div>
          </div>
        </header>

        {/* =====================================================
            CONTENT
        ===================================================== */}

        <main className="px-6 lg:px-10 py-8">
          {/* ===================================================
              ADD MEMBERS
          =================================================== */}

          <AddMembers />

          {/* ===================================================
              STATISTICS
          =================================================== */}

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-8">
            {stats.map((s) => (
              <StatCard key={s.label} {...s} />
            ))}
          </div>

          {/* ===================================================
              RECENT ACTIVITIES
          =================================================== */}

          <div className="bg-cream border border-beige-border rounded-2xl shadow-card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl font-semibold text-navy">Recent Activities</h2>

              <a href="#" className="text-sm text-gold font-medium hover:text-gold-hover">
                View all
              </a>
            </div>

            <div className="space-y-4">
              {activities.map((a, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-4 pb-4 border-b border-beige-border last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        a.tone === "gold" ? "bg-gold" : "bg-beige-border"
                      }`}
                    />

                    <p className="text-sm text-navy/80 truncate">{a.text}</p>
                  </div>

                  <span className="text-xs text-muted shrink-0">{a.time}</span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
