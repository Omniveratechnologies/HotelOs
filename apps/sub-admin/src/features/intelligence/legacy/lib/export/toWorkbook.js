// Builds an analysis-ready .xlsx: raw numeric values (not pre-formatted strings) so the person
// receiving it can sum/pivot/chart it themselves in Excel — only the cell's *display* format
// (currency/percent) is styled, the underlying value stays numeric wherever it can.
import * as XLSX from "xlsx";
import { getReportSections } from "./sections";

const FORMATS = { money: '"₹"#,##0', percent: '0.0"%"', number: "#,##0" };

function sheetFromTable(table) {
  const header = table.columns.map((c) => c.header);
  const aoa = [header, ...table.rows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  table.columns.forEach((c, colIdx) => {
    if (c.type === "text") return;
    for (let r = 1; r < aoa.length; r++) {
      const addr = XLSX.utils.encode_cell({ r, c: colIdx });
      if (ws[addr] && typeof ws[addr].v === "number")
        ws[addr].z = FORMATS[c.type];
    }
  });
  ws["!cols"] = table.columns.map((c) => ({
    wch: Math.max(c.header.length + 2, 14),
  }));
  return ws;
}

const safeSheetName = (name) => name.replace(/[\\/*?:[\]]/g, "").slice(0, 31);

export function buildWorkbook(id, data) {
  const { meta, kpis, tables, insights } = getReportSections(id, data);
  const wb = XLSX.utils.book_new();

  const overview = [
    [meta.title],
    [meta.subtitle],
    [],
    ["Hotel", meta.hotel],
    ["Date range", meta.range],
    [
      "Data source",
      meta.source === "demo" ? "Synthetic demo data" : "Live MongoDB",
    ],
    ["Generated", new Date(meta.generatedAt).toLocaleString()],
    [],
    ["KPI", "Value", "Change vs previous"],
    ...kpis.map((k) => [k.label, k.value, k.change]),
  ];
  if (insights) {
    overview.push([], ["AI Insights", ""]);
    overview.push(["Top Insight", insights.topInsight]);
    overview.push(["Opportunity", insights.opportunity]);
    overview.push(["Risk", insights.risk]);
    overview.push(["Recommendation", insights.recommendation]);
  }
  const overviewSheet = XLSX.utils.aoa_to_sheet(overview);
  overviewSheet["!cols"] = [{ wch: 32 }, { wch: 40 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, overviewSheet, "Overview");

  const usedNames = new Set(["Overview"]);
  tables.forEach((table) => {
    let name = safeSheetName(table.title);
    let i = 2;
    while (usedNames.has(name)) name = safeSheetName(`${table.title} (${i++})`);
    usedNames.add(name);
    XLSX.utils.book_append_sheet(wb, sheetFromTable(table), name);
  });

  return wb;
}

export function downloadWorkbook(id, data, filename) {
  const wb = buildWorkbook(id, data);
  XLSX.writeFile(wb, filename);
}
