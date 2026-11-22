import { useCallback, useEffect, useState } from "react";
import { FiCalendar, FiDownload } from "react-icons/fi";

import Navbar from "../../components/ui/Navbar.jsx";
import Sidebar from "../../components/hamburger/SideBar.jsx";
import ActionButton from "../../components/ui/button/ActionButton.jsx";
import Toast from "../../components/ui/Toast.jsx";

import AttendanceStatusCards from "../../components/attendance/AttendanceStatusCard.jsx";
import AttendanceFilters from "../../components/attendance/AttendanceFilters.jsx";
import AttendanceTable from "../../components/attendance/AttendanceTable.jsx";
import AttendanceTrendChart from "../../components/attendance/AttendanceTrendChart.jsx";
import AttendanceStatusBreakdown from "../../components/attendance/AttendanceStatusBreakdown.jsx";
import RecentActivities from "../../components/attendance/RecentActivities.jsx";
import AttendanceDetailsModal from "../../components/attendance/AttendanceDetailsModal.jsx";
import AttendanceCorrectionModal from "../../components/attendance/AttendanceCorrectionModal.jsx";

import {
  downloadAttendanceCsv,
  fetchAttendance,
  fetchAttendanceActivity,
  fetchAttendanceStats,
  fetchAttendanceTrend,
} from "../../services/attendanceApi.js";
import { fetchDepartments } from "../../services/departmentApi.js";
import { fetchDesignations } from "../../services/designationApi.js";
import { useIsWide } from "../../hooks/useIsWide.js";
import { monthStartKey, todayKey } from "../../utils/attendanceFormat.js";

// The page opens on "this month so far"; Clear Filters goes back to it.
const defaultFilters = () => ({
  from: monthStartKey(),
  to: todayKey(),
  department_id: "",
  designation_id: "",
  status: "",
  q: "",
});

