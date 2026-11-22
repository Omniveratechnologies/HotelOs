
import { useCallback, useEffect, useRef, useState } from "react";
import { FiDownload, FiFileText } from "react-icons/fi";

import Navbar from "../../components/ui/Navbar.jsx";
import Sidebar from "../../components/hamburger/SideBar.jsx";
import ActionButton from "../../components/ui/button/ActionButton.jsx";
import Toast from "../../components/ui/Toast.jsx";

import DailyReportCards from "../../components/reports/DailyReportCards.jsx";
import DailyReportFilters from "../../components/reports/DailyReportFilters.jsx";
import DailyRecordsCard from "../../components/reports/DailyRecordsCard.jsx";
import DailyRecordModal from "../../components/reports/DailyRecordModal.jsx";
import AttendanceOverviewCard from "../../components/reports/AttendanceOverviewCard.jsx";
import DepartmentWiseCard from "../../components/reports/DepartmentWiseCard.jsx";
import DeviceWiseCard from "../../components/reports/DeviceWiseCard.jsx";
import AttendanceInsightsCard from "../../components/reports/AttendanceInsightsCard.jsx";

import {
  api,
  downloadText,
  query,
  request,
  todayKey,
  toCsv,
} from "../../utils/dailyreportUtils.js";

const defaults = () => ({
  date: todayKey(),
  department: "",
  designation: "",
  status: "",
  device: "",
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
  date: f.date,
  department_id: f.department,
  designation_id: f.designation,
  status: f.status,
  device_id: f.device,
});

