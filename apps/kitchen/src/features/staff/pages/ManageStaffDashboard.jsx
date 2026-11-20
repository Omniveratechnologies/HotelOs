import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiCalendar, FiHome, FiPlus } from "react-icons/fi";
import { useAsyncData } from "@/hooks/useAsyncData.js";

import Navbar from "@/components/ui/Navbar.jsx";
import Sidebar from "@/components/hamburger/SideBar.jsx";
import ActionButton from "@/components/ui/button/ActionButton.jsx";
import Toast from "@/components/ui/Toast.jsx";

import DashboardCards from "../components/dashboard/DashboardCards.jsx";
import AttendanceOverviewChart from "../components/dashboard/AttendanceOverviewChart.jsx";
import DepartmentStaffCard from "../components/dashboard/DepartmentStaffCard.jsx";
import TodayStatusCard from "../components/dashboard/TodayStatusCard.jsx";
import RecentAttendanceCard from "../components/dashboard/RecentAttendanceCard.jsx";
import QuickActionsCard from "../components/dashboard/QuickActionCard.jsx";
import DeviceStatusCard from "../components/dashboard/DeviceStatusCard.jsx";
import DailyRecordModal from "../../reports/components/DailyRecordModal.jsx";
import {
  ROUTES,
  adminName,
  formatLongDate,
  greeting,
  inputCls,
  loadDashboard,
  todayKey,
} from "../../dashboard/utils/dashboardUtils.js";

const REFRESH_MS = 60_000;

const ManageStaffDashboard = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [date, setDate] = useState(todayKey);
  const [range, setRange] = useState("week");
  const [now, setNow] = useState(() => Date.now());

  const [detailRow, setDetailRow] = useState(null);
  const [toast, setToast] = useState(null);
  const closeToast = useCallback(() => setToast(null), []);

  const { data, loading, error, refresh } = useAsyncData(
    async (signal) => {
      const res = await loadDashboard({ date, range }, { signal });
      return res.data;
    },
    [date, range],
  );

  useEffect(() => {
    const timer = setInterval(() => {
      refresh({ silent: true });
      setNow(Date.now());
    }, REFRESH_MS);
    return () => clearInterval(timer);
  }, [refresh]);

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
