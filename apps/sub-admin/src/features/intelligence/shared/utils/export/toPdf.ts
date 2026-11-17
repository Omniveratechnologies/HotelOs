// Builds a clean, printable PDF report: a title block, a KPI summary, the AI Insights card,
// then one auto-paginated table per section. This is a genuine formatted report (not a
// screenshot of the page), so it stays legible and consistent across every dashboard.
import { jsPDF } from "jspdf";
import * as autoTablePlugin from "jspdf-autotable";
import { getReportSections } from "./sections";
import type { DashboardData } from "../../types";

type AutoTableFn = (doc: jsPDF, options: Record<string, unknown>) => void;

const pluginRecord = autoTablePlugin as unknown as Record<string, unknown>;
const autoTable = (pluginRecord.autoTable ||
  (pluginRecord.default as Record<string, unknown> | undefined)?.default ||
  pluginRecord.default) as AutoTableFn;
const ACCENT = [21, 122, 112] as const;
const MUTED = [107, 118, 134] as const;
const money = (v: unknown) =>
  v == null ? "—" : `Rs. ${Math.round(Number(v)).toLocaleString("en-IN")}`;
const pctf = (v: unknown) => (v == null ? "—" : `${Number(v).toFixed(1)}%`);

function formatCell(value: unknown, type?: string) {
  if (value == null || value === "") return "—";
  if (type === "money") return money(value);
  if (type === "percent") return pctf(value);
  if (type === "number")
    return Math.round(Number(value)).toLocaleString("en-IN");
  return String(value);
}

export function buildPdf(id: string, data: DashboardData) {
  const { meta, kpis, tables, insights } = getReportSections(id, data);
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;

  // -- Header --
  doc.setFillColor(ACCENT[0], ACCENT[1], ACCENT[2]);
  doc.rect(0, 0, pageWidth, 64, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(meta.title, margin, 30);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(meta.subtitle || "", margin, 46);

  doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  doc.setFontSize(9);
  const rangeMap: Record<string, string> = {
    "7d": "7 Days",
    "30d": "30 Days",
    "90d": "90 Days",
    "12m": "12 Months",
  };
  const rangeLabel = rangeMap[meta.range] || meta.range;
  doc.text(
    `${meta.hotel}  ·  Range: ${rangeLabel}  ·  Source: ${meta.source === "demo" ? "Synthetic demo data" : "Live hotel data"}  ·  Generated ${new Date(meta.generatedAt).toLocaleString()}`,
    margin,
    80,
  );

  // -- KPI summary --
  let y = 96;
  autoTable(doc, {
    startY: y,
    head: [["KPI", "Value", "Change vs previous"]],
    body: kpis.map((k: { label: string; value: string; change?: string }) => [
      k.label,
      k.value,
      k.change ?? "—",
    ]),
    theme: "grid",
    headStyles: { fillColor: [ACCENT[0], ACCENT[1], ACCENT[2]], fontSize: 9 },
    styles: { fontSize: 9, cellPadding: 5 },
    margin: { left: margin, right: margin },
  });
  y =
    (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + 18;

  // -- AI Insights --
  if (insights) {
    const rows = [
      ["Top Insight", insights.topInsight],
      ["Opportunity", insights.opportunity],
      ["Risk", insights.risk],
      ["Recommendation", insights.recommendation],
    ];
    autoTable(doc, {
      startY: y,
      head: [["AI Insights", ""]],
      body: rows,
      theme: "striped",
      headStyles: { fillColor: [30, 41, 59], fontSize: 9 },
      styles: { fontSize: 9, cellPadding: 5 },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 110 } },
      margin: { left: margin, right: margin },
    });
    y =
      (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
        .finalY + 20;
  }

  // -- One table per section, each starting fresh if it won't fit --
  tables.forEach(
    (table: {
      title: string;
      columns: { header: string; type?: string }[];
      rows: unknown[][];
    }) => {
      if (y > doc.internal.pageSize.getHeight() - 120) {
        doc.addPage();
        y = margin;
      }
      doc.setTextColor(30, 41, 59);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(table.title, margin, y);
      autoTable(doc, {
        startY: y + 8,
        head: [table.columns.map((c) => c.header)],
        body: table.rows.map((row) =>
          row.map((v, i) => formatCell(v, table.columns[i].type)),
        ),
        theme: "grid",
        headStyles: {
          fillColor: [235, 233, 224],
          textColor: [30, 41, 59],
          fontSize: 8.5,
        },
        styles: { fontSize: 8.5, cellPadding: 4 },
        margin: { left: margin, right: margin },
        didDrawPage: () => {
          y = margin;
        },
      });
      y =
        (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
          .finalY + 24;
    },
  );

  // -- Footer page numbers --
  const pageCount = (
    doc.internal as unknown as { getNumberOfPages: () => number }
  ).getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth - margin - 60,
      doc.internal.pageSize.getHeight() - 20,
    );
  }

  return doc;
}

export function downloadPdf(id: string, data: DashboardData, filename: string) {
  buildPdf(id, data).save(filename);
}
