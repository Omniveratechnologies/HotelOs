import { Headphones, KeyRound, Copy, Wifi } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useGuestDashboard } from "@/context/useGuestDashboard";

export function WifiCard() {
  const { guest } = useGuestDashboard();
  const [copied, setCopied] = useState(false);
  const networkName = guest?.wifi?.networkName ?? "Not available";
  const password = guest?.wifi?.password ?? "Not available";

  const copyPassword = async () => {
    if (!guest?.wifi?.password) return;
    await navigator.clipboard.writeText(guest.wifi.password);
    setCopied(true);
    toast.success("Wi-Fi password copied");
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <aside className="flex flex-col gap-3">
      <section
        className="relative min-h-[122px] overflow-hidden rounded-2xl p-5 text-white shadow-[var(--shadow-card)]"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgb(12 25 29 / 0.92), rgb(12 25 29 / 0.38)), url(https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=85)",
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      >
        <div className="relative z-10 max-w-[250px]">
          <p className="font-display text-xl leading-none italic">
            Make your stay more special
          </p>
          <p className="mt-2 text-xs text-white/75">
            Explore our services, experiences and exclusive offers.
          </p>
          <button
            type="button"
            className="mt-3 rounded-full bg-white px-4 py-1.5 text-xs font-bold text-slate-800"
          >
            View Offers
          </button>
        </div>
      </section>

      <section className="border-border bg-card rounded-2xl border p-4 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-full bg-sky-100 text-sky-700">
            <Wifi className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-sm font-bold">Wi-Fi</h2>
            <p className="text-muted-foreground text-xs">{networkName}</p>
          </div>
        </div>
        <div className="border-border mt-3 flex items-center justify-between border-t pt-3 text-xs">
          <span className="text-muted-foreground">
            Password: <strong className="text-foreground">{password}</strong>
          </span>
          <button
            type="button"
            onClick={() => void copyPassword()}
            disabled={!guest?.wifi?.password}
            className="border-border flex items-center gap-1 rounded-lg border px-2.5 py-1.5 font-semibold"
          >
            <Copy className="size-3.5" aria-hidden="true" />{" "}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </section>

      <section className="border-border bg-card flex items-center gap-3 rounded-2xl border p-4 shadow-[var(--shadow-card)]">
        <span className="grid size-10 place-items-center rounded-full bg-slate-100 text-slate-700">
          <Headphones className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-bold">Need help?</h2>
          <p className="text-muted-foreground truncate text-xs">
            Call Reception (0) or tap here
          </p>
        </div>
        <KeyRound
          className="text-muted-foreground ml-auto size-4 shrink-0"
          aria-hidden="true"
        />
      </section>
    </aside>
  );
}
