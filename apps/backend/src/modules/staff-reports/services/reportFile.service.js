import fs from "node:fs";
import path from "node:path";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

export const FORMATS = {
  XLSX: { ext: "xlsx" },
  CSV: { ext: "csv" },
  PDF: { ext: "pdf" },
};

const ROOT = path.resolve(process.env.REPORTS_DIR || "uploads/reports");

export const absolutePath = (fileKey) => {
  const full = path.resolve(ROOT, fileKey);
  if (!full.startsWith(ROOT + path.sep)) throw new Error("Invalid file key.");
  return full;
};

const csvCell = (value) => {
  const text = String(value ?? "");
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text; // block formula injection
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

const writeCsv = async (file, { columns, rows }) => {
  const lines = [columns.map((c) => csvCell(c.title)).join(",")];
  for (const row of rows)
    lines.push(columns.map((c) => csvCell(row[c.key])).join(","));
  await fs.promises.writeFile(file, `\uFEFF${lines.join("\r\n")}\r\n`, "utf8");
};

const writeXlsx = async (file, { title, columns, rows }) => {
  const wb = new ExcelJS.Workbook();
  wb.created = new Date();
  const ws = wb.addWorksheet(title.slice(0, 31));

  ws.columns = columns.map((c) => ({
    header: c.title,
    key: c.key,
    width: Math.max(12, c.title.length + 4),
  }));

  const head = ws.getRow(1);
  head.font = { bold: true, color: { argb: "FFFFFFFF" } };
  head.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF166534" },
  };
  ws.views = [{ state: "frozen", ySplit: 1 }];

  for (const row of rows) ws.addRow(row);
  await wb.xlsx.writeFile(file);
};

const writePdf = async (file, { title, subtitle, columns, rows }) => {
  const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 30 });
  const out = fs.createWriteStream(file);
  doc.pipe(out);

  const left = 30;
  const rowH = 20;
  const colW = (doc.page.width - left * 2) / columns.length;
  const bottom = doc.page.height - 30;

  doc.font("Helvetica-Bold").fontSize(14).text(title, left, 30);
  doc.font("Helvetica").fontSize(8).fillColor("#555").text(subtitle, left);
  doc.fillColor("#000");

  const drawHeader = (y) => {
    doc.font("Helvetica-Bold").fontSize(7);
    columns.forEach((c, i) =>
      doc.text(c.title, left + i * colW + 2, y, {
        width: colW - 4,
        height: rowH - 4,
        ellipsis: true,
      }),
    );
    doc
      .moveTo(left, y + rowH - 4)
      .lineTo(left + colW * columns.length, y + rowH - 4)
      .stroke();
    doc.font("Helvetica").fontSize(7);
    return y + rowH;
  };

  let y = drawHeader(doc.y + 10);

  for (const row of rows) {
    if (y + rowH > bottom) {
      doc.addPage();
      y = drawHeader(30);
    }
    columns.forEach((c, i) =>
      doc.text(String(row[c.key] ?? ""), left + i * colW + 2, y, {
        width: colW - 4,
        height: rowH - 4,
        ellipsis: true,
      }),
    );
    y += rowH;
  }

  await new Promise((resolve, reject) => {
    out.on("finish", resolve);
    out.on("error", reject);
    doc.end();
  });
};

const WRITERS = { XLSX: writeXlsx, CSV: writeCsv, PDF: writePdf };

export async function writeReportFile(format, { fileKey, ...content }) {
  const file = absolutePath(fileKey);
  await fs.promises.mkdir(path.dirname(file), { recursive: true });
  await WRITERS[format](file, content);
  const { size } = await fs.promises.stat(file);
  return { size };
}
