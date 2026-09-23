import { useMyHotel } from "../hooks/useHotelSettings.js";

const inputClass =
  "w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:border-primary-400 focus:ring-1 focus:ring-primary-400";
const disabledInputClass = inputClass + " bg-gray-50 text-gray-400";

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
            <div>
              <label className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                Hotel Name
              </label>
              <input
                value={hotel?.name || ""}
                disabled
                className={disabledInputClass}
              />
            </div>
            <div>
              <label className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                Email
              </label>
              <input
                value={hotel?.email || ""}
                disabled
                className={disabledInputClass}
              />
            </div>
            <div>
              <label className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                Phone
              </label>
              <input
                value={hotel?.phone || ""}
                disabled
                className={disabledInputClass}
              />
            </div>
            <div>
              <label className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                City
              </label>
              <input
                value={hotel?.city || ""}
                disabled
                className={disabledInputClass}
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                Address
              </label>
              <input
                value={hotel?.address || ""}
                disabled
                className={disabledInputClass}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
