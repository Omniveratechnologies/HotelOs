import { Clock, ShieldCheck } from "lucide-react";
import { DNDToggle } from "./DNDToggle";
import { useRoomClock } from "@/hooks/useRoomClock";
import { useGuestDashboard } from "@/context/GuestDashboardContext";

export function DashboardHeader() {
  const { room, guest, dnd, dndPending, toggleDND } = useGuestDashboard();
  const now = useRoomClock();

  return (
    <header
      className="flex flex-col gap-5 rounded-[1.75rem] p-6 text-primary-foreground shadow-[var(--shadow-raised)] sm:rounded-[2rem] sm:p-8 md:grid md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-6"
      style={{ background: "var(--gradient-suite)" }}
    >
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-primary-foreground/70 sm:text-xs">
          <ShieldCheck className="size-4 shrink-0" aria-hidden="true" /> {guest.tier} · Suite{" "}
          {room.roomNumber}
        </p>
        <h1 className="mt-3 truncate font-display text-[1.75rem] font-semibold sm:text-4xl lg:text-5xl">
          Welcome, {guest.name}
        </h1>
        <p className="mt-2 flex items-center gap-2 text-sm text-primary-foreground/80">
          <Clock className="size-4 shrink-0" aria-hidden="true" />
          {now ? (
            <time dateTime={now.toISOString()}>
              {now.toLocaleDateString(undefined, {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
              {" · "}
              {now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
            </time>
          ) : (
            <span>Loading room clock…</span>
          )}
        </p>
      </div>

      <DNDToggle enabled={dnd} pending={dndPending} onChange={toggleDND} />
    </header>
  );
}
