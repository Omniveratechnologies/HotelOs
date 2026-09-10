import { AlertCircle, ShieldCheck } from "lucide-react";
import { DNDToggle } from "./DNDToggle";
import { useRoomClock } from "@/hooks/useRoomClock";
import { useGuestDashboard } from "@/context/useGuestDashboard";

export function DashboardHeader() {
  const { guest, guestState, refetchGuest, dnd, dndPending, toggleDND } =
    useGuestDashboard();
  const now = useRoomClock();

  if (guestState === "loading") {
    return (
      <header
        className="text-primary-foreground rounded-[1.75rem] p-6 shadow-[var(--shadow-raised)] sm:rounded-[2rem] sm:p-8"
        style={{ background: "var(--gradient-suite)" }}
      >
        <p className="text-primary-foreground/80 text-sm">
          Loading guest information…
        </p>
      </header>
    );
  }

  if (guestState === "error" || !guest) {
    return (
      <header
        className="text-primary-foreground flex items-center justify-between rounded-[1.75rem] p-6 shadow-[var(--shadow-raised)] sm:rounded-[2rem] sm:p-8"
        style={{ background: "var(--gradient-suite)" }}
      >
        <p className="flex items-center gap-2 text-sm">
          <AlertCircle className="size-4" aria-hidden="true" />
          Couldn't load guest information.
        </p>
        <button
          onClick={refetchGuest}
          className="text-sm font-semibold underline"
        >
          Retry
        </button>
      </header>
    );
  }

  return (
    <header
      className="text-primary-foreground relative min-h-[300px] overflow-hidden rounded-[1.25rem] p-5 shadow-[var(--shadow-raised)] sm:min-h-[350px] sm:p-7 lg:p-9"
      style={{
        backgroundImage:
          "linear-gradient(90deg, rgb(10 25 31 / 0.92) 0%, rgb(10 25 31 / 0.72) 48%, rgb(10 25 31 / 0.28) 100%), url(https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1800&q=85)",
        backgroundPosition: "center",
        backgroundSize: "cover",
      }}
    >
      <div className="relative z-10 flex flex-col gap-6">
        <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-start">
          <div className="flex items-center gap-3">
            <span className="border-brass/70 text-brass grid size-11 place-items-center rounded-full border">
              <ShieldCheck className="size-6" aria-hidden="true" />
            </span>
            <div>
              <p className="font-display text-lg leading-none">
                Grandview Hotel
              </p>
              <p className="text-primary-foreground/65 mt-1 text-[0.55rem] tracking-[0.2em] uppercase">
                Stay · Dine · Relax
              </p>
            </div>
          </div>
          <div className="text-primary-foreground/75 flex items-center gap-2 text-xs md:justify-center">
            <span className="font-semibold">
              Room {guest.room?.roomNumber ?? "--"}
            </span>
            <span className="text-primary-foreground/35">|</span>
            {now ? (
              <time dateTime={now.toISOString()}>
                {now.toLocaleDateString(undefined, {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
                {" · "}
                {now.toLocaleTimeString(undefined, {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
            ) : (
              "Loading room clock…"
            )}
          </div>
          <div className="flex flex-wrap items-start gap-2 md:justify-end">
            <DNDToggle
              enabled={dnd}
              pending={dndPending}
              onChange={toggleDND}
            />
          </div>
        </div>
        <div className="max-w-[620px] pt-2 sm:pt-8">
          <h1 className="font-display truncate text-[2.1rem] font-semibold sm:text-5xl lg:text-6xl">
            Welcome, {guest.name}
          </h1>
          <p className="text-primary-foreground/75 mt-2 text-sm sm:text-base">
            We&apos;re delighted to have you with us. How can we assist you
            today?
          </p>
        </div>
        <div className="absolute right-5 bottom-7 hidden max-w-[190px] sm:block lg:right-12">
          <p className="font-display text-2xl leading-[0.95] italic">
            A more comfortable stay, always.
          </p>
          <span className="bg-brass mt-4 block h-0.5 w-14" />
        </div>
      </div>
    </header>
  );
}
