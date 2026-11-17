import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import type { DashboardData } from "../types";

const RANGE_LABEL: Record<string, string> = {
  "7d": "7d",
  "30d": "30d",
  "90d": "90d",
  "12m": "12m",
};

function filenameFor(id: string, range?: string, ext?: string) {
  const stamp = new Date().toISOString().slice(0, 10);
  const r = range ? RANGE_LABEL[range] || range : "all";
  return `hotelos-${id}-${r}-${stamp}.${ext}`;
}

export interface DownloadMenuProps {
  id: string;
  data: DashboardData | null;
}

export function DownloadMenu({ id, data }: DownloadMenuProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<"pdf" | "xlsx" | null>(null);
  const [error, setError] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function exportPdf() {
    setBusy("pdf");
    setError("");
    setOpen(false);
    try {
      const { downloadPdf } = await import("../utils/export/toPdf");
      downloadPdf(id, data, filenameFor(id, data.range, "pdf"));
    } catch (e) {
      console.error(e);
      setError("Could not generate the PDF.");
    } finally {
      setBusy(null);
    }
  }

  async function exportExcel() {
    setBusy("xlsx");
    setError("");
    setOpen(false);
    try {
      const { downloadWorkbook } = await import("../utils/export/toWorkbook");
      downloadWorkbook(id, data, filenameFor(id, data.range, "xlsx"));
    } catch (e) {
      console.error(e);
      setError("Could not generate the Excel file.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div style={{ position: "relative" }} ref={ref}>
      <button
        type="button"
        className="range-tabs"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 13px",
          cursor: data ? "pointer" : "default",
          opacity: data ? 1 : 0.5,
        }}
        onClick={() => data && setOpen((v) => !v)}
        disabled={!data || !!busy}
      >
        <Icon name={busy ? "Activity" : "FileBarChart"} size={14} />
        {busy ? `Generating ${busy.toUpperCase()}…` : "Download"}
        <Icon name="ChevronDown" size={13} />
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "110%",
            background: "#fff",
            border: "1px solid var(--border)",
            borderRadius: 10,
            boxShadow: "var(--shadow)",
            minWidth: 190,
            zIndex: 20,
            overflow: "hidden",
          }}
        >
          <MenuItem
            icon="FileBarChart"
            label="Export as PDF report"
            onClick={exportPdf}
          />
          <MenuItem
            icon="Boxes"
            label="Export as Excel workbook"
            onClick={exportExcel}
          />
        </div>
      )}
      {error && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "110%",
            marginTop: open ? 84 : 0,
            fontSize: 11.5,
            color: "var(--danger)",
            whiteSpace: "nowrap",
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
}: {
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 9,
        width: "100%",
        border: "none",
        background: "none",
        padding: "10px 13px",
        fontSize: 13,
        cursor: "pointer",
        textAlign: "left",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#faf9f5")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
    >
      <Icon name={icon} size={15} style={{ color: "var(--accent)" }} /> {label}
    </button>
  );
}

export default DownloadMenu;
