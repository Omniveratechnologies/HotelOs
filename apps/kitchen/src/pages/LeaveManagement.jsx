import { useCallback, useEffect, useState } from "react";
import { FiCalendar, FiPlus } from "react-icons/fi";

import Sidebar from "../components/hamburger/SideBar.jsx";
import Toast from "../components/ui/Toast.jsx";
import Navbar from "../components/ui/Navbar.jsx";
import LeaveManagementStatusCards from "../components/leaveManagement/LeaveManagementStatusCards.jsx";
import LeaveManagementFilters from "../components/leaveManagement/LeaveManagementFilters.jsx";
import LeaveManagementTable from "../components/leaveManagement/LeaveManagementTable.jsx";
import LeaveRowMenu from "../components/leaveManagement/LeaveRowMenu.jsx";
import {
  ApplyLeaveModal,
  LeaveDetailsModal,
  RejectModal,
} from "../components/leaveManagement/LeaveModals.jsx";
import {
  initialFilters,
  monthRange,
  request,
  toQuery,
} from "../utils/leaveManagementUtils.js";

const LeaveManagement = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [filters, setFilters] = useState(initialFilters);
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [leaves, setLeaves] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    from: 0,
    to: 0,
  });
  const [stats, setStats] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const [toast, setToast] = useState(null);
  const [rowMenu, setRowMenu] = useState(null);
  const [viewId, setViewId] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [showApply, setShowApply] = useState(false);

  const closeToast = useCallback(() => setToast(null), []);
  const closeRowMenu = useCallback(() => setRowMenu(null), []);
  const reload = useCallback(() => setRefreshKey((k) => k + 1), []);

  const openRowMenu = useCallback((e, leave) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setRowMenu({
      leave,
      top: rect.bottom + 4,
      left: Math.max(rect.right - 176, 8),
    });
  }, []);

  useEffect(() => {
    Promise.all([
      request("/staffManagement/departments"),
      request("/leaveManagement/types"),
    ])
      .then(([dept, types]) => {
        setDepartments(dept.data || []);
        setLeaveTypes(types.data || []);
      })
      .catch((err) => setToast({ type: "error", message: err.message }));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      const value = searchInput.trim();
      setFilters((f) => (f.search === value ? f : { ...f, search: value }));
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const controller = new AbortController();
    const base = toQuery(filters);
    const listParams = new URLSearchParams(base);
    listParams.set("page", page);
    listParams.set("limit", limit);

    setLoading(true);
    Promise.all([
      request(`/leaveManagement?${listParams}`, { signal: controller.signal }),
      request(`/leaveManagement/stats?${base}`, { signal: controller.signal }),
    ])
      .then(([list, summary]) => {
        setLeaves(list.data);
        const {
          page: current = 1,
          limit: size = 10,
          total = 0,
          totalPages = 1,
        } = list.pagination || {};
        setPagination({
          total,
          totalPages,
          from: total === 0 ? 0 : (current - 1) * size + 1,
          to: Math.min(current * size, total),
        });
        setStats(summary.data);
      })
      .catch((err) => {
        if (err.name !== "AbortError")
          setToast({ type: "error", message: err.message });
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [filters, page, limit, refreshKey]);

  const updateFilter = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  const resetFilters = () => {
    setFilters(initialFilters());
    setSearchInput("");
    setPage(1);
  };

  const changeLimit = (value) => {
    setLimit(value);
    setPage(1);
  };

  const runAction = async (fn, successMessage) => {
    try {
      await fn();
      setToast({ type: "success", message: successMessage });
      reload();
      return true;
    } catch (err) {
      setToast({ type: "error", message: err.message });
      return false;
    }
  };

  const approve = (leave) =>
    runAction(
      () =>
        request(`/leaveManagement/${leave._id}/approve`, {
          method: "POST",
          body: "{}",
        }),
      "Leave approved",
    );

  const reject = async (leave, reason) => {
    const ok = await runAction(
      () =>
        request(`/leaveManagement/${leave._id}/reject`, {
          method: "POST",
          body: JSON.stringify({ remarks: reason }),
        }),
      "Leave rejected",
    );
    if (ok) setRejectTarget(null);
  };

  const cancel = (leave) =>
    runAction(
      () =>
        request(`/leaveManagement/${leave._id}/cancel`, {
          method: "POST",
          body: "{}",
        }),
      "Leave cancelled",
    );

  const defaultRange = monthRange();
  const isThisMonth =
    filters.from === defaultRange.from && filters.to === defaultRange.to;

  return (
    <div className="relative h-screen overflow-hidden bg-[#0f0f0f] text-white">
      <Sidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

      <div
        className={`h-full overflow-y-auto transition-[margin] duration-300 ease-in-out ${
          isMenuOpen ? "ml-64" : "ml-0"
        }`}
      >
        <Navbar
          icon={<FiCalendar size={20} />}
          iconColor="text-emerald-400"
          bgColor="bg-emerald-950"
          title="Leave Management"
          subtitle="Manage staff leave requests and track leave balances"
          placeholder="Search staff, department, designation, etc.."
          breadcrumb="Manage Staff → Leave Management"
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          showPageHeading
          pageAction={
            <button
              type="button"
              onClick={() => setShowApply(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500"
            >
              <FiPlus size={16} />
              Apply Leave
            </button>
          }
        />

        <main className="space-y-5 px-4 py-5">
          <LeaveManagementStatusCards stats={stats} isThisMonth={isThisMonth} />

          <LeaveManagementFilters
            filters={filters}
            searchInput={searchInput}
            onSearchChange={setSearchInput}
            departments={departments}
            leaveTypes={leaveTypes}
            onFilterChange={updateFilter}
            onReset={resetFilters}
          />

          <LeaveManagementTable
            leaves={leaves}
            loading={loading}
            pagination={pagination}
            page={page}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={changeLimit}
            onView={setViewId}
            onOpenMenu={openRowMenu}
          />
        </main>
      </div>

      <LeaveRowMenu
        menu={rowMenu}
        onClose={closeRowMenu}
        onApprove={approve}
        onReject={setRejectTarget}
        onCancel={cancel}
      />

      {showApply && (
        <ApplyLeaveModal
          leaveTypes={leaveTypes}
          onClose={() => setShowApply(false)}
          onSuccess={(message) => {
            setShowApply(false);
            setToast({ type: "success", message });
            reload();
          }}
        />
      )}

      {viewId && (
        <LeaveDetailsModal leaveId={viewId} onClose={() => setViewId(null)} />
      )}

      {rejectTarget && (
        <RejectModal
          leave={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onConfirm={reject}
        />
      )}

      <Toast toast={toast} onClose={closeToast} />
    </div>
  );
};

export default LeaveManagement;
