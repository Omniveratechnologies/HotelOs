import { Save, ArrowRight, Pencil } from "lucide-react";
import { SummaryPanel, Button, InlineBanner } from "@hotelos/ui/components";
import { formatCurrency } from "@hotelos/utils";

/**
 * Sticky right-rail booking summary driven by the backend quote (no local
 * price math — figures come from `GET /bookings/quote`).
 *
 * @param {Object} props
 * @param {object|null} props.quote - Quote response ({ pricing, ratePlan, availability }).
 * @param {boolean} [props.quoteLoading]
 * @param {{ roomTypeName?: string, guestsLine?: string, datesLine?: string }} props.media - Summary media block.
 * @param {boolean} [props.editMode] - When editing an existing reservation.
 * @param {() => void} [props.onEdit] - Header edit link (jumps back to step 1).
 * @param {() => void} props.onSaveDraft
 * @param {() => void} props.onCreate
 * @param {boolean} [props.creating]
 * @param {boolean} [props.disabled] - Block create until the form is valid.
 * @param {string} props.cancellationNote - Policy line under the total.
 * @returns {React.ReactElement}
 */
export function BookingSummary({
  quote,
  quoteLoading = false,
  media,
  editMode = false,
  onEdit,
  onSaveDraft,
  onCreate,
  creating = false,
  disabled = false,
  cancellationNote = "Free cancellation up to 24 hours before check-in.",
}) {
  const items = [];
  const pricing = quote?.pricing;

  if (pricing) {
    items.push({
      label: `${formatCurrency(pricing.nightlyRate)} × ${pricing.nights} night${pricing.nights === 1 ? "" : "s"}${pricing.rooms > 1 ? ` × ${pricing.rooms} rooms` : ""}`,
      amount: formatCurrency(pricing.roomCharge),
    });
    if (pricing.addOnsTotal > 0) {
      items.push({
        label: "Add-ons & Packages",
        amount: formatCurrency(pricing.addOnsTotal),
      });
    }
    if (pricing.discount?.amount > 0) {
      items.push({
        label:
          pricing.discount.type === "percent"
            ? `Discount (${pricing.discount.value}%)`
            : "Discount",
        amount: `−${formatCurrency(pricing.discount.amount)}`,
        tone: "discount",
      });
    }
    items.push({
      label: `Taxes & Charges (${pricing.taxPercent}%)`,
      amount: formatCurrency(pricing.taxAmount),
    });
    if (pricing.commissionAmount != null) {
      items.push({
        label:
          `OTA Commission (${quote?.otaInfo?.commissionPercent ?? ""}%)`.replace(
            " (%)",
            "%)",
          ),
        amount: `−${formatCurrency(pricing.commissionAmount)}`,
        tone: "discount",
      });
    }
  }

  const availabilityWarn =
    quote?.availability && !quote.availability.ok
      ? `Only ${quote.availability.available} room(s) of this type left for these dates.`
      : null;

  return (
    <div className="xl:sticky xl:top-6">
      <SummaryPanel
        title="Booking Summary"
        action={
          onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="text-brand-700 hover:text-brand-900 inline-flex items-center gap-1 text-xs font-semibold"
            >
              <Pencil size={12} /> Edit
            </button>
          )
        }
        media={{
          title: media?.roomTypeName || "Select a room type",
          lines: [media?.guestsLine, media?.datesLine].filter(Boolean),
        }}
        items={items}
        total={
          pricing
            ? {
                label: "Total Amount",
                amount: formatCurrency(pricing.grandTotal),
              }
            : null
        }
        note={pricing ? cancellationNote : null}
        loading={quoteLoading}
        footer={
          <>
            {availabilityWarn && (
              <InlineBanner variant="warning">{availabilityWarn}</InlineBanner>
            )}
            <Button
              variant="secondary"
              className="w-full"
              icon={Save}
              onClick={onSaveDraft}
              disabled={creating}
            >
              Save as Draft
            </Button>
            <Button
              className="w-full"
              icon={ArrowRight}
              onClick={onCreate}
              loading={creating}
              disabled={disabled}
            >
              {editMode ? "Update Reservation →" : "Create Reservation →"}
            </Button>
          </>
        }
      />
    </div>
  );
}

export default BookingSummary;
