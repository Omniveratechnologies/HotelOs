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
            <Input label="Email" value={hotel?.email || ""} disabled />
            <Input label="Phone" value={hotel?.phone || ""} disabled />
            <Input label="City" value={hotel?.city || ""} disabled />
            <Input
              label="Address"
              value={hotel?.address || ""}
              disabled
              containerClassName="col-span-2"
            />
          </div>
        </div>
      )}
    </>
  );
}
