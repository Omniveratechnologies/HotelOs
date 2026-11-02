import { useCallback, useEffect, useRef, useState } from "react";
import { FiBarChart2, FiDownload, FiLock } from "react-icons/fi";

import Navbar from "../../components/ui/Navbar.jsx";
import Sidebar from "../../components/hamburger/SideBar.jsx";
import ActionButton from "../../components/ui/button/ActionButton.jsx";
import Toast from "../../components/ui/Toast.jsx";

import MonthlyReportCards from "../../components/reports/MonthlyReportCards.jsx";
import MonthlyReportFilters from "../../components/reports/MonthlyReportFilters.jsx";
import AttendanceTrendCard from "../../components/reports/AttendanceTrendCard.jsx";
import AttendanceDistributionCard from "../../components/reports/AttendanceDistributionCard.jsx";
import StaffAttendanceSummaryCard from "../../components/reports/StaffAttendanceSummaryCard.jsx";
import MonthlyDepartmentCard from "../../components/reports/MonthlyDepartmentCard.jsx";
import MonthlyDeviceCard from "../../components/reports/MonthlyDeviceCard.jsx";
import MonthlyStaffModal from "../../components/reports/MonthlyStaffModal.jsx";
import {
  api,
  currentMonthKey,
  downloadFromApi,
  formatDayMonth,
  formatMonthLabel,
  loadDeviceOptions,
  query,
  request,
} from "../../utils/monthlyReportUtils.js";

const defaults = () => ({
  month: currentMonthKey(),
  department: "",
  status: "",
  device: "",
});
const defaultTable = () => ({
  page: 1,
  limit: 10,
  sort: "name",
  direction: "asc",
  q: "",
});
const emptyPagination = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
  from: 0,
  to: 0,
};

const toParams = (f) => ({
  month: f.month,
  department_id: f.department,
  status: f.status,
  device_id: f.device,
});

