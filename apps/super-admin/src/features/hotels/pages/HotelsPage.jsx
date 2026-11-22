import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router";
import { Plus, Search, Building2, ArrowRight } from "lucide-react";

import { Header, Button } from "@hotelos/ui/components";
import Badge from "../../../components/ui/Badge.jsx";
import { EmptyState, TableSkeleton } from "../../../components/ui/States.jsx";
import CreateHotelModal from "../components/CreateHotelModal.jsx";
import { useHotels } from "../hooks/useHotels.js";

function formatDate(date) {
  if (!date) {
    return "—";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return parsedDate.toLocaleDateString();
}

export default function HotelsPage() {
  const { hotels, isLoading: loading } = useHotels();
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = setTimeout(() => {
      setToast("");
    }, 3000);

    return () => clearTimeout(timer);
  }, [toast]);

  const filtered = useMemo(() => {
    if (!query.trim()) {
      return hotels;
    }

    const q = query.trim().toLowerCase();

    return hotels.filter((hotel) => {
      const name = hotel.name?.toLowerCase() || "";
      const email = hotel.email?.toLowerCase() || "";
      const city = hotel.city?.toLowerCase() || "";
      const state = hotel.state?.toLowerCase() || "";
      const gstin = hotel.gstin?.toLowerCase() || "";
      const hotelCode = hotel.hotelCode?.toLowerCase() || "";

      return (
        name.includes(q) ||
        email.includes(q) ||
        city.includes(q) ||
        state.includes(q) ||
        gstin.includes(q) ||
        hotelCode.includes(q)
      );
    });
  }, [hotels, query]);

  return (
    <>
      <Header
        pageTitle="Hotels"
        pageDescription={`${hotels.length} propert${
          hotels.length === 1 ? "y" : "ies"
        } on the platform`}
      >
        <Button icon={Plus} onClick={() => setCreateOpen(true)}>
          Create hotel
        </Button>
      </Header>

      <main className="flex-1 px-6 py-8 lg:px-10">
        {/* SEARCH */}
        <div className="mb-5 flex items-center gap-3">
          <div className="relative w-full max-w-sm">
            <Search
              size={16}
              className="text-brand-700/60 pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
            />

            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search hotels by name, email, city or code…"
              className="border-surface-200 text-brand-900 placeholder:text-brand-700/40 focus:border-primary-500 focus:ring-primary-500/15 w-full rounded-lg border bg-white py-2.5 pr-3 pl-9 text-sm outline-none focus:ring-2"
            />
          </div>
        </div>

        {/* LOADING / EMPTY / TABLE */}
        {loading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Building2}
            title={query ? "No hotels match your search" : "No hotels yet"}
            description={
              query
                ? "Try a different name, email, city or hotel code."
                : "Create your first hotel and invite its Sub Admin."
            }
            action={
              !query && (
                <Button icon={Plus} onClick={() => setCreateOpen(true)}>
                  Create hotel
                </Button>
              )
            }
          />
        ) : (
          <div className="border-surface-200 overflow-hidden rounded-2xl border bg-white shadow-xs">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-surface-200 text-brand-700/60 border-b text-xs font-semibold tracking-wide uppercase">
                  <th className="px-5 py-3.5 font-semibold">Hotel</th>
                  <th className="px-5 py-3.5 font-semibold">Email</th>
                  <th className="px-5 py-3.5 font-semibold">Status</th>
                  <th className="px-5 py-3.5 font-semibold">Hotel Code</th>
                  <th className="px-5 py-3.5 font-semibold">Created</th>
                  <th className="px-5 py-3.5 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-surface-200 divide-y">
                {filtered.map((hotel) => (
                  <tr
                    key={hotel._id}
                    className="hover:bg-background-50/60 group transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Link
                          to={`/hotels/${hotel._id}`}
                          className="bg-primary-100 text-primary-800 hover:bg-primary-200 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold transition-colors"
                        >
                          {hotel.name?.charAt(0)?.toUpperCase() || "H"}
                        </Link>

                        <div>
                          <Link
                            to={`/hotels/${hotel._id}`}
                            className="text-brand-900 group-hover:text-primary-700 block font-semibold transition-colors"
                          >
                            {hotel.name}
                          </Link>

                          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                            {(hotel.city || hotel.state) && (
                              <span className="text-brand-700/60 text-xs">
                                {[hotel.city, hotel.state]
                                  .filter(Boolean)
                                  .join(", ")}
                              </span>
                            )}
                            {hotel.taxPercent != null && (
                              <span className="inline-flex items-center rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                                GST {hotel.taxPercent}%
                              </span>
                            )}
                          </div>

                          {hotel.gstin && (
                            <span className="text-brand-700/60 mt-0.5 block font-mono text-[10px]">
                              GSTIN: {hotel.gstin}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="text-brand-700/60 px-5 py-4">
                      {hotel.email || "—"}
                    </td>

                    <td className="px-5 py-4">
                      <Badge
                        status={
                          hotel.status === "ACTIVE" ? "active" : "deactivated"
                        }
                      />
                    </td>

                    <td className="text-brand-900 px-5 py-4 font-semibold">
                      <span className="block">{hotel.hotelCode || "—"}</span>
                      <span className="text-brand-700/60 block font-mono text-xs">
                        {hotel.aiosellHotelCode
                          ? `Aiosell: ${hotel.aiosellHotelCode}`
                          : ""}
                      </span>
                    </td>

                    <td className="text-brand-700/60 px-5 py-4 font-mono text-xs">
                      {formatDate(hotel.createdAt)}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <Link
                        to={`/hotels/${hotel._id}`}
                        className="border-surface-200 text-brand-700 hover:bg-background-50 hover:text-brand-900 hover:border-brand-300 inline-flex items-center gap-1.5 rounded-lg border bg-white px-3 py-1.5 text-xs font-semibold shadow-2xs transition-all"
                      >
                        Manage Hotel
                        <ArrowRight size={13} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <CreateHotelModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(_hotel, { invited = false } = {}) => {
          setToast(
            invited
              ? "Hotel created and Sub Admin invitation sent."
              : "Hotel created successfully.",
          );
        }}
      />

      {toast && (
        <div className="bg-brand-950 fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </>
  );
}
