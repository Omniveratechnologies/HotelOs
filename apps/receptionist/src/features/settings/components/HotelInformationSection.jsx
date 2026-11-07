import { Input } from "@hotelos/ui/components";
import { useMyHotel } from "../hooks/useHotelSettings.js";

export default function HotelInformationSection() {
  const { hotel, isLoading: loading, error: loadError } = useMyHotel();

  return (
    <>
      {loading && (
        <div className="py-16 text-center text-sm text-gray-400">
          Loading settings...
        </div>
      )}
      {!loading && loadError && (
        <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {loadError}
        </div>
      )}
      {!loading && !loadError && (
        <div>
          <p className="mb-4 text-[10px] text-gray-400">
            Hotel details are managed by the Sub-Admin. You have read-only
            access.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Hotel Name" value={hotel?.name || ""} disabled />
            <Input label="Hotel Code" value={hotel?.hotelCode || ""} disabled />
            <Input label="Official Email" value={hotel?.email || ""} disabled />
            <Input
              label="Front Desk Phone"
              value={hotel?.phone || ""}
              disabled
            />
            <Input
              label="GSTIN (Tax ID)"
              value={hotel?.gstin || "Not configured"}
              disabled
            />
            <Input
              label="Default Tax / GST Rate"
              value={
                hotel?.taxPercent != null
                  ? `${hotel.taxPercent}%`
                  : "Not configured"
              }
              disabled
            />
            <Input
              label="Standard Check-in Time"
              value={hotel?.checkInTime || "Not configured"}
              disabled
            />
            <Input
              label="Standard Check-out Time"
              value={hotel?.checkOutTime || "Not configured"}
              disabled
            />
            <Input label="City" value={hotel?.city || ""} disabled />
            <Input label="State" value={hotel?.state || ""} disabled />
            <Input
              label="Pincode / Postal Code"
              value={hotel?.pincode || ""}
              disabled
            />
            <Input
              label="Guest Wi-Fi"
              value={
                hotel?.wifiNetworkName
                  ? `${hotel.wifiNetworkName}${hotel.wifiPassword ? ` (Key: ${hotel.wifiPassword})` : ""}`
                  : "Not configured"
              }
              disabled
            />
            <Input
              label="Address"
              value={hotel?.address || ""}
              disabled
              containerClassName="col-span-2"
            />
            {hotel?.cancellationPolicy && (
              <Input
                label="Standard Cancellation Policy"
                value={hotel.cancellationPolicy}
                disabled
                containerClassName="col-span-2"
              />
            )}
            {hotel?.termsAndConditions && (
              <Input
                label="House Rules & Terms of Stay (Printed on GRC)"
                value={hotel.termsAndConditions}
                disabled
                containerClassName="col-span-2"
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
