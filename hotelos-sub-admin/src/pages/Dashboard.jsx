import { useMemo, useState } from "react";

import StatCard from "../components/StatCard.jsx";
import { sendReceptionistInvitation } from "../services/invitation.service.js";
import { Input } from "../components/ui/Input.jsx";

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

  const [showReceptionistForm, setShowReceptionistForm] = useState(false);

  const [receptionistData, setReceptionistData] = useState({
    name: "",
    username: "",
    email: "",
  });

  const [sendingInvite, setSendingInvite] = useState(false);

  const [inviteMessage, setInviteMessage] = useState("");

  const [receptionistInviteError, setReceptionistInviteError] = useState({
    name: "",
    username: "",
    email: "",
    other: "",
  });

  const handleReceptionistInputChange = (e) => {
    const { name, value } = e.target;

    setReceptionistData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSendReceptionistInvite = async (e) => {
    e.preventDefault();

    setInviteMessage("");
    setReceptionistInviteError({});

    // check each required field is filled
    if (!receptionistData.name || !receptionistData.username || !receptionistData.email) {
      setReceptionistInviteError((prevErrors) => ({
        ...prevErrors,
        name: "Name is required.",
      }));
      return;
    }

    if (!receptionistData.username) {
      setReceptionistInviteError((prevErrors) => ({
        ...prevErrors,
        username: "Username is required.",
      }));
      return;
    }

    if (!receptionistData.email) {
      setReceptionistInviteError((prevErrors) => ({
        ...prevErrors,
        email: "Email is required.",
      }));
      return;
    }

    if (!receptionistData.email.includes("@")) {
      setReceptionistInviteError((prevErrors) => ({
        ...prevErrors,
        email: "Please enter a valid email address.",
      }));
      return;
    }

    try {
      setSendingInvite(true);

      await sendReceptionistInvitation(receptionistData);

      setInviteMessage(`Invitation sent successfully to ${receptionistData.email}`);

      setReceptionistData({
        name: "",
        username: "",
        email: "",
      });
    } catch (error) {
      console.error("Receptionist invitation error:", error);

      setReceptionistInviteError((prevErrors) => ({
        ...prevErrors,
        other: error.message || "Failed to send receptionist invitation.",
      }));
    } finally {
      setSendingInvite(false);
    }
  };

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

          <div className="bg-cream border border-beige-border rounded-2xl shadow-card p-6 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-semibold text-navy">Add Members</h2>

                <p className="text-sm text-muted mt-1">Add staff members to your hotel.</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowReceptionistForm(!showReceptionistForm);

                  setInviteMessage("");
                  setReceptionistInviteError({});
                }}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-navy text-cream px-5 py-3 font-medium hover:opacity-90 transition"
              >
                <span className="text-lg">{showReceptionistForm ? "-" : "+"}</span>
                Add Receptionist
              </button>
            </div>

            {/* ===============================================
                RECEPTIONIST INVITATION FORM
            =============================================== */}

              <div className={`transition-all duration-700 ease-in-out ${showReceptionistForm ? "max-h-[1000px] mt-6 pt-6 border-t border-beige-border " : "max-h-0 overflow-hidden"}`}>
                <form onSubmit={handleSendReceptionistInvite} className="max-w-xl">
                  <Input
                    type="text"
                    value={receptionistData.name}
                    onChange={handleReceptionistInputChange}
                    name="name"
                    placeholder="John Doe"
                    disabled={sendingInvite}
                    label="Receptionist Name"
                    error={receptionistInviteError.name}
                  />

                  <Input
                    type="email"
                    value={receptionistData.email}
                    onChange={handleReceptionistInputChange}
                    name="email"
                    placeholder="receptionist@example.com"
                    disabled={sendingInvite}
                    label="Receptionist Email"
                    error={receptionistInviteError.email}
                  />

                  <Input
                    type="text"
                    value={receptionistData.username}
                    onChange={handleReceptionistInputChange}
                    name="username"
                    placeholder="receptionist123"
                    disabled={sendingInvite}
                    label="Receptionist Username"
                    error={receptionistInviteError.username}
                  />

                  <p className="text-xs text-muted mt-2">
                    An invitation link will be sent to this email. The receptionist will create
                    their own account and password.
                  </p>

                  {receptionistInviteError.other && (
                    <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      {receptionistInviteError.other}
                    </div>
                  )}

                  {inviteMessage && (
                    <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                      {inviteMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={sendingInvite}
                    className="mt-5 rounded-lg bg-gold px-6 py-3 font-semibold text-navy hover:bg-gold-hover transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {sendingInvite ? "Sending Invite..." : "Send Invite"}
                  </button>
                </form>
              </div>
          </div>

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