const DailyAttendanceReport = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [draft, setDraft] = useState(defaults);
  const [applied, setApplied] = useState(defaults);

  const [table, setTable] = useState({
    page: 1,
    limit: 10,
    sort: "checkInAt",
    direction: "asc",
  });

  const tableRef = useRef(table);
  tableRef.current = table;

  const [report, setReport] = useState(null);
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(emptyPagination);

  const [loading, setLoading] = useState(true);
  const [rowsLoading, setRowsLoading] = useState(false);

  const [refreshKey, setRefreshKey] = useState(0);

  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);

  const [selected, setSelected] = useState(() => new Set());
  const [detailRow, setDetailRow] = useState(null);

  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState(null);

  const rowsAbort = useRef(null);

  const closeToast = useCallback(() => setToast(null), []);

  const notify = useCallback(
    (message, type = "success") =>
      setToast({ type, message }),
    [],
  );

  useEffect(() => {
    request("/staffManagement/departments")
      .then((res) => setDepartments(res.data || []))
      .catch(() => {});

    request("/staffManagement/designations")
      .then((res) => setDesignations(res.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const { limit, sort, direction } = tableRef.current;

    setLoading(true);

    api(
      `/daily?${query({
        ...toParams(applied),
        page: 1,
        limit,
        sort,
        direction,
      })}`,
      { signal: controller.signal },
    )
      .then((res) => {
        setReport(res.data);
        setRows(res.data.records.rows);
        setPagination(res.data.records.pagination);

        setTable((t) => ({
          ...t,
          page: 1,
        }));

        setSelected(new Set());
      })
      .catch(
        (err) =>
          err.name !== "AbortError" &&
          notify(err.message, "error"),
      )
      .finally(
        () =>
          !controller.signal.aborted &&
          setLoading(false),
      );

    return () => controller.abort();
  }, [applied, refreshKey, notify]);

  const loadRows = useCallback(
    (next) => {
      rowsAbort.current?.abort();

      const controller = new AbortController();
      rowsAbort.current = controller;

      setTable(next);
      setRowsLoading(true);

      api(
        `/daily/records?${query({
          ...toParams(applied),
          page: next.page,
          limit: next.limit,
          sort: next.sort,
          direction: next.direction,
        })}`,
        { signal: controller.signal },
      )
        .then((res) => {
          setRows(res.data);
          setPagination(res.pagination);
        })
        .catch(
          (err) =>
            err.name !== "AbortError" &&
            notify(err.message, "error"),
        )
        .finally(
          () =>
            !controller.signal.aborted &&
            setRowsLoading(false),
        );
    },
    [applied, notify],
  );

  const dirty =
    JSON.stringify(draft) !== JSON.stringify(applied);

  const change = (key, value) =>
    setDraft((d) => ({
      ...d,
      [key]: value,
    }));

  const apply = () => {
    if (!draft.date) {
      return notify("Pick a date first.", "error");
    }

    if (dirty) {
      setApplied(draft);
    } else {
      setRefreshKey((k) => k + 1);
    }
  };

  const reset = () => {
    const fresh = defaults();

    setDraft(fresh);
    setApplied(fresh);
  };

  const sortBy = (field) =>
    loadRows({
      ...table,
      page: 1,
      sort: field,
      direction:
        table.sort === field && table.direction === "asc"
          ? "desc"
          : "asc",
    });

  const toggleRow = (id) =>
    setSelected((set) => {
      const next = new Set(set);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });

  const toggleAll = () =>
    setSelected((set) => {
      const next = new Set(set);

      const all =
        rows.length > 0 &&
        rows.every((row) => next.has(row._id));

      rows.forEach((row) =>
        all
          ? next.delete(row._id)
          : next.add(row._id),
      );

      return next;
    });

  const exportReport = async () => {
    setExporting(true);

    try {
      let all = [];
      let page = 1;
      let totalPages = 1;

      do {
        const res = await api(
          `/daily/records?${query({
            ...toParams(applied),
            page,
            limit: 100,
            sort: table.sort,
            direction: table.direction,
          })}`,
        );

        all = all.concat(res.data);

        totalPages = res.pagination.totalPages;
        page += 1;
      } while (page <= totalPages && page <= 60);

      const chosen = selected.size
        ? all.filter((row) => selected.has(row._id))
        : all;

      if (!chosen.length) {
        return notify(
          "Nothing to export for these filters.",
          "error",
        );
      }

      downloadText(
        `daily-attendance-${applied.date}.csv`,
        toCsv(chosen),
      );

      return notify(
        `${chosen.length} record${chosen.length === 1 ? "" : "s"} exported`,
      );
    } catch (err) {
      return notify(err.message, "error");
    } finally {
      setExporting(false);
    }
  };

  const devices = (report?.devices || [])
    .filter((d) => d._id)
    .map((d) => ({
      _id: d._id,
      name: d.name || d.deviceName || d.code || "Device",
    }));

  const visibleDesignations = draft.department
    ? designations.filter(
        (d) =>
          !d.departmentId ||
          String(
            d.departmentId?._id || d.departmentId,
          ) === draft.department,
      )
    : designations;

  return (
    <div className="relative h-screen overflow-hidden bg-[#0f0f0f] text-white">
      <Sidebar
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
      />

      <div
        className={`h-full overflow-y-auto transition-[margin] duration-300 ease-in-out ${
          isMenuOpen ? "ml-64" : "ml-0"
        }`}
      >
        <Navbar
          icon={<FiFileText size={20} />}
          iconColor="text-emerald-400"
          bgColor="bg-emerald-950"
          title="Daily Attendance Report"
          subtitle="View detailed attendance records for a selected date."
          breadcrumb="Manage Staff → Reports → Daily Report"
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
              {exporting
                ? "Exporting..."
                : selected.size
                  ? `Export ${selected.size} selected`
                  : "Export Report"}
            </ActionButton>
          }
        />

        <main className="space-y-5 px-4 py-5">
          <DailyReportCards kpis={report?.kpis} />

          <DailyReportFilters
            draft={draft}
            departments={departments}
            designations={visibleDesignations}
            devices={devices}
            dirty={dirty}
            loading={loading}
            onChange={change}
            onApply={apply}
            onReset={reset}
          />

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="min-w-0 space-y-5">
              <DailyRecordsCard
                rows={rows}
                pagination={pagination}
                loading={loading || rowsLoading}
                limit={table.limit}
                sort={table.sort}
                direction={table.direction}
                selected={selected}
                onToggle={toggleRow}
                onToggleAll={toggleAll}
                onSort={sortBy}
                onPageChange={(page) =>
                  loadRows({ ...table, page })
                }
                onLimitChange={(limit) =>
                  loadRows({
                    ...table,
                    limit,
                    page: 1,
                  })
                }
                onOpen={setDetailRow}
              />

              <AttendanceInsightsCard
                insights={report?.insights}
              />
            </div>

            <div className="min-w-0 space-y-5">
              <AttendanceOverviewCard
                overview={report?.overview}
              />

              <DepartmentWiseCard
                departments={report?.departments}
              />

              <DeviceWiseCard
                devices={report?.devices}
              />
            </div>
          </div>
        </main>
      </div>

      <DailyRecordModal
        row={detailRow}
        onClose={() => setDetailRow(null)}
      />

      <Toast
        toast={toast}
        onClose={closeToast}
      />
    </div>
  );
};

export default DailyAttendanceReport;
