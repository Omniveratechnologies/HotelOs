import { getHotelId, route } from "../../../utils/http.js";
import * as service from "../services/staffReport.service.js";
import * as report from "../services/monthlyReport.service.js";
import * as summary from "../services/monthlySummary.service.js";
import * as jobs from "../services/reportJob.service.js";
export const dailyReport = route(async (req, res) => {
  res.json({
    success: true,
    data: await service.getDailyReport(getHotelId(req), req.query),
  });
});
export const dailyRecords = route(async (req, res) => {
  const { rows, pagination } = await service.getDailyRecords(
    getHotelId(req),
    req.query,
  );
  res.json({ success: true, data: rows, pagination });
});

const actorOf = (req) => ({
  userId: req.user?._id || req.user?.id || null,
  name: req.user?.name || req.user?.fullName || "",
});

const csvCell = (value) => {
  const text = String(value ?? "");
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

const sendCsv = (res, filename, columns, rows, extraHeaders = {}) => {
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  for (const [name, value] of Object.entries(extraHeaders))
    res.setHeader(name, value);
  res.write(`\uFEFF${columns.map(([title]) => csvCell(title)).join(",")}\r\n`);
  for (const row of rows)
    res.write(`${columns.map(([, read]) => csvCell(read(row))).join(",")}\r\n`);
  res.end();
};

export const monthlyReport = route(async (req, res) => {
  const hotelId = getHotelId(req);
  const data = await report.getMonthlyReport(hotelId, req.query);
  data.lock = await summary.getLockInfo(hotelId, data.month, {
    departmentId: req.query.department_id,
  });
  if (data.lock.locked) data.kpis.totalStaff = data.lock.staffCount;
  res.json({ success: true, data });
});
export const monthlyStaff = route(async (req, res) => {
  const { rows, pagination } = await summary.getStaffTable(
    getHotelId(req),
    req.query,
  );
  res.json({ success: true, data: rows, pagination });
});

export const exportMonthly = route(async (req, res) => {
  const { month, rows } = await summary.getStaffExport(
    getHotelId(req),
    req.query,
  );
  sendCsv(res, `monthly-attendance-${month}.csv`, report.EXPORT_COLUMNS, rows);
});

export const payrollExport = route(async (req, res) => {
  const data = await summary.payrollExport(getHotelId(req), req.query);
  if (String(req.query.format).toLowerCase() === "csv") {
    return sendCsv(
      res,
      `payroll-attendance-${data.month}.csv`,
      summary.PAYROLL_COLUMNS,
      data.rows,
      { "X-Checksum": data.checksum },
    );
  }
  return res.json({ success: true, data });
});

export const lockStatus = route(async (req, res) => {
  const month = String(req.query.month ?? "");
  res.json({
    success: true,
    data: await summary.getLockInfo(getHotelId(req), month),
  });
});

export const lockMonth = route(async (req, res) => {
  const data = await summary.lockMonth(getHotelId(req), req.body, actorOf(req));
  res.json({
    success: true,
    message: `${data.month} locked for payroll.`,
    data,
  });
});

export const unlockMonth = route(async (req, res) => {
  const data = await summary.unlockMonth(
    getHotelId(req),
    req.body,
    actorOf(req),
  );
  res.json({ success: true, message: `${data.month} unlocked.`, data });
});

export const refreshMonth = route(async (req, res) => {
  const month = String(req.body?.month ?? "");
  const data = await summary.refreshMonth(getHotelId(req), month);
  res.json({ success: true, message: "Monthly summary rebuilt.", data });
});

export const previewReport = route(async (req, res) => {
  res.json({
    success: true,
    data: await jobs.preview(getHotelId(req), req.body),
  });
});

export const createExport = route(async (req, res) => {
  const data = await jobs.createExportJob(
    getHotelId(req),
    req.body,
    actorOf(req),
  );
  res.status(202).json({
    success: true,
    message: "Report is being generated.",
    data,
  });
});

export const listExports = route(async (req, res) => {
  const { rows, pagination } = await jobs.listJobs(getHotelId(req), req.query);
  res.json({ success: true, data: rows, pagination });
});

export const downloadExport = route(async (req, res) => {
  const { filePath, fileName } = await jobs.getDownload(
    getHotelId(req),
    req.params.id,
  );
  res.download(filePath, fileName);
});
