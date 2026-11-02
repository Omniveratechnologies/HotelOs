import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { PiExportBold } from "react-icons/pi";

import Navbar from "../../components/ui/Navbar.jsx";
import Sidebar from "../../components/hamburger/SideBar.jsx";
import API_BASE_URL from "../../config/api.js";

import ExportReportStatusCard from "../../components/reports/ExportReportStatusCards.jsx";
import ReportFilters from "../../components/reports/ReportFilters.jsx";
import ReportPreview from "../../components/reports/ReportPreview.jsx";
import ExportFormats from "../../components/reports/ExportFormats.jsx";
import RecentExportedReports from "../../components/reports/RecentExportedReports.jsx";

import {
  REPORT_FILTERS,
  REPORT_META,
  formatRange,
} from "../../utils/exportReport.constants.js";

import { writePrintView } from "../../utils/printReport.js";

const REPORTS_API = `${API_BASE_URL}/v1/staffReports`;

const PREVIEW_LIMIT = 10;
const PRINT_LIMIT = 1000;
const HISTORY_LIMIT = 5;
const PENDING_STATUSES = ["QUEUED", "PROCESSING"];

const pad = (n) => String(n).padStart(2, "0");

const toISO = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const initialFilters = () => {
  const now = new Date();

  return {
    type: "ATTENDANCE",
    from: toISO(new Date(now.getFullYear(), now.getMonth(), 1)),
    to: toISO(now),
    departmentId: "",
    designationId: "",
    status: "",
    deviceId: "",
  };
};

const buildFilters = (f) => {
  const rules = REPORT_FILTERS[f.type];
  const out = {};

  if (rules.dateRange) {
    out.from = f.from;
    out.to = f.to;
  }

  if (rules.department && f.departmentId) {
    out.departmentId = f.departmentId;
  }

  if (rules.designation && f.designationId) {
    out.designationId = f.designationId;
  }

  if (rules.status && f.status) {
    out.status = f.status;
  }

  if (rules.device && f.deviceId) {
    out.deviceId = f.deviceId;
  }

  return out;
};

const getErrorMessage = async (err) => {
  const data = err?.response?.data;

  if (data instanceof Blob) {
    try {
      return JSON.parse(await data.text()).message || "Something went wrong.";
    } catch {
      return "Something went wrong.";
    }
  }

  return data?.message || err?.message || "Something went wrong.";
};

const EMPTY_PREVIEW = {
  columns: [],
  rows: [],
  total: 0,
  range: null,
  loading: false,
  error: "",
};

