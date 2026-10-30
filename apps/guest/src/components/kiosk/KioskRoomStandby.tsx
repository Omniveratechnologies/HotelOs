import { ShieldCheck, Wifi, PhoneCall, Sparkles, Clock } from "lucide-react";
import { useRoomClock } from "@/hooks/useRoomClock";

interface KioskRoomStandbyProps {
  roomNumber?: string | null;
  roomType?: string | null;
  hotelName?: string | null;
  onRefreshSession: () => void;
}

export function KioskRoomStandby({
  roomNumber,
  roomType,
  hotelName,
  onRefreshSession,
}: KioskRoomStandbyProps) {
  const now = useRoomClock();

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col justify-between p-6 sm:p-10 lg:p-14">
      {/* Top Header */}
      <header className="border-border/50 flex flex-wrap items-center justify-between gap-4 border-b pb-6">
        <div className="flex items-center gap-3.5">
          <span className="border-brass/70 text-brass bg-brass/10 grid size-12 place-items-center rounded-2xl border">
            <ShieldCheck className="size-7" aria-hidden="true" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">
              {hotelName || "HotelOS Luxury Suites"}
            </h1>
            <p className="text-muted-foreground text-xs tracking-widest uppercase">
              In-Room Digital Concierge & Assistant
            </p>
          </div>
        </div>

        {/* Live Clock & Room Badge */}
        <div className="flex items-center gap-4">
          <div className="border-border bg-card/60 flex items-center gap-2 rounded-xl border px-4 py-2 text-sm shadow-xs">
            <Clock className="text-brass size-4" />
            <time
              dateTime={now?.toISOString()}
              className="text-foreground font-medium"
            >
              {now ? (
                <>
                  {now.toLocaleDateString(undefined, {
                    weekday: "short",
                    day: "2-digit",
                    month: "short",
                  })}{" "}
                  ·{" "}
                  {now.toLocaleTimeString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </>
              ) : (
                "Connecting..."
              )}
            </time>
          </div>

          <div className="border-brass/40 bg-brass/15 text-foreground rounded-xl border px-4 py-2 text-sm font-bold">
            Room {roomNumber || "--"}
            {roomType ? ` · ${roomType}` : ""}
          </div>
        </div>
      </header>

      {/* Hero Welcome & Standby Banner */}
      <main className="mx-auto my-auto max-w-4xl py-12 text-center">
        <div className="border-brass/50 bg-brass/10 text-foreground inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold">
          <span className="bg-brass size-2 animate-pulse rounded-full" />
          In-Room Suite Terminal · Standby Mode
        </div>

        <h2 className="font-display text-foreground mt-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Welcome to Room {roomNumber || "Your Suite"}
        </h2>

        <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-base sm:text-lg">
          This digital concierge will automatically activate as soon as you
          complete check-in. Enjoy 24-hour in-room dining, fresh towels and
          luxury amenities, instant housekeeping, and direct front desk
          communication right from this tablet.
        </p>

        {/* Info Cards Grid */}
        <div className="mt-10 grid grid-cols-1 gap-4 text-left sm:grid-cols-3">
          <div className="border-border bg-card/75 rounded-2xl border p-5 shadow-xs">
            <div className="text-foreground flex items-center gap-2.5 font-semibold">
              <Sparkles className="text-brass size-4" />
              <span>Automatic Activation</span>
            </div>
            <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
              Checked in at the lobby front desk or self-check-in kiosk? This
              terminal will switch to your suite dashboard automatically.
            </p>
          </div>

          <div className="border-border bg-card/75 rounded-2xl border p-5 shadow-xs">
            <div className="text-foreground flex items-center gap-2.5 font-semibold">
              <Wifi className="text-brass size-4" />
              <span>Complimentary Wi-Fi</span>
            </div>
            <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
              Connect to our high-speed guest network throughout the hotel and
              your suite during your stay.
            </p>
          </div>

          <div className="border-border bg-card/75 rounded-2xl border p-5 shadow-xs">
            <div className="text-foreground flex items-center gap-2.5 font-semibold">
              <PhoneCall className="text-brass size-4" />
              <span>Front Desk Support</span>
            </div>
            <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
              Need assistance or early check-in? Dial 0 from your in-suite
              telephone or visit the lobby desk anytime 24/7.
            </p>
          </div>
        </div>

        {/* Manual Refresh / Re-check button */}
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={onRefreshSession}
            className="border-border hover:bg-accent bg-card inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold transition"
          >
            Check Stay Status
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-border/50 text-muted-foreground flex flex-wrap items-center justify-between gap-4 border-t pt-6 text-xs">
        <p>
          © {new Date().getFullYear()} {hotelName || "HotelOS"}. All rights
          reserved.
        </p>
        <p className="tracking-wide">Touchscreen Suite Tablet Terminal</p>
      </footer>
    </div>
  );
}