const AttendanceHistory = () => {
  // Side column (trend / breakdown / activities) sits beside the table from 1360px up.
  const isWide = useIsWide("(min-width: 1360px)");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // draft = what is typed in the filter card, applied = what the page is showing
  const [draft, setDraft] = useState(defaultFilters);
  const [applied, setApplied] = useState(defaultFilters);
  const [filterError, setFilterError] = useState("");

  const [view, setView] = useState({
    page: 1,
    limit: 10,
    sort: "date",
    direction: "desc",
  });

  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [stats, setStats] = useState(null);
  const [trend, setTrend] = useState(null);
  const [trendDays, setTrendDays] = useState(30);
  const [trendError, setTrendError] = useState("");
  const [trendLoading, setTrendLoading] = useState(true);
  const [activities, setActivities] = useState([]);
  const [activityError, setActivityError] = useState("");

  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [viewing, setViewing] = useState(null);
  const [correcting, setCorrecting] = useState(null);
  const [toast, setToast] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => setRefreshKey((key) => key + 1);
  const closeToast = useCallback(() => setToast(null), []);
  const showToast = (type, message) => setToast({ type, message });

  // ------------------------------------------------------------ data

  // The table
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");

    fetchAttendance({ ...applied, ...view }, controller.signal)
      .then((body) => {
        const next = body.pagination || {
          page: 1,
          limit: view.limit,
          total: 0,
          totalPages: 1,
        };
        setRecords(body.data || []);
        setPagination(next);
        setSelectedIds(new Set());

        // the last page vanished (records were removed): step back
        if (
          (body.data || []).length === 0 &&
          next.total > 0 &&
          view.page > next.totalPages
        ) {
          setView((previous) => ({ ...previous, page: next.totalPages }));
        }
      })
      .catch((requestError) => {
        if (requestError.name !== "AbortError") setError(requestError.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [applied, view, refreshKey]);

  // The cards and the donut (same filters as the table)
  useEffect(() => {
    const controller = new AbortController();

    fetchAttendanceStats(applied, controller.signal)
      .then(setStats)
      .catch((requestError) => {
        if (requestError.name !== "AbortError") setStats(null);
      });

    return () => controller.abort();
  }, [applied, refreshKey]);

  // The trend follows the department filter, and has its own period
  useEffect(() => {
    const controller = new AbortController();
    setTrendLoading(true);
    setTrendError("");

    fetchAttendanceTrend(
      { days: trendDays, department_id: applied.department_id },
      controller.signal,
    )
      .then(setTrend)
      .catch((requestError) => {
        if (requestError.name !== "AbortError")
          setTrendError(requestError.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setTrendLoading(false);
      });

    return () => controller.abort();
  }, [trendDays, applied.department_id, refreshKey]);

  useEffect(() => {
    setActivityError("");
    fetchAttendanceActivity(5)
      .then(setActivities)
      .catch((requestError) => setActivityError(requestError.message));
  }, [refreshKey]);

  // Dropdown options (once)
  useEffect(() => {
    fetchDepartments({ status: "ALL", limit: 100 })
      .then((body) => setDepartments(body.data || []))
      .catch((requestError) => showToast("error", requestError.message));

    fetchDesignations({ status: "ALL", limit: 500 })
      .then((body) => setDesignations(body.data || []))
      .catch((requestError) => showToast("error", requestError.message));
  }, []);

  // ------------------------------------------------------------ handlers

  const handleDraftChange = (name, value) =>
    setDraft((previous) => ({
      ...previous,
      [name]: value,
      // a designation that belongs to another department is no longer valid
      ...(name === "department_id" ? { designation_id: "" } : {}),
    }));

  const applyFilters = () => {
    if (draft.from && draft.to && draft.from > draft.to) {
      setFilterError("The start date is after the end date.");
      return;
    }

    setFilterError("");
    setApplied({ ...draft, q: draft.q.trim() });
    setView((previous) => ({ ...previous, page: 1 }));
  };

  const clearFilters = () => {
    const fresh = defaultFilters();
    setFilterError("");
    setDraft(fresh);
    setApplied(fresh);
    setView((previous) => ({ ...previous, page: 1 }));
  };

  const handleSort = (key) =>
    setView((previous) => ({
      ...previous,
      sort: key,
      direction:
        previous.sort === key && previous.direction === "desc" ? "asc" : "desc",
      page: 1,
    }));

  // "View All" next to the recent activities: show only today
  const showToday = () => {
    const today = { ...defaultFilters(), from: todayKey(), to: todayKey() };
    setDraft(today);
    setApplied(today);
    setView((previous) => ({
      ...previous,
      page: 1,
      sort: "date",
      direction: "desc",
    }));
  };

  const handleExport = async () => {
    try {
      await downloadAttendanceCsv(applied);
      showToast("success", "Attendance exported");
    } catch (requestError) {
      showToast("error", requestError.message);
    }
  };

  const handleSaved = () => {
    setCorrecting(null);
    setViewing(null);
    showToast("success", "Attendance corrected");
    refresh();
  };

  const hasActiveFilters = Boolean(
    applied.department_id ||
    applied.designation_id ||
    applied.status ||
    applied.q ||
    applied.from !== defaultFilters().from ||
    applied.to !== defaultFilters().to,
  );

  // ------------------------------------------------------------ view

  return (
    <div className="relative h-screen overflow-hidden bg-[#0f0f0f] text-white">
      <Sidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

      <div
        className={`h-full overflow-y-auto transition-[margin] duration-300 ease-in-out ${
          isMenuOpen ? "ml-64" : "ml-0"
        }`}
      >
        <Navbar
          icon={<FiCalendar />}
          iconColor="text-emerald-500"
          bgColor="bg-emerald-500/10"
          title="Attendance History"
          subtitle="View and manage historical attendance records of all staff members."
          breadcrumb="Manage Staff → Attendance → Attendance History"
          placeholder="Search staff, department, designation..."
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          showPageHeading
          pageAction={
            <ActionButton
              variant="outline"
              icon={<FiDownload size={14} />}
              onClick={handleExport}
            >
              Export
            </ActionButton>
          }
        />

        <main className="space-y-5 px-4 py-5">
          <AttendanceStatusCards stats={stats} />

          <div
            className={
              isWide
                ? "grid grid-cols-[minmax(0,1fr)_320px] items-start gap-5"
                : "space-y-5"
            }
          >
            <div className="min-w-0 space-y-5">
              <AttendanceFilters
                values={draft}
                onChange={handleDraftChange}
                onApply={applyFilters}
                onClear={clearFilters}
                departments={departments}
                designations={designations}
                error={filterError}
              />

              <div className="overflow-hidden rounded-xl border border-gray-800 bg-[#111111]">
                <AttendanceTable
                  records={records}
                  loading={loading}
                  error={error}
                  onRetry={refresh}
                  pagination={pagination}
                  onPageChange={(page) =>
                    setView((previous) => ({ ...previous, page }))
                  }
                  onLimitChange={(limit) =>
                    setView((previous) => ({ ...previous, limit, page: 1 }))
                  }
                  hasActiveFilters={hasActiveFilters}
                  sortBy={view.sort}
                  sortDirection={view.direction}
                  onSort={handleSort}
                  selectedIds={selectedIds}
                  onSelectionChange={setSelectedIds}
                  onView={setViewing}
                  onCorrect={setCorrecting}
                />
              </div>
            </div>

            <div
              className={
                isWide
                  ? "min-w-0 space-y-5"
                  : "grid min-w-0 gap-5 md:grid-cols-2 xl:grid-cols-3"
              }
            >
              <AttendanceTrendChart
                trend={trend}
                loading={trendLoading}
                error={trendError}
                days={trendDays}
                onDaysChange={setTrendDays}
              />
              <AttendanceStatusBreakdown stats={stats} />
              <RecentActivities
                activities={activities}
                error={activityError}
                onViewAll={showToday}
              />
            </div>
          </div>
        </main>
      </div>

      <AttendanceDetailsModal
        open={Boolean(viewing)}
        record={viewing}
        onClose={() => setViewing(null)}
        onCorrect={(row) => {
          setViewing(null);
          setCorrecting(row);
        }}
      />

      <AttendanceCorrectionModal
        open={Boolean(correcting)}
        record={correcting}
        onClose={() => setCorrecting(null)}
        onSaved={handleSaved}
      />

      <Toast toast={toast} onClose={closeToast} />
    </div>
  );
};

export default AttendanceHistory;
