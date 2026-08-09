import { Banknote, Check, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PaymentMethod } from "@/types/guest-dashboard";

const PAYMENT_OPTIONS: {
  method: PaymentMethod;
  label: string;
  hint: string;
  icon: typeof Banknote;
}[] = [
  { method: "cod", label: "Cash on Delivery", hint: "Pay the attendant", icon: Banknote },
  { method: "online", label: "Pay Online", hint: "Charged to your suite", icon: CreditCard },
];

export function PaymentChoice({
  value,
  onChange,
}: {
  value: PaymentMethod;
  onChange: (value: PaymentMethod) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
        Payment
      </legend>
      <div role="radiogroup" aria-label="Payment method" className="grid gap-3 sm:grid-cols-2">
        {PAYMENT_OPTIONS.map((option) => {
          const active = value === option.method;
          return (
            <button
              key={option.method}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(option.method)}
              className={cn(
                "flex min-h-[4.25rem] items-center gap-3 rounded-2xl border p-4 text-left transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                active
                  ? "border-primary bg-primary/8 shadow-[var(--shadow-card)]"
                  : "border-border bg-card hover:border-brass",
              )}
            >
              <span
                className={cn(
                  "grid size-10 shrink-0 place-items-center rounded-xl",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-accent text-accent-foreground",
                )}
              >
                <option.icon className="size-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{option.label}</span>
                <span className="block truncate text-sm text-muted-foreground">{option.hint}</span>
              </span>
              {active ? (
                <Check className="size-5 shrink-0 animate-pop text-primary" aria-hidden="true" />
              ) : null}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
