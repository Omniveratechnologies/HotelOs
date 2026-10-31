import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FiCalendar, FiPlus } from "react-icons/fi";

import Navbar from "../components/ui/Navbar.jsx";
import Sidebar from "../components/hamburger/SideBar.jsx";
import ActionButton from "../components/ui/button/ActionButton.jsx";
import ConfirmDialog from "../components/ui/ConfirmDialog.jsx";
import Toast from "../components/ui/Toast.jsx";

import ShiftscheduleStatusCards from "../components/shiftschedule/shiftscheduleStatusCards.jsx";
import ShiftscheduleTabs from "../components/shiftschedule/ShiftscheduleTabs.jsx";
import TodayScheduleCard from "../components/shiftschedule/TodayScheduleCard.jsx";
import MonthCalendar from "../components/shiftschedule/MonthCalendar.jsx";
import ShiftDistributionCard from "../components/shiftschedule/ShiftDistributionCard.jsx";
import QuickActionsCard from "../components/shiftschedule/QuickActionsCard.jsx";
import StaffScheduleTab from "../components/shiftschedule/StaffScheduleTab.jsx";
import ShiftCalendarTab from "../components/shiftschedule/ShiftCalendarTab.jsx";
import ShiftFormModal from "../components/shiftschedule/ShiftFormModal.jsx";
import {
  AutoScheduleModal,
  BulkAssignModal,
  CellAssignModal,
} from "../components/shiftschedule/AssignModals.jsx";
import ShiftReportsModal from "../components/shiftschedule/ShiftReportsModal.jsx";
import {
  ScheduleDetailModal,
  ViewAllDialog,
} from "../components/shiftschedule/ScheduleDialogs.jsx";

import { api, del, localToday, query } from "../utils/shiftScheduleUtils.js";
import ShiftscheduleListCard from "../components/shiftschedule/ShiftScheduleListCard.jsx";

