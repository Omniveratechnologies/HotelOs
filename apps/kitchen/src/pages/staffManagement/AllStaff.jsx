import { useCallback, useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FiDownload, FiPlus, FiUsers, FiUpload } from "react-icons/fi";

import Navbar from "../../components/ui/Navbar.jsx";
import Sidebar from "../../components/hamburger/SideBar.jsx";
import Button from "../../components/ui/button/Button.jsx";

import AllStaffStatusCards from "../../components/staffManagement/AllStaffStatusCards.jsx";
import AllStaffTable from "../../components/staffManagement/AllStaffTable.jsx";
import {
  deleteStaff,
  exportStaff,
  fetchStaff,
  fetchStaffLookups,
  fetchStaffStats,
} from "../../services/staffApi.js";

const ROUTES = {
  add: "/manage-staff/staff-management/add-staff",
  view: (id) => `/manage-staff/staff-management/view-staff/${id}`,
  edit: (id) => `/manage-staff/staff-management/edit-staff/${id}`,
};

const DEFAULT_FILTERS = {
  search: "",
  department_id: "",
  designation_id: "",
  status: "",
  joinDate: "",
  sort: "joinedOn",
  direction: "desc",
  page: 1,
  limit: 10,
};

const AllStaff = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [searchInput, setSearchInput] = useState("");

  const [staff, setStaff] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [stats, setStats] = useState(null);
  const [lookups, setLookups] = useState({ departments: [], designations: [] });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef(null);
  const [importing, setImporting] = useState(false);

  const handleImport = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    event.target.value = "";

    if (!file.name.toLowerCase().endsWith(".csv")) {
      alert("Please select a CSV file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setImporting(true);

      const response = await axios.post(
        `${API_BASE_URL}/v1/staffManagement/import`,
        formData,
        { withCredentials: true },
      );

      alert(response.data?.message || "CSV import request submitted.");

      await fetchStaff();
    } catch (error) {
      console.error("Staff import failed:", error);
      alert(
        error.response?.data?.message ||
          "Failed to import staff. Please try again.",
      );
    } finally {
      setImporting(false);
    }
  };
  const showToast = useCallback((type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const refresh = () => setRefreshKey((key) => key + 1);

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

    fetchStaff(
      {
        search: filters.search,
        department_id: filters.department_id,
        designation_id: filters.designation_id,
        status: filters.status,
        joined_from: filters.joinDate,
        joined_to: filters.joinDate,
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
        setStaff(body.data || []);
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
    fetchStaffStats()
      .then(setStats)
      .catch(() => setStats(null));
  }, [refreshKey]);

  useEffect(() => {
    fetchStaffLookups()
      .then(setLookups)
      .catch((lookupError) => showToast("error", lookupError.message));
  }, [showToast]);

  const handleFilterChange = (key, value) => {
    setFilters((previous) => ({
      ...previous,
      [key]: value,
      ...(key === "department_id" ? { designation_id: "" } : {}),
      page: 1,
    }));
  };

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

  const handleExport = async () => {
    try {
      await exportStaff(
        {
          search: filters.search,
          department_id: filters.department_id,
          designation_id: filters.designation_id,
          status: filters.status,
          joined_from: filters.joinDate,
          joined_to: filters.joinDate,
          sort: filters.sort,
          direction: filters.direction,
        },
        "csv",
      );
      showToast("success", "Exporting staff with the current filters");
    } catch (exportError) {
      showToast("error", exportError.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    try {
      await deleteStaff(deleteTarget._id);
      showToast("success", `${deleteTarget.name} was deleted`);
      setDeleteTarget(null);
      refresh();
    } catch (deleteError) {
      showToast("error", deleteError.message);
    } finally {
      setDeleting(false);
    }
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
          icon={<FiUsers />}
          iconColor="text-emerald-500"
          bgColor="bg-emerald-500/10"
          title="All Staff"
          subtitle="View, search and manage every staff member of your hotel."
          breadcrumb="Manage Staff → Staff Management → All Staff"
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          showPageHeading
          placeholder="Search Staff, Department, etc..."
          pageAction={
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleImport}
              />

              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                className="flex items-center gap-2 rounded-lg bg-gray-800 px-3 py-2 text-xs text-gray-300 transition hover:bg-emerald-300 hover:text-black"
              >
                <FiUpload size={14} />
                {importing ? "Importing..." : "Import CSV"}
              </Button>

              <Button
                type="button"
                onClick={handleExport}
                className="flex items-center gap-2 rounded-lg bg-gray-800 px-3 py-2 text-xs text-gray-300 transition hover:bg-emerald-300 hover:text-black"
              >
                <FiDownload size={14} />
                Export CSV
              </Button>

              <Button
                type="button"
                onClick={() => navigate(ROUTES.add)}
                className="flex items-center gap-2 rounded-lg bg-gray-800 px-3 py-2 text-xs font-medium text-white transition hover:bg-emerald-300 hover:text-black"
              >
                <FiPlus size={14} />
                Add Staff
              </Button>
            </div>
          }
        />

        <main className="space-y-5 px-4 py-5">
          <AllStaffStatusCards stats={stats} />

          <AllStaffTable
            staff={staff}
            loading={loading}
            error={error}
            onRetry={refresh}
            pagination={pagination}
            onPageChange={(page) =>
              setFilters((previous) => ({ ...previous, page }))
            }
            onPageSizeChange={(limit) =>
              setFilters((previous) => ({ ...previous, limit, page: 1 }))
            }
            searchTerm={searchInput}
            onSearchChange={setSearchInput}
            filters={filters}
            departments={lookups.departments}
            designations={lookups.designations}
            onFilterChange={handleFilterChange}
            onReset={handleReset}
            sortBy={filters.sort}
            sortDirection={filters.direction}
            onSort={handleSort}
            onView={(member) => navigate(ROUTES.view(member._id))}
            onEdit={(member) => navigate(ROUTES.edit(member._id))}
            onDelete={setDeleteTarget}
          />
        </main>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-sm rounded-xl border border-gray-800 bg-[#111111] p-5"
          >
            <h3 className="text-sm font-semibold text-white">
              Delete staff member?
            </h3>
            <p className="mt-2 text-xs text-gray-400">
              {deleteTarget.name} ({deleteTarget.staffCode}) will be removed
              from the list. Their attendance history is kept.
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-gray-700 px-3 py-2 text-xs text-gray-300 hover:bg-gray-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-500 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          role="status"
          className={`fixed top-4 right-4 z-50 rounded-lg border px-4 py-2.5 text-xs shadow-lg ${
            toast.type === "error"
              ? "border-red-500/30 bg-red-950 text-red-300"
              : "border-emerald-500/30 bg-emerald-950 text-emerald-300"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default AllStaff;
