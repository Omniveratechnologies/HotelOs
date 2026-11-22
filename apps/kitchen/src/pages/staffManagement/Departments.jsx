import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FiLayers, FiPlus } from "react-icons/fi";

import Navbar from "../../components/ui/Navbar.jsx";
import Sidebar from "../../components/hamburger/SideBar.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import Toast from "../../components/ui/Toast.jsx";

import DepartmentStatusCards from "../../components/staffManagement/DepartmentStatusCards.jsx";
import DepartmentHeader from "../../components/staffManagement/DepartmentHeader.jsx";
import DepartmentTable from "../../components/staffManagement/DepartmentTable.jsx";
import DepartmentFormModal from "../../components/staffManagement/DepartmentFormModal.jsx";
import DepartmentDrawer from "../../components/staffManagement/DepartmentDrawer.jsx";
import DepartmentViewModal from "../../components/staffManagement/DepartmentViewModal.jsx";

import {
  createDepartment,
  deleteDepartment,
  fetchDepartmentDesignations,
  fetchDepartmentStats,
  fetchDepartmentSummary,
  fetchDepartments,
  updateDepartment,
} from "../../services/departmentApi.js";
import { fetchStaff } from "../../services/staffApi.js";
import { departmentKey } from "../../utils/departmentOptions.js";

const ALL_STAFF_ROUTE = "/manage-staff/staff-management/all-staff";

const DEFAULT_FILTERS = { search: "", status: "", page: 1, limit: 10 };
const IDLE = { loading: false, error: "", items: [] };

