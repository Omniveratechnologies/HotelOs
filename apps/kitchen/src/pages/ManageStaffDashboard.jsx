import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiCalendar, FiHome, FiPlus } from "react-icons/fi";

import Navbar from "../components/ui/Navbar.jsx";
import Sidebar from "../components/hamburger/SideBar.jsx";
import ActionButton from "../components/ui/button/ActionButton.jsx";
import Toast from "../components/ui/Toast.jsx";

import DashboardCards from "../components/staffManagementDashboard/DashboardCards.jsx";
import AttendanceOverviewChart from "../components/staffManagementDashboard/AttendanceOverviewChart.jsx";
import DepartmentStaffCard from "../components/staffManagementDashboard/DepartmentStaffCard.jsx";
import TodayStatusCard from "../components/staffManagementDashboard/TodayStatusCard.jsx";
import RecentAttendanceCard from "../components/staffManagementDashboard/RecentAttendanceCard.jsx";
import QuickActionsCard from "../components/staffManagementDashboard/QuickActionCard.jsx";
import DeviceStatusCard from "../components/staffManagementDashboard/DeviceStatusCard.jsx";
import DailyRecordModal from "../components/reports/DailyRecordModal.jsx";
import {
  ROUTES,
  adminName,
  formatLongDate,
  greeting,
  inputCls,
  loadDashboard,
  todayKey,
} from "../utils/dashboardUtils.js";

const REFRESH_MS = 60_000;

const ManageStaffDashboard = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [date, setDate] = useState(todayKey);
  const [range, setRange] = useState("week");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  const [detailRow, setDetailRow] = useState(null);
  const [toast, setToast] = useState(null);
  const closeToast = useCallback(() => setToast(null), []);
  const firstLoad = useRef(true);
  const silent = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    const quiet = silent.current;
    silent.current = false;
    if (!quiet) setLoading(true);
    loadDashboard({ date, range }, { signal: controller.signal })
      .then((res) => {
        setData(res.data);
        setError("");
        setNow(Date.now());
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setError(err.message);
        if (!firstLoad.current)
          setToast({ type: "error", message: err.message });
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
          firstLoad.current = false;
        }
      });
    return () => controller.abort();
  }, [date, range, reload]);

  useEffect(() => {
    const timer = setInterval(() => {
      silent.current = true;
      setReload((k) => k + 1);
    }, REFRESH_MS);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(tick);
  }, []);

  const go = (key) => navigate(ROUTES[key]);
  const viewing = data?.date || date;

  return (
    <div className="relative h-screen overflow-hidden bg-[#0f0f0f] text-white">
      <Sidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

      <div
        className={`h-full overflow-y-auto transition-[margin] duration-300 ease-in-out ${isMenuOpen ? "ml-64" : "ml-0"}`}
      >
        <Navbar
          icon={<FiHome size={20} />}
          iconColor="text-emerald-400"
          bgColor="bg-emerald-950"
          title="Dashboard"
          subtitle={`${greeting()}, ${adminName()}! Here's ${viewing === todayKey() ? "today's" : `${formatLongDate(viewing)}'s`} overview of your hotel staff.`}
          breadcrumb=""
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          showPageHeading
          placeholder="Search staff, department, designation, etc.."
          pageAction={
            <div className="flex flex-wrap items-center gap-2">
              <label className="relative inline-flex items-center">
                <FiCalendar
                  size={14}
                  className="pointer-events-none absolute left-3 text-gray-400"
                />
                <input
                  type="date"
                  value={date}
                  max={todayKey()}
                  onChange={(e) => e.target.value && setDate(e.target.value)}
                  aria-label="Dashboard date"
                  className={`${inputCls} h-10 w-[170px] pl-9`}
                />
              </label>
              <ActionButton
                icon={<FiPlus size={14} />}
                onClick={() => go("addStaff")}
              >
                Add Staff
              </ActionButton>
            </div>
          }
        />

        <main className="space-y-5 px-4 py-5">
          {error && !data && (
            <div
              role="alert"
              className="flex items-center justify-between rounded-lg border border-red-500/30 bg-red-950 px-4 py-3 text-xs text-red-200"
            >
              <span>{error}</span>
              <ActionButton
                variant="outline"
                onClick={() => setReload((k) => k + 1)}
              >
                Retry
              </ActionButton>
            </div>
          )}

          <DashboardCards kpis={data?.kpis} />

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,0.9fr)] [&>*]:min-w-0">
            <AttendanceOverviewChart
              overview={data?.attendanceOverview}
              range={range}
              onRangeChange={setRange}
            />
            <DepartmentStaffCard departmentStaff={data?.departmentStaff} />
            <TodayStatusCard todayStatus={data?.todayStatus} />
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,2.3fr)_minmax(0,1fr)] [&>*]:min-w-0">
            <RecentAttendanceCard
              rows={data?.recentAttendance}
              loading={loading}
              onViewAll={() => go("attendanceHistory")}
              onOpen={setDetailRow}
            />
            <div className="min-w-0 space-y-5">
              <QuickActionsCard onGo={go} />
              <DeviceStatusCard
                devices={data?.devices}
                now={now}
                onViewAll={() => go("devices")}
              />
            </div>
          </div>
        </main>
      </div>

      <DailyRecordModal row={detailRow} onClose={() => setDetailRow(null)} />
      <Toast toast={toast} onClose={closeToast} />
    </div>
  );
};

export default ManageStaffDashboard;
