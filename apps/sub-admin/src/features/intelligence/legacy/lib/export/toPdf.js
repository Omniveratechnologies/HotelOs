// Builds a clean, printable PDF report: a title block, a KPI summary, the AI Insights card,
// then one auto-paginated table per section. This is a genuine formatted report (not a
// screenshot of the page), so it stays legible and consistent across every dashboard.
import jsPDF from "jspdf";
import * as autoTablePlugin from "jspdf-autotable";
import { getReportSections } from "./sections";

const autoTable =
  autoTablePlugin.autoTable ||
  autoTablePlugin.default?.default ||
  autoTablePlugin.default;
const ACCENT = [21, 122, 112]; // matches --accent in globals.css
const MUTED = [107, 118, 134];
const money = (v) =>
  v == null ? "—" : `Rs. ${Math.round(v).toLocaleString("en-IN")}`;
const pctf = (v) => (v == null ? "—" : `${Number(v).toFixed(1)}%`);

function formatCell(value, type) {
  if (value == null || value === "") return "—";
  if (type === "money") return money(value);
  if (type === "percent") return pctf(value);
  if (type === "number") return Math.round(value).toLocaleString("en-IN");
  return String(value);
}

export function buildPdf(id, data) {
  const { meta, kpis, tables, insights } = getReportSections(id, data);
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;

  // -- Header --
  doc.setFillColor(...ACCENT);
  doc.rect(0, 0, pageWidth, 64, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(meta.title, margin, 30);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(meta.subtitle || "", margin, 46);

  doc.setTextColor(...MUTED);
  doc.setFontSize(9);
  const rangeLabel =
    { "7d": "7 Days", "30d": "30 Days", "90d": "90 Days", "12m": "12 Months" }[
      meta.range
    ] || meta.range;
  doc.text(
    `${meta.hotel}  ·  Range: ${rangeLabel}  ·  Source: ${meta.source === "demo" ? "Synthetic demo data" : "Live MongoDB"}  ·  Generated ${new Date(meta.generatedAt).toLocaleString()}`,
    margin,
    80,
  );

  // -- KPI summary --
  let y = 96;
  autoTable(doc, {
    startY: y,
    head: [["KPI", "Value", "Change vs previous"]],
    body: kpis.map((k) => [k.label, k.value, k.change ?? "—"]),
    theme: "grid",
    headStyles: { fillColor: ACCENT, fontSize: 9 },
    styles: { fontSize: 9, cellPadding: 5 },
    margin: { left: margin, right: margin },
  });
  y = doc.lastAutoTable.finalY + 18;

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
    y = doc.lastAutoTable.finalY + 20;
  }

  // -- One table per section, each starting fresh if it won't fit --
  tables.forEach((table) => {
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
    y = doc.lastAutoTable.finalY + 24;
  });

  // -- Footer page numbers --
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth - margin - 60,
      doc.internal.pageSize.getHeight() - 20,
    );
  }

  return doc;
}

export function downloadPdf(id, data, filename) {
  buildPdf(id, data).save(filename);
}
