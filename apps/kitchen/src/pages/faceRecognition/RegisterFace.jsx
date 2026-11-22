import { useCallback, useEffect, useRef, useState } from "react";
import { FiPlayCircle, FiSmile } from "react-icons/fi";

import Navbar from "../components/ui/Navbar.jsx";
import Sidebar from "../components/hamburger/SideBar.jsx";
import ActionButton from "../components/ui/button/ActionButton.jsx";
import Toast from "../components/ui/Toast.jsx";

import FaceStatusCards from "../components/faceRecognition/FaceStatusCards.jsx";
import FaceStaffFilters from "../components/faceRecognition/FaceStaffFilters.jsx";
import FaceStaffListCard from "../components/faceRecognition/FaceStaffListCard.jsx";
import RegisterFacePanel from "../components/faceRecognition/RegisterFacePanel.jsx";
import FaceDetailModal from "../components/faceRecognition/FaceDetailModal.jsx";
import FaceDeleteDialog from "../components/faceRecognition/FaceDeleteDialog.jsx";
import HowToRegisterModal from "../components/faceRecognition/HowToRegisterModal.jsx";
import useDebounce from "../hooks/useDebounce.js";
import { api, del, query } from "../utils/faceUtils.js";

const emptyFilters = { department: "", faceStatus: "" };

const RegisterFace = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [filters, setFilters] = useState(emptyFilters);
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput.trim(), 350);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [summary, setSummary] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [list, setList] = useState({
    rows: [],
    pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
  });
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const [selected, setSelected] = useState(null);
  const [detailRow, setDetailRow] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [howOpen, setHowOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const panelRef = useRef(null);
  const closeToast = useCallback(() => setToast(null), []);
  const reload = useCallback(() => setRefreshKey((key) => key + 1), []);
  const notify = useCallback(
    (message, type = "success") => setToast({ type, message }),
    [],
  );

  useEffect(() => {
    const controller = new AbortController();
    api("/summary", { signal: controller.signal })
      .then((res) => setSummary(res.data))
      .catch(
        (err) => err.name !== "AbortError" && notify(err.message, "error"),
      );
    return () => controller.abort();
  }, [refreshKey, notify]);

  useEffect(() => {
    api("/filters")
      .then((res) => setDepartments(res.data.departments))
      .catch(() => setDepartments([]));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    api(
      `/staff?${query({ search, department_id: filters.department, face_status: filters.faceStatus, page, limit })}`,
      { signal: controller.signal },
    )
      .then((res) => setList({ rows: res.data, pagination: res.pagination }))
      .catch((err) => err.name !== "AbortError" && notify(err.message, "error"))
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [filters, search, page, limit, refreshKey, notify]);

  const updateFilter = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  const resetFilters = () => {
    setFilters(emptyFilters);
    setSearchInput("");
    setPage(1);
  };

  const chooseStaff = useCallback((row) => {
    setDetailRow(null);
    setSelected({
      _id: row._id,
      name: row.name,
      staffId: row.staffId,
      photoUrl: row.photoUrl,
      faceStatus: row.faceStatus,
      action: row.action,
    });
    requestAnimationFrame(() =>
      panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  }, []);

  const saved = (message) => {
    setSelected(null);
    notify(message);
    reload();
  };

  const confirmDelete = async (reason) => {
    setDeleting(true);
    try {
      await del(`/${deleteRow._id}`, { reason });
      notify(`Face data of ${deleteRow.name} deleted`);
      if (selected?._id === deleteRow._id) setSelected(null);
      setDeleteRow(null);
      setDetailRow(null);
      reload();
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setDeleting(false);
    }
  };

  const openDelete = useCallback((row) => setDeleteRow(row), []);
  const openDetail = useCallback((row) => setDetailRow(row), []);

  return (
    <div className="relative h-screen overflow-hidden bg-[#0f0f0f] text-white">
      <Sidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

      <div
        className={`h-full overflow-y-auto transition-[margin] duration-300 ease-in-out ${isMenuOpen ? "ml-64" : "ml-0"}`}
      >
        <Navbar
          icon={<FiSmile size={20} />}
          iconColor="text-emerald-400"
          bgColor="bg-emerald-950"
          title="Register Face"
          subtitle="Capture and register staff face for attendance using face recognition."
          breadcrumb="Dashboard → Face Recognition → Register Face"
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          showPageHeading
          pageAction={
            <ActionButton
              variant="outline"
              icon={<FiPlayCircle size={14} />}
              onClick={() => setHowOpen(true)}
            >
              How to Register?
            </ActionButton>
          }
        />

        <main className="space-y-5 px-4 py-5">
          <FaceStatusCards summary={summary} />

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="min-w-0 space-y-4">
              <FaceStaffFilters
                filters={filters}
                searchInput={searchInput}
                departments={departments}
                onSearchChange={(value) => {
                  setSearchInput(value);
                  setPage(1);
                }}
                onFilterChange={updateFilter}
                onReset={resetFilters}
              />
              <FaceStaffListCard
                rows={list.rows}
                pagination={list.pagination}
                page={page}
                limit={limit}
                loading={loading}
                selectedId={selected?._id}
                onPageChange={setPage}
                onLimitChange={(value) => {
                  setLimit(value);
                  setPage(1);
                }}
                onSelect={chooseStaff}
                onView={openDetail}
                onDelete={openDelete}
              />
            </div>

            <div
              ref={panelRef}
              className="min-w-0 xl:sticky xl:top-4 xl:self-start"
            >
              <RegisterFacePanel
                staff={selected}
                rules={summary?.rules}
                onStaffChange={setSelected}
                onSaved={saved}
                notify={notify}
              />
            </div>
          </div>
        </main>
      </div>

      <FaceDetailModal
        row={detailRow}
        onClose={() => setDetailRow(null)}
        onUpdate={chooseStaff}
        onDelete={openDelete}
      />
      <FaceDeleteDialog
        key={deleteRow?._id || "none"}
        row={deleteRow}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteRow(null)}
      />
      <HowToRegisterModal open={howOpen} onClose={() => setHowOpen(false)} />

      <Toast toast={toast} onClose={closeToast} />
    </div>
  );
};

export default RegisterFace;
