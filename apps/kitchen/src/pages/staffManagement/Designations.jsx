import { useCallback, useEffect, useState } from "react";
import { FiBriefcase, FiPlus } from "react-icons/fi";

import Navbar from "../../components/ui/Navbar.jsx";
import Sidebar from "../../components/hamburger/SideBar.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import Toast from "../../components/ui/Toast.jsx";

import DesignationStatusCards from "../../components/staffManagement/DesignationStatusCards.jsx";
import DesignationHeader from "../../components/staffManagement/DesignationHeader.jsx";
import DesignationTable from "../../components/staffManagement/DesignationTable.jsx";
import DesignationFormPanel from "../../components/staffManagement/DesignationFormPAnel.jsx";
import DesignationFormModal from "../../components/staffManagement/DesignationModal.jsx";

import {
  createDesignation,
  deleteDesignation,
  fetchDesignationStats,
  fetchDesignations,
  updateDesignation,
} from "../../services/designationApi.js";
import { fetchDepartments } from "../../services/departmentApi.js";
import { useIsWide } from "../../hooks/useIsWide.js";

const DEFAULT_FILTERS = {
  search: "",
  department_id: "",
  status: "",
  sort: "name",
  direction: "asc",
  page: 1,
  limit: 10,
};

const Designations = () => {
  const isWide = useIsWide();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [searchInput, setSearchInput] = useState("");

  const [designations, setDesignations] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [stats, setStats] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [editing, setEditing] = useState(null);
  const [formKey, setFormKey] = useState(0);
  const [focusToken, setFocusToken] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);

  const refresh = () => setRefreshKey((key) => key + 1);
  const closeToast = useCallback(() => setToast(null), []);
  const showToast = (type, message) => setToast({ type, message });

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

    fetchDesignations(
      {
        search: filters.search,
        department_id: filters.department_id,
        status: filters.status || "ALL",
        sort: filters.sort,
        direction: filters.direction,
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
        setDesignations(body.data || []);
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
    fetchDesignationStats()
      .then(setStats)
      .catch(() => setStats(null));
  }, [refreshKey]);

  useEffect(() => {
    fetchDepartments({ status: "ALL", limit: 100 })
      .then((body) => setDepartments(body.data || []))
      .catch((requestError) => showToast("error", requestError.message));
  }, [refreshKey]);

  const handleReset = () => {
    setSearchInput("");
    setFilters(DEFAULT_FILTERS);
  };

  const handleSort = (key) => {
    setFilters((previous) => ({
      ...previous,
      sort: key,
      direction:
        previous.sort === key && previous.direction === "asc" ? "desc" : "asc",
      page: 1,
    }));
  };

  const openAdd = () => {
    setEditing(null);
    setFormKey((key) => key + 1);
    setFocusToken((token) => token + 1);
    setModalOpen(!isWide);
  };

  const openEdit = (designation) => {
    setEditing(designation);
    setFormKey((key) => key + 1);
    setFocusToken((token) => token + 1);
    setModalOpen(!isWide);
  };

  const closeForm = () => {
    setEditing(null);
    setFormKey((key) => key + 1);
    setModalOpen(false);
  };

  const submitForm = async (values) => {
    const result = editing
      ? await updateDesignation(editing._id, values)
      : await createDesignation(values);

    showToast(
      "success",
      `${result.data.name} was ${editing ? "updated" : "added"}`,
    );
    closeForm();
    refresh();
  };

  const toggleStatus = async (designation) => {
    try {
      await updateDesignation(designation._id, {
        status: designation.isActive ? "INACTIVE" : "ACTIVE",
      });
      showToast(
        "success",
        `${designation.name} was ${designation.isActive ? "deactivated" : "activated"}`,
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
      const body = await deleteDesignation(deleteTarget._id);
      showToast("success", body.message || `${deleteTarget.name} was deleted`);

      if (editing?._id === deleteTarget._id) closeForm();

      setDeleteTarget(null);
      refresh();
    } catch (requestError) {
      showToast("error", requestError.message);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const activeDepartments = departments.filter((item) => item.isActive);
  const hasActiveFilters = Boolean(
    filters.search || filters.department_id || filters.status,
  );

  const formProps = {
    mode: editing ? "edit" : "create",
    designation: editing,
    departments: activeDepartments,
    onSubmit: submitForm,
    focusToken,
  };

  return (
    <div className="relative h-screen overflow-hidden bg-[#0f0f0f] text-white">
      <Sidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

      <div
        className={`h-full overflow-y-auto transition-[margin] duration-300 ease-in-out ${
          isMenuOpen ? "ml-64" : "ml-0"
        }`}
      >
        <Navbar
          icon={<FiBriefcase />}
          iconColor="text-emerald-500"
          bgColor="bg-emerald-500/10"
          title="Designations"
          subtitle="Manage job roles and designations for each department."
          breadcrumb="Manage Staff → Staff Management → Designations"
          placeholder="Search staff, department, designation, etc."
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          showPageHeading
          pageAction={
            <button
              type="button"
              onClick={openAdd}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-emerald-500"
            >
              <FiPlus size={14} />
              Add Designation
            </button>
          }
        />

        <main
          className={`grid items-start gap-5 px-4 py-5 ${
            isWide ? "grid-cols-[minmax(0,1fr)_340px]" : "grid-cols-1"
          }`}
        >
          <div className="min-w-0 space-y-5">
            <DesignationStatusCards stats={stats} />

            <div className="overflow-hidden rounded-xl border border-gray-800 bg-[#111111]">
              <DesignationHeader
                searchTerm={searchInput}
                onSearchChange={setSearchInput}
                departments={departments}
                departmentId={filters.department_id}
                onDepartmentChange={(value) =>
                  setFilters((previous) => ({
                    ...previous,
                    department_id: value,
                    page: 1,
                  }))
                }
                status={filters.status}
                onStatusChange={(value) =>
                  setFilters((previous) => ({
                    ...previous,
                    status: value,
                    page: 1,
                  }))
                }
                onReset={handleReset}
              />

              <DesignationTable
                designations={designations}
                loading={loading}
                error={error}
                onRetry={refresh}
                pagination={pagination}
                onPageChange={(page) =>
                  setFilters((previous) => ({ ...previous, page }))
                }
                hasActiveFilters={hasActiveFilters}
                sortBy={filters.sort}
                sortDirection={filters.direction}
                onSort={handleSort}
                editingId={editing?._id || ""}
                onEdit={openEdit}
                onDelete={setDeleteTarget}
                onToggleStatus={toggleStatus}
              />
            </div>
          </div>

          {isWide && (
            <DesignationFormPanel
              key={formKey}
              {...formProps}
              onClose={closeForm}
            />
          )}
        </main>
      </div>

      {!isWide && (
        <DesignationFormModal
          key={formKey}
          open={modalOpen}
          onClose={closeForm}
          {...formProps}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete designation?"
        message={
          deleteTarget
            ? `${deleteTarget.name} will be removed. A designation that still has staff cannot be deleted: reassign the staff first, or deactivate it instead.`
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

export default Designations;