const ExportReports = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [filters, setFilters] = useState(initialFilters);

  const [options] = useState({
    departments: [],
    designations: [],
    devices: [],
  });

  const [preview, setPreview] = useState(EMPTY_PREVIEW);

  const [format, setFormat] = useState("XLSX");
  const [includePhotos, setIncludePhotos] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [history, setHistory] = useState({
    rows: [],
    pagination: {
      page: 1,
      limit: HISTORY_LIMIT,
      pages: 1,
    },
    loading: true,
  });

  const [downloadingId, setDownloadingId] = useState(null);
  const [notice, setNotice] = useState(null);

  const patchFilters = useCallback((patch) => {
    setFilters((prev) => ({ ...prev, ...patch }));

    if ("type" in patch) {
      setPreview(EMPTY_PREVIEW);
    }
  }, []);

  const validate = () => {
    if (
      REPORT_FILTERS[filters.type].dateRange &&
      (!filters.from || !filters.to)
    ) {
      return "Select a from and to date.";
    }

    return "";
  };

  const loadHistory = useCallback(async (page = 1, { silent = false } = {}) => {
    if (!silent) {
      setHistory((prev) => ({
        ...prev,
        loading: true,
      }));
    }

    try {
      const res = await axios.get(`${REPORTS_API}/export/history`, {
        params: {
          page,
          limit: HISTORY_LIMIT,
        },
      });

      setHistory({
        rows: res.data.data ?? [],
        pagination: res.data.pagination ?? {
          page,
          limit: HISTORY_LIMIT,
          pages: 1,
        },
        loading: false,
      });
    } catch (err) {
      console.error("Failed to load export history:", err);

      setHistory((prev) => ({
        ...prev,
        loading: false,
      }));
    }
  }, []);

  useEffect(() => {
    loadHistory(1);
  }, [loadHistory]);

  useEffect(() => {
    const hasPending = history.rows.some((row) =>
      PENDING_STATUSES.includes(row.status),
    );

    if (!hasPending) return undefined;

    const timer = setInterval(() => {
      loadHistory(history.pagination.page, {
        silent: true,
      });
    }, 3000);

    return () => clearInterval(timer);
  }, [history.rows, history.pagination.page, loadHistory]);

  useEffect(() => {
    if (!notice) return undefined;

    const timer = setTimeout(() => {
      setNotice(null);
    }, 6000);

    return () => clearTimeout(timer);
  }, [notice]);

  const requestPreview = async (limit) => {
    const res = await axios.post(`${REPORTS_API}/export/preview`, {
      type: filters.type,
      filters: buildFilters(filters),
      limit,
    });

    return res.data.data;
  };

  const handlePreview = async () => {
    const problem = validate();

    if (problem) {
      setPreview({
        ...EMPTY_PREVIEW,
        error: problem,
      });
      return;
    }

    setPreview({
      ...EMPTY_PREVIEW,
      loading: true,
    });

    try {
      const data = await requestPreview(PREVIEW_LIMIT);

      setPreview({
        columns: data.columns ?? [],
        rows: data.rows ?? [],
        total: data.total ?? 0,
        range: REPORT_FILTERS[filters.type].dateRange
          ? {
              from: filters.from,
              to: filters.to,
            }
          : null,
        loading: false,
        error:
          data.total === 0 ? "No records found for the selected filters." : "",
      });
    } catch (err) {
      setPreview({
        ...EMPTY_PREVIEW,
        error: await getErrorMessage(err),
      });
    }
  };

  const openPrintView = async () => {
    const win = window.open("", "_blank");

    if (!win) {
      setNotice({
        type: "error",
        message: "Allow pop-ups to open the print view.",
      });
      return;
    }

    win.document.write(
      "<p style='font-family:sans-serif'>Preparing print view...</p>",
    );

    setGenerating(true);

    try {
      const data = await requestPreview(PRINT_LIMIT);

      if (data.total === 0) {
        win.close();

        setNotice({
          type: "error",
          message: "No records found for the selected filters.",
        });

        return;
      }

      const range = REPORT_FILTERS[filters.type].dateRange
        ? formatRange({
            from: filters.from,
            to: filters.to,
          })
        : "";

      writePrintView(win, {
        title: REPORT_META[filters.type].label,
        subtitle: [range, `${data.rows.length} records`]
          .filter(Boolean)
          .join(" | "),
        columns: data.columns,
        rows: data.rows,
        total: data.total,
      });
    } catch (err) {
      win.close();

      setNotice({
        type: "error",
        message: await getErrorMessage(err),
      });
    } finally {
      setGenerating(false);
    }
  };

  const createExport = async () => {
    setGenerating(true);

    try {
      await axios.post(`${REPORTS_API}/export`, {
        type: filters.type,
        format,
        filters: buildFilters(filters),
        options: {
          includePhotos,
        },
      });

      setNotice({
        type: "success",
        message:
          "Report is being generated. It will appear in Recent Exported Reports.",
      });

      await loadHistory(1);
    } catch (err) {
      setNotice({
        type: "error",
        message: await getErrorMessage(err),
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerate = () => {
    const problem = validate();

    if (problem) {
      setNotice({
        type: "error",
        message: problem,
      });
      return;
    }

    if (format === "PRINT") {
      openPrintView();
    } else {
      createExport();
    }
  };

  const handleDownload = async (row) => {
    setDownloadingId(row.id);

    try {
      const res = await axios.get(
        `${REPORTS_API}/export/history/${row.id}/download`,
        {
          responseType: "blob",
        },
      );

      const url = URL.createObjectURL(res.data);
      const link = document.createElement("a");

      link.href = url;
      link.download = row.fileName || row.name;

      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
    } catch (err) {
      setNotice({
        type: "error",
        message: await getErrorMessage(err),
      });
    } finally {
      setDownloadingId(null);
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
          icon={<PiExportBold />}
          iconColor="text-emerald-400"
          bgColor="bg-emerald-950"
          title="Export Reports"
          subtitle="Generate and export attendance, staff, leave and other reports in different formats."
          breadcrumb="Manage Staff → Reports → Export Reports"
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          showPageHeading
          placeholder="Search staff, department, designation, etc.."
        />

        <main className="space-y-5 px-4 py-5">
          {notice && (
            <div
              role={notice.type === "error" ? "alert" : "status"}
              className={`rounded-lg border px-4 py-3 text-xs ${
                notice.type === "error"
                  ? "border-red-500/30 bg-red-500/10 text-red-400"
                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              }`}
            >
              {notice.message}
            </div>
          )}

          <ExportReportStatusCard
            selected={filters.type}
            onSelect={(type) =>
              patchFilters({
                type,
                status: "",
              })
            }
          />

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
            <div className="space-y-5">
              <ReportFilters
                values={filters}
                onChange={patchFilters}
                departments={options.departments}
                designations={options.designations}
                devices={options.devices}
              />

              <ExportFormats
                format={format}
                onFormatChange={setFormat}
                includePhotos={includePhotos}
                onIncludePhotosChange={setIncludePhotos}
                onGenerate={handleGenerate}
                generating={generating}
              />
            </div>

            <ReportPreview
              type={filters.type}
              range={preview.range}
              columns={preview.columns}
              rows={preview.rows}
              total={preview.total}
              limit={PREVIEW_LIMIT}
              loading={preview.loading}
              error={preview.error}
              onPreview={handlePreview}
            />
          </div>

          <RecentExportedReports
            rows={history.rows}
            loading={history.loading}
            pagination={history.pagination}
            onPageChange={(page) => loadHistory(page)}
            onDownload={handleDownload}
            downloadingId={downloadingId}
          />
        </main>
      </div>
    </div>
  );
};

export default ExportReports;
