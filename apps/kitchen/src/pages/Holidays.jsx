import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FiCalendar, FiPlus } from "react-icons/fi";

import Navbar from "../components/ui/Navbar.jsx";
import Sidebar from "../components/hamburger/SideBar.jsx";
import ActionButton from "../components/ui/button/ActionButton.jsx";
import Toast from "../components/ui/Toast.jsx";

import HolidayStatusCards from "../components/holidays/HolidayStatusCards.jsx";
import HolidayFilters from "../components/holidays/HolidayFilters.jsx";
import HolidayListCard from "../components/holidays/HolidayListCard.jsx";
import HolidayCalendarCard from "../components/holidays/HolidayCalendarCard.jsx";
import UpcomingHolidaysCard from "../components/holidays/UpcomingHolidaysCard.jsx";
import HolidayFormModal from "../components/holidays/HolidayFormModal.jsx";
import HolidayDeleteDialog from "../components/holidays/HolidayDeleteDialog.jsx";
import useDebounce from "../hooks/useDebounce.js";
import { api, del, localToday, post, query } from "../utils/holidayUtils.js";

const initialFilters = (year) => ({ type: "", status: "", year: String(year) });

const Holidays = () => {
  const today = useMemo(localToday, []);
  const thisYear = Number(today.slice(0, 4));
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [filters, setFilters] = useState(() => initialFilters(thisYear));
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput.trim(), 350);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [month, setMonth] = useState(today.slice(0, 7));

  const [summary, setSummary] = useState(null);
  const [list, setList] = useState({
    rows: [],
    pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
  });
  const [calendar, setCalendar] = useState(null);
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const [toast, setToast] = useState(null);
  const [formHoliday, setFormHoliday] = useState(undefined);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const listRef = useRef(null);
  const closeToast = useCallback(() => setToast(null), []);
  const reload = useCallback(() => setRefreshKey((key) => key + 1), []);
  const notify = useCallback(
    (message, type = "success") => setToast({ type, message }),
    [],
  );

  useEffect(() => {
    const controller = new AbortController();
    api(`/summary?${query({ year: filters.year })}`, {
      signal: controller.signal,
    })
      .then((res) => setSummary(res.data))
      .catch((err) => {
        if (err.name !== "AbortError") notify(err.message, "error");
      });
    return () => controller.abort();
  }, [filters.year, refreshKey, notify]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    api(
      `/?${query({ year: filters.year, type: filters.type, status: filters.status, q: search, page, limit })}`,
      { signal: controller.signal },
    )
      .then((res) => setList({ rows: res.data, pagination: res.pagination }))
      .catch((err) => {
        if (err.name !== "AbortError") notify(err.message, "error");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [filters, search, page, limit, refreshKey, notify]);

  useEffect(() => {
    const controller = new AbortController();
    setCalendarLoading(true);
    api(`/calendar?${query({ month })}`, { signal: controller.signal })
      .then((res) => setCalendar(res.data))
      .catch((err) => {
        if (err.name !== "AbortError") notify(err.message, "error");
      })
      .finally(() => {
        if (!controller.signal.aborted) setCalendarLoading(false);
      });
    return () => controller.abort();
  }, [month, refreshKey, notify]);

  useEffect(() => {
    const controller = new AbortController();
    api("/upcoming?limit=5", { signal: controller.signal })
      .then((res) => setUpcoming(res.data))
      .catch((err) => {
        if (err.name !== "AbortError") notify(err.message, "error");
      });
    return () => controller.abort();
  }, [refreshKey, notify]);

  const updateFilter = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  const resetFilters = () => {
    setFilters(initialFilters(thisYear));
    setSearchInput("");
    setPage(1);
  };

  const viewAllUpcoming = () => {
    setFilters({ type: "", status: "UPCOMING", year: String(thisYear) });
    setSearchInput("");
    setPage(1);
    requestAnimationFrame(() =>
      listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  };

  const saved = (message) => {
    setFormHoliday(undefined);
    notify(message);
    reload();
  };

  const confirmDelete = async (scope) => {
    setDeleting(true);
    try {
      await del(`/${deleteTarget._id}?${query({ scope })}`);
      notify(`${deleteTarget.name} deleted`);
      reload();
      setDeleteTarget(null);
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setDeleting(false);
    }
  };

  const seedNational = async () => {
    setSeeding(true);
    try {
      const res = await post("/seed-national", { year: Number(filters.year) });
      notify(res.message);
      reload();
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setSeeding(false);
    }
  };

  const years = summary?.years || [Number(filters.year)];
  const noFilters = !filters.type && !filters.status && !search;

  return (
    <div className="relative h-screen overflow-hidden bg-[#0f0f0f] text-white">
      <Sidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

      <div
        className={`h-full overflow-y-auto transition-[margin] duration-300 ease-in-out ${isMenuOpen ? "ml-64" : "ml-0"}`}
      >
        <Navbar
          icon={<FiCalendar size={20} />}
          iconColor="text-emerald-400"
          bgColor="bg-emerald-950"
          title="Holidays"
          subtitle="Manage public holidays and custom holidays for your hotel."
          breadcrumb="Manage Staff → Holidays"
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          placeholder="Search staff, department, designation, etc.."
          showPageHeading
          pageAction={
            <ActionButton
              icon={<FiPlus size={14} />}
              onClick={() => setFormHoliday(null)}
            >
              Add Holiday
            </ActionButton>
          }
        />

        <main className="space-y-5 px-4 py-5">
          <HolidayStatusCards summary={summary} />

          <HolidayFilters
            filters={filters}
            searchInput={searchInput}
            onSearchChange={(value) => {
              setSearchInput(value);
              setPage(1);
            }}
            years={years}
            onFilterChange={updateFilter}
            onReset={resetFilters}
          />

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <HolidayListCard
              sectionRef={listRef}
              holidays={list.rows}
              pagination={list.pagination}
              page={page}
              limit={limit}
              loading={loading}
              noHolidaysAtAll={noFilters && summary?.stats.total === 0}
              seeding={seeding}
              onPageChange={setPage}
              onLimitChange={(value) => {
                setLimit(value);
                setPage(1);
              }}
              onEdit={setFormHoliday}
              onDelete={setDeleteTarget}
              onSeedNational={seedNational}
            />

            <div className="min-w-0 space-y-5">
              <HolidayCalendarCard
                calendar={calendar}
                month={month}
                onMonthChange={setMonth}
                loading={calendarLoading}
              />
              <UpcomingHolidaysCard
                rows={upcoming}
                loading={loading}
                onViewAll={viewAllUpcoming}
              />
            </div>
          </div>
        </main>
      </div>

      {formHoliday !== undefined && (
        <HolidayFormModal
          key={formHoliday?._id || "new"}
          holiday={formHoliday}
          onClose={() => setFormHoliday(undefined)}
          onSaved={saved}
        />
      )}
      <HolidayDeleteDialog
        holiday={deleteTarget}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <Toast toast={toast} onClose={closeToast} />
    </div>
  );
};

export default Holidays;