const MonthlyAttendanceReport = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [draft, setDraft] = useState(defaults);
  const [applied, setApplied] = useState(defaults);
  const [table, setTable] = useState(defaultTable);
  const [searchInput, setSearchInput] = useState("");

  const [report, setReport] = useState(null);
  const [rows, setRows] = useState([]);
  const [rowsMonth, setRowsMonth] = useState(defaults().month);
  const [pagination, setPagination] = useState(emptyPagination);
  const [loading, setLoading] = useState(true);
  const [rowsLoading, setRowsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const [departments, setDepartments] = useState([]);
  const [deviceOptions, setDeviceOptions] = useState([]);

  const [detailRow, setDetailRow] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState(null);

  const closeToast = useCallback(() => setToast(null), []);
  const notify = useCallback(
    (message, type = "success") => setToast({ type, message }),
    [],
  );
  useEffect(() => {
    let cancelled = false;
    request("/staffManagement/departments")
      .then((res) => setDepartments(res.data || []))
      .catch(() => {});
    loadDeviceOptions().then((list) => !cancelled && setDeviceOptions(list));
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    api(
      `/monthly?${query({ month: applied.month, department_id: applied.department, device_id: applied.device })}`,
      { signal: controller.signal },
    )
      .then((res) => setReport(res.data))
      .catch((err) => {
        if (err.name === "AbortError") return;
        setReport(null);
        notify(err.message, "error");
      })
      .finally(() => !controller.signal.aborted && setLoading(false));
    return () => controller.abort();
  }, [applied, refreshKey, notify]);
  useEffect(() => {
    const controller = new AbortController();
    setRowsLoading(true);
    api(
      `/monthly/staff?${query({ ...toParams(applied), q: table.q, page: table.page, limit: table.limit, sort: table.sort, direction: table.direction })}`,
      { signal: controller.signal },
    )
      .then((res) => {
        setRows(res.data.map((row) => ({ ...row, _id: row.staff._id })));
        setRowsMonth(applied.month);
        setPagination(res.pagination);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setRows([]);
        setPagination(emptyPagination);
        notify(err.message, "error");
      })
      .finally(() => !controller.signal.aborted && setRowsLoading(false));
    return () => controller.abort();
  }, [applied, refreshKey, table, notify]);
  useEffect(() => {
    const timer = setTimeout(() => {
      const q = searchInput.trim();
      setTable((t) => (t.q === q ? t : { ...t, q, page: 1 }));
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(applied);
  const change = (key, value) => setDraft((d) => ({ ...d, [key]: value }));

  const apply = () => {
    if (!draft.month) return notify("Pick a month first.", "error");
    if (dirty) {
      setApplied(draft);
      setTable((t) => ({ ...t, page: 1 }));
    } else setRefreshKey((k) => k + 1);
  };

  const reset = () => {
    const fresh = defaults();
    setDraft(fresh);
    setApplied(fresh);
    setSearchInput("");
    setTable(defaultTable());
  };

  const sortBy = (field) =>
    setTable((t) => ({
      ...t,
      page: 1,
      sort: field,
      direction: t.sort === field && t.direction === "asc" ? "desc" : "asc",
    }));
  const exportReport = async () => {
    setExporting(true);
    try {
      await downloadFromApi(
        `/monthly/export?${query({ ...toParams(applied), q: table.q })}`,
        `monthly-attendance-${applied.month}.csv`,
      );
      notify("Monthly report exported");
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setExporting(false);
    }
  };
  const devices = deviceOptions.length
    ? deviceOptions
    : (report?.devices || [])
        .filter((d) => d._id)
        .map((d) => ({ _id: d._id, name: d.name }));

  const range = report?.range;
  const lock = report?.lock;

  return (
    <div className="relative h-screen overflow-hidden bg-[#0f0f0f] text-white">
      <Sidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

      <div
        className={`h-full overflow-y-auto transition-[margin] duration-300 ease-in-out ${isMenuOpen ? "ml-64" : "ml-0"}`}
      >
        <Navbar
          icon={<FiBarChart2 size={20} />}
          iconColor="text-emerald-400"
          bgColor="bg-emerald-950"
          title="Monthly Attendance Report"
          subtitle="View detailed attendance summary and analytics for the selected month."
          breadcrumb="Manage Staff → Reports → Monthly Report"
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          showPageHeading
          placeholder="Search staff, department, designation, etc.."
          pageAction={
            <ActionButton
              variant="outline"
              icon={<FiDownload size={14} />}
              onClick={exportReport}
              disabled={exporting || loading}
            >
              {exporting ? "Exporting..." : "Export Report"}
            </ActionButton>
          }
        />

        <main className="space-y-5 px-4 py-5">
          <MonthlyReportFilters
            draft={draft}
            departments={departments}
            devices={devices}
            dirty={dirty}
            loading={loading}
            onChange={change}
            onApply={apply}
            onReset={reset}
          />

          {(lock?.locked || range?.partial) && (
            <div className="flex flex-wrap items-center gap-3 text-[11px]">
              {range?.partial && (
                <span className="rounded-md border border-yellow-500/30 bg-yellow-500/10 px-2.5 py-1 text-yellow-300">
                  {formatMonthLabel(report.month)} is still running: showing{" "}
                  {formatDayMonth(range.from)} to {formatDayMonth(range.to)}.
                </span>
              )}
              {lock?.locked && (
                <span className="inline-flex items-center gap-1.5 rounded-md border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-blue-300">
                  <FiLock size={11} /> Locked for payroll
                  {lock.lockedBy?.name ? ` by ${lock.lockedBy.name}` : ""}
                </span>
              )}
            </div>
          )}

          <MonthlyReportCards kpis={report?.kpis} />

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="min-w-0 space-y-5">
              <AttendanceTrendCard
                month={applied.month}
                trend={report?.trend}
              />
              <StaffAttendanceSummaryCard
                rows={rows}
                pagination={pagination}
                loading={rowsLoading}
                limit={table.limit}
                sort={table.sort}
                direction={table.direction}
                search={searchInput}
                onSearch={setSearchInput}
                onSort={sortBy}
                onPageChange={(page) => setTable((t) => ({ ...t, page }))}
                onLimitChange={(limit) =>
                  setTable((t) => ({ ...t, limit, page: 1 }))
                }
                onOpen={(row) => setDetailRow({ ...row, month: rowsMonth })}
              />
            </div>

            <div className="min-w-0 space-y-5">
              <AttendanceDistributionCard distribution={report?.distribution} />
              <MonthlyDepartmentCard departments={report?.departments} />
              <MonthlyDeviceCard devices={report?.devices} />
            </div>
          </div>
        </main>
      </div>

      <MonthlyStaffModal row={detailRow} onClose={() => setDetailRow(null)} />
      <Toast toast={toast} onClose={closeToast} />
    </div>
  );
};

export default MonthlyAttendanceReport;