const useIsWide = () => {
  const query = "(min-width: 1280px)";
  const [wide, setWide] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const media = window.matchMedia(query);
    const onChange = (event) => setWide(event.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return wide;
};

const Departments = () => {
  const navigate = useNavigate();
  const isWide = useIsWide();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedKey = searchParams.get("dept") || "";

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [searchInput, setSearchInput] = useState("");

  const [departments, setDepartments] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [summary, setSummary] = useState(null);
  const [summaryError, setSummaryError] = useState("");
  const [tab, setTab] = useState("overview");
  const [designations, setDesignations] = useState(IDLE);
  const [staff, setStaff] = useState(IDLE);

  const [form, setForm] = useState({
    open: false,
    mode: "create",
    department: null,
  });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);

  const refresh = () => setRefreshKey((key) => key + 1);
  const closeToast = useCallback(() => setToast(null), []);
  const showToast = (type, message) => setToast({ type, message });

  const selectDepartment = (department) =>
    setSearchParams({ dept: departmentKey(department) });

  const closeDetails = () => setSearchParams({});

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((previous) =>
        previous.search === searchInput.trim()
          ? previous
          : { ...previous, search: searchInput.trim(), page: 1 },
      );
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");

    fetchDepartments(
      {
        search: filters.search,
        status: filters.status || "ALL",
        page: filters.page,
        limit: filters.limit,
      },
      controller.signal,
    )
      .then((body) => {
        const next = body.pagination || {
          page: 1,
          limit: filters.limit,
          total: 0,
          totalPages: 1,
        };
        setDepartments(body.data || []);
        setPagination(next);

        if (
          (body.data || []).length === 0 &&
          next.total > 0 &&
          filters.page > next.totalPages
        ) {
          setFilters((previous) => ({ ...previous, page: next.totalPages }));
        }
      })
      .catch((requestError) => {
        if (requestError.name !== "AbortError") setError(requestError.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [filters, refreshKey]);

  useEffect(() => {
    fetchDepartmentStats()
      .then(setStats)
      .catch(() => setStats(null));
  }, [refreshKey]);

  useEffect(() => {
    if (isWide && !selectedKey && departments.length > 0) {
      setSearchParams(
        { dept: departmentKey(departments[0]) },
        { replace: true },
      );
    }
  }, [isWide, selectedKey, departments, setSearchParams]);

  useEffect(() => {
    setSummary(null);
    setSummaryError("");
    setTab("overview");
    setDesignations(IDLE);
    setStaff(IDLE);
  }, [selectedKey]);

  useEffect(() => {
    if (!selectedKey) return undefined;

    const controller = new AbortController();

    fetchDepartmentSummary(selectedKey, controller.signal)
      .then((data) => {
        setSummary(data);
        setSummaryError("");
      })
      .catch((requestError) => {
        if (requestError.name !== "AbortError")
          setSummaryError(requestError.message);
      });

    return () => controller.abort();
  }, [selectedKey, refreshKey]);

  const departmentId = summary?.department?._id;

  useEffect(() => {
    if (
      !selectedKey ||
      !departmentId ||
      (tab !== "designations" && tab !== "staff")
    )
      return undefined;

    const controller = new AbortController();
    const setter = tab === "designations" ? setDesignations : setStaff;

    setter((previous) => ({ ...previous, loading: true, error: "" }));

    const request =
      tab === "designations"
        ? fetchDepartmentDesignations(selectedKey, controller.signal)
        : fetchStaff(
            {
              department_id: departmentId,
              sort: "joinedOn",
              direction: "desc",
              page: 1,
              limit: 10,
            },
            controller.signal,
          ).then((body) => body.data || []);

    request
      .then((items) => setter({ loading: false, error: "", items }))
      .catch((requestError) => {
        if (requestError.name !== "AbortError") {
          setter({ loading: false, error: requestError.message, items: [] });
        }
      });

    return () => controller.abort();
  }, [tab, selectedKey, departmentId, refreshKey]);

  const handleReset = () => {
    setSearchInput("");
    setFilters(DEFAULT_FILTERS);
  };

  const openCreate = () =>
    setForm({ open: true, mode: "create", department: null });
  const openEdit = (department) =>
    setForm({ open: true, mode: "edit", department });
  const closeForm = () => setForm((previous) => ({ ...previous, open: false }));

  const submitForm = async (values) => {
    if (form.mode === "edit") {
      const old = form.department;
      const result = await updateDepartment(old._id, values);

      if (selectedKey && selectedKey === departmentKey(old)) {
        setSearchParams(
          { dept: departmentKey(result.data) },
          { replace: true },
        );
      }

      showToast("success", `${result.data.name} was updated`);
    } else {
      const result = await createDepartment(values);
      setSearchParams({ dept: departmentKey(result.data) });
      showToast("success", `${result.data.name} was added`);
    }

    closeForm();
    refresh();
  };

  const toggleStatus = async (department) => {
    try {
      await updateDepartment(department._id, {
        status: department.isActive ? "INACTIVE" : "ACTIVE",
      });
      showToast(
        "success",
        `${department.name} was ${department.isActive ? "deactivated" : "activated"}`,
      );
      refresh();
    } catch (requestError) {
      showToast("error", requestError.message);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    try {
      const body = await deleteDepartment(deleteTarget._id);
      showToast("success", body.message || `${deleteTarget.name} was deleted`);

      if (selectedKey === departmentKey(deleteTarget) && body.data?.deleted)
        closeDetails();

      setDeleteTarget(null);
      refresh();
    } catch (requestError) {
      showToast("error", requestError.message);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const detailsProps = {
    summary,
    loading: !summary && !summaryError,
    error: summaryError,
    tab,
    onTabChange: setTab,
    designations,
    staff,
    onEdit: openEdit,
    onManageStaff: () => navigate(ALL_STAFF_ROUTE),
    onViewAll: () => navigate(ALL_STAFF_ROUTE),
  };

  const hasActiveFilters = Boolean(filters.search || filters.status);

  return (
    <div className="relative h-screen overflow-hidden bg-[#0f0f0f] text-white">
      <Sidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

      <div
        className={`h-full overflow-y-auto transition-[margin] duration-300 ease-in-out ${
          isMenuOpen ? "ml-64" : "ml-0"
        }`}
      >
        <Navbar
          icon={<FiLayers />}
          iconColor="text-emerald-500"
          bgColor="bg-emerald-500/10"
          title="Departments"
          subtitle="Manage hotel departments and organize your staff efficiently"
          breadcrumb="Manage Staff → Staff Management → Departments"
          placeholder="Search staff, department, designation, etc.."
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          showPageHeading
          pageAction={
            <button
              type="button"
              onClick={openCreate}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-emerald-500"
            >
              <FiPlus size={14} />
              Add Department
            </button>
          }
        />

        <main
          className={`grid gap-5 px-4 py-5 ${
            isWide && selectedKey
              ? "grid-cols-[minmax(0,1fr)_340px]"
              : "grid-cols-1"
          }`}
        >
          <div className="min-w-0 space-y-5">
            <DepartmentStatusCards stats={stats} />

            <div className="overflow-hidden rounded-xl border border-gray-800 bg-[#111111]">
              <DepartmentHeader
                searchTerm={searchInput}
                onSearchChange={setSearchInput}
                status={filters.status}
                onStatusChange={(status) =>
                  setFilters((previous) => ({ ...previous, status, page: 1 }))
                }
                onReset={handleReset}
              />

              <DepartmentTable
                departments={departments}
                loading={loading}
                error={error}
                onRetry={refresh}
                pagination={pagination}
                onPageChange={(page) =>
                  setFilters((previous) => ({ ...previous, page }))
                }
                hasActiveFilters={hasActiveFilters}
                selectedKey={selectedKey}
                onView={selectDepartment}
                onEdit={openEdit}
                onToggleStatus={toggleStatus}
                onDelete={setDeleteTarget}
              />
            </div>
          </div>

          {isWide && selectedKey && <DepartmentDrawer {...detailsProps} />}
        </main>
      </div>

      <DepartmentViewModal
        open={!isWide && Boolean(selectedKey)}
        onClose={closeDetails}
        {...detailsProps}
      />

      <DepartmentFormModal
        open={form.open}
        mode={form.mode}
        department={form.department}
        onClose={closeForm}
        onSubmit={submitForm}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete department?"
        message={
          deleteTarget
            ? `${deleteTarget.name} will be removed. A department that still has staff cannot be deleted: reassign the staff first, or deactivate it instead.`
            : ""
        }
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <Toast toast={toast} onClose={closeToast} />
    </div>
  );
};

export default Departments;