const ShiftSchedule = () => {
  const today = useMemo(localToday, []);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [tab, setTab] = useState("overview");
  const [date, setDate] = useState(today);
  const [month, setMonth] = useState(today.slice(0, 7));

  const [summary, setSummary] = useState(null);
  const [calendar, setCalendar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const [toast, setToast] = useState(null);
  const [formShift, setFormShift] = useState(undefined);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [dialog, setDialog] = useState(null);
  const [detailRow, setDetailRow] = useState(null);
  const [cellTarget, setCellTarget] = useState(null);

  const listRef = useRef(null);
  const closeToast = useCallback(() => setToast(null), []);
  const reload = useCallback(() => setRefreshKey((key) => key + 1), []);
  const notify = useCallback(
    (message, type = "success") => setToast({ type, message }),
    [],
  );

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    api(`/summary?${query({ date, todayLimit: 5 })}`, {
      signal: controller.signal,
    })
      .then((res) => setSummary(res.data))
      .catch((err) => {
        if (err.name !== "AbortError") notify(err.message, "error");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [date, refreshKey, notify]);

  useEffect(() => {
    const controller = new AbortController();
    setCalendarLoading(true);
    api(`/schedule/calendar?${query({ month })}`, { signal: controller.signal })
      .then((res) => setCalendar(res.data))
      .catch((err) => {
        if (err.name !== "AbortError") notify(err.message, "error");
      })
      .finally(() => {
        if (!controller.signal.aborted) setCalendarLoading(false);
      });
    return () => controller.abort();
  }, [month, refreshKey, notify]);

  const activeShifts = useMemo(
    () => (summary?.shifts || []).filter((shift) => shift.isActive),
    [summary],
  );

  const saved = (message) => {
    setFormShift(undefined);
    setDialog(null);
    setCellTarget(null);
    setDetailRow(null);
    notify(message);
    reload();
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await del(`/shifts/${deleteTarget._id}`);
      notify(`${deleteTarget.name} deleted`);
      reload();
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const quickAction = (key) => {
    if (key === "manage") {
      setTab("overview");
      requestAnimationFrame(() =>
        listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
      );
    } else if (key === "auto") setDialog("auto");
    else if (key === "bulk") setDialog("bulk");
    else if (key === "reports") setDialog("reports");
  };

  const pickDate = (value) => {
    setDate(value);
    if (value.slice(0, 7) !== month) setMonth(value.slice(0, 7));
  };

  const changeFromDetail = (row) => {
    setDetailRow(null);
    setCellTarget({
      staff: row.staff,
      date: row.date,
      state: "SHIFT",
      shift: row.shift,
      explicit: row.source === "ASSIGNED",
    });
  };

  const viewAllNeedsShifts = summary?.shifts || [];

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
          title="Shift & Schedule"
          subtitle="Manage work shifts, schedules and staff assignments."
          breadcrumb="Manage Staff → Shift & Schedule"
          placeholder="Search staff, department, designation, etc.."
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          showPageHeading
          pageAction={
            <div className="flex items-center gap-3">
              <ActionButton
                variant="outline"
                icon={<FiCalendar size={14} />}
                onClick={() => setTab("calendar")}
              >
                View Calendar
              </ActionButton>
              <ActionButton
                icon={<FiPlus size={14} />}
                onClick={() => setFormShift(null)}
              >
                Add Shift
              </ActionButton>
            </div>
          }
        />

        <main className="space-y-5 px-4 py-5">
          <ShiftscheduleStatusCards
            stats={summary?.stats}
            isToday={summary?.isToday ?? true}
          />
          <ShiftscheduleTabs active={tab} onChange={setTab} />

          {tab === "overview" && (
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="min-w-0 space-y-5">
                <ShiftscheduleListCard
                  sectionRef={listRef}
                  shifts={summary?.shifts || []}
                  loading={loading}
                  onAdd={() => setFormShift(null)}
                  onEdit={setFormShift}
                  onDelete={setDeleteTarget}
                />
                <TodayScheduleCard
                  date={date}
                  isToday={date === today}
                  rows={summary?.today.rows || []}
                  total={summary?.today.total || 0}
                  loading={loading}
                  onViewAll={() => setDialog("all")}
                  onView={setDetailRow}
                />
              </div>

              <div className="min-w-0 space-y-5">
                <section
                  aria-label="Schedule calendar"
                  className="rounded-lg border border-gray-800 p-4"
                >
                  <h2 className="mb-3 text-sm font-semibold text-white">
                    Schedule Calendar
                  </h2>
                  <MonthCalendar
                    calendar={calendar}
                    month={month}
                    onMonthChange={setMonth}
                    onSelectDate={pickDate}
                    selectedDate={date}
                    loading={calendarLoading}
                  />
                </section>
                <ShiftDistributionCard
                  distribution={summary?.distribution}
                  title={
                    date === today
                      ? "Shift Distribution Today"
                      : "Shift Distribution"
                  }
                />
                <QuickActionsCard onAction={quickAction} />
              </div>
            </div>
          )}

          {tab === "roster" && (
            <StaffScheduleTab
              refreshKey={refreshKey}
              onCellClick={setCellTarget}
            />
          )}

          {tab === "calendar" && (
            <ShiftCalendarTab
              calendar={calendar}
              month={month}
              onMonthChange={setMonth}
              loading={calendarLoading}
              selectedDate={date}
              onSelectDate={pickDate}
              refreshKey={refreshKey}
              onViewAll={() => setDialog("all")}
              onView={setDetailRow}
            />
          )}
        </main>
      </div>

      {formShift !== undefined && (
        <ShiftFormModal
          key={formShift?._id || "new"}
          shift={formShift}
          onClose={() => setFormShift(undefined)}
          onSaved={saved}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete shift"
        message={
          deleteTarget
            ? `Delete "${deleteTarget.name}"? It is switched off and can't be given to staff. Past attendance keeps its shift name.`
            : ""
        }
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {dialog === "bulk" && (
        <BulkAssignModal
          shifts={activeShifts}
          onClose={() => setDialog(null)}
          onDone={saved}
        />
      )}
      {dialog === "auto" && (
        <AutoScheduleModal
          shifts={activeShifts}
          onClose={() => setDialog(null)}
          onDone={saved}
        />
      )}
      {dialog === "reports" && (
        <ShiftReportsModal onClose={() => setDialog(null)} />
      )}
      {dialog === "all" && (
        <ViewAllDialog
          date={date}
          shifts={viewAllNeedsShifts}
          onClose={() => setDialog(null)}
          onView={(row) => {
            setDialog(null);
            setDetailRow(row);
          }}
        />
      )}

      {detailRow && (
        <ScheduleDetailModal
          row={detailRow}
          onClose={() => setDetailRow(null)}
          onChange={changeFromDetail}
        />
      )}
      {cellTarget && (
        <CellAssignModal
          target={cellTarget}
          shifts={activeShifts}
          onClose={() => setCellTarget(null)}
          onDone={saved}
        />
      )}

      <Toast toast={toast} onClose={closeToast} />
    </div>
  );
};

export default ShiftSchedule;
