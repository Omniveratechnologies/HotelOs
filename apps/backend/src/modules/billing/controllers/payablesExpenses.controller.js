import BillingEntity from "../models/BillingEntity.js";

const value = (number) => Number(number || 0);
const unwrap = (row) => ({
  ...row.data,
  id: row._id,
  createdAt: row.createdAt,
  status: row.status,
  amount: value(row.amount),
});
const list = (hotelId, entityType) =>
  BillingEntity.find({ hotelId, entityType })
    .sort({ createdAt: -1 })
    .limit(1000)
    .lean();
const daysUntil = (date) =>
  Math.ceil((new Date(date || Date.now()).getTime() - Date.now()) / 86400000);
const payableStatus = (row) => {
  const balance = Math.max(0, value(row.amount || row.total) - value(row.paid));
  if (balance === 0 && value(row.amount || row.total) > 0) return "paid";
  if (row.approvalStatus === "draft") return "draft";
  if (row.dueDate && new Date(row.dueDate) < new Date()) return "overdue";
  if (value(row.paid) > 0) return "partial";
  return "pending";
};

const payableRows = async (hotelId) =>
  (await list(hotelId, "payable")).map(unwrap).map((row) => ({
    ...row,
    balance: Math.max(0, value(row.amount || row.total) - value(row.paid)),
    status: payableStatus(row),
  }));

export const listPayables = async (req, res) => {
  const q = String(req.query.q || "").toLowerCase();
  const rows = (await payableRows(req.user.hotelId)).filter(
    (row) =>
      (!req.query.status ||
        req.query.status === "all" ||
        row.status === req.query.status) &&
      (!q ||
        `${row.vendorName} ${row.vendor} ${row.billNo} ${row.invoiceNo}`
          .toLowerCase()
          .includes(q)),
  );
  return res.json({ success: true, data: rows });
};

export const payablesSummary = async (req, res) => {
  const rows = await payableRows(req.user.hotelId);
  const pending = rows.filter((row) =>
    ["pending", "partial"].includes(row.status),
  );
  const overdue = rows.filter((row) => row.status === "overdue");
  const paidThisMonth = rows.filter(
    (row) =>
      row.status === "paid" &&
      new Date(row.paidOn || row.createdAt).getMonth() ===
        new Date().getMonth(),
  );
  const categories = [
    "Food & Beverages",
    "Utilities",
    "Housekeeping",
    "Maintenance",
    "Marketing",
    "Others",
  ];
  return res.json({
    success: true,
    data: {
      metrics: {
        totalPayables: rows.reduce((sum, row) => sum + row.balance, 0),
        pendingPayments: pending.reduce((sum, row) => sum + row.balance, 0),
        paidThisMonth: paidThisMonth.reduce(
          (sum, row) => sum + value(row.paid),
          0,
        ),
        overdueAmount: overdue.reduce((sum, row) => sum + row.balance, 0),
        overdueCount: overdue.length,
        supplierCount: new Set(
          rows.map((row) => row.vendorId || row.vendorName || row.vendor),
        ).size,
      },
      category: categories.map((category) => ({
        category,
        amount: rows
          .filter((row) => (row.category || "Others") === category)
          .reduce((sum, row) => sum + row.balance, 0),
      })),
      trend: ["Apr", "May", "Jun", "Jul", "Aug", "Sep"].map((month) => ({
        month,
        bills: rows
          .filter(
            (row) =>
              new Date(row.billDate || row.createdAt).toLocaleString("en-IN", {
                month: "short",
              }) === month,
          )
          .reduce((sum, row) => sum + value(row.amount || row.total), 0),
        payments: rows
          .filter(
            (row) =>
              new Date(row.paidOn || row.createdAt).toLocaleString("en-IN", {
                month: "short",
              }) === month,
          )
          .reduce((sum, row) => sum + value(row.paid), 0),
      })),
      status: ["paid", "pending", "overdue"].map((status) => ({
        status,
        count: rows.filter((row) => row.status === status).length,
        amount: rows
          .filter((row) => row.status === status)
          .reduce((sum, row) => sum + row.balance, 0),
      })),
      upcoming: rows
        .filter(
          (row) =>
            row.balance > 0 &&
            daysUntil(row.dueDate) >= 0 &&
            daysUntil(row.dueDate) <= 15,
        )
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        .slice(0, 8),
      recentPayments: rows.filter((row) => value(row.paid) > 0).slice(0, 8),
      rows,
    },
  });
};

export const createPayable = async (req, res) => {
  const {
    billNo,
    vendorId,
    vendorName,
    amount,
    total,
    approvalStatus = "submitted",
  } = req.body;
  if (!billNo?.trim() || !(vendorId || vendorName)?.toString().trim())
    return res
      .status(400)
      .json({ success: false, message: "Bill number and vendor are required" });
  if (value(amount || total) <= 0)
    return res
      .status(400)
      .json({
        success: false,
        message: "Bill amount must be greater than zero",
      });
  const duplicate = await BillingEntity.findOne({
    hotelId: req.user.hotelId,
    entityType: "payable",
    "data.billNo": billNo.trim(),
    $or: [{ "data.vendorId": vendorId }, { "data.vendorName": vendorName }],
  });
  if (duplicate)
    return res
      .status(409)
      .json({ success: false, message: "This vendor bill already exists" });
  const row = await BillingEntity.create({
    hotelId: req.user.hotelId,
    entityType: "payable",
    status: approvalStatus === "draft" ? "draft" : "pending",
    reference: billNo.trim(),
    amount: value(amount || total),
    data: {
      ...req.body,
      billNo: billNo.trim(),
      paid: 0,
      balance: value(amount || total),
      approvalStatus,
    },
    createdBy: req.user._id,
  });
  return res.status(201).json({ success: true, data: unwrap(row.toObject()) });
};

export const approvePayable = async (req, res) => {
  const row = await BillingEntity.findOne({
    _id: req.params.id,
    hotelId: req.user.hotelId,
    entityType: "payable",
  });
  if (!row)
    return res
      .status(404)
      .json({ success: false, message: "Payable bill not found" });
  row.status = "pending";
  row.data = {
    ...row.data,
    approvalStatus: "approved",
    approvedBy: req.user._id,
    approvedAt: new Date(),
  };
  await row.save();
  return res.json({ success: true, data: unwrap(row.toObject()) });
};

export const createVendorPayment = async (req, res) => {
  const amount = value(req.body.amount);
  if (amount <= 0)
    return res
      .status(400)
      .json({
        success: false,
        message: "Payment amount must be greater than zero",
      });
  const allocations =
    req.body.allocations ||
    (req.body.billId ? [{ billId: req.body.billId, amount }] : []);
  for (const allocation of allocations) {
    const bill = await BillingEntity.findOne({
      _id: allocation.billId,
      hotelId: req.user.hotelId,
      entityType: "payable",
    });
    if (!bill) continue;
    const balance = Math.max(0, value(bill.amount) - value(bill.data?.paid));
    if (value(allocation.amount) > balance)
      return res
        .status(400)
        .json({
          success: false,
          message: "Payment cannot exceed bill balance",
        });
    const paid = value(bill.data?.paid) + value(allocation.amount);
    bill.data = {
      ...bill.data,
      paid,
      balance: value(bill.amount) - paid,
      paidOn: req.body.paidOn || new Date(),
      paymentMode: req.body.mode,
      paymentReference: req.body.reference,
    };
    bill.status = paid >= value(bill.amount) ? "paid" : "partial";
    await bill.save();
  }
  const payment = await BillingEntity.create({
    hotelId: req.user.hotelId,
    entityType: "vendor-payment",
    status: "posted",
    reference: req.body.reference || `VP-${Date.now()}`,
    amount,
    data: { ...req.body, allocations },
    createdBy: req.user._id,
  });
  return res
    .status(201)
    .json({ success: true, data: unwrap(payment.toObject()) });
};

export const createPaymentBatch = createVendorPayment;

export const createExpense = async (req, res) => {
  const amount = value(req.body.amount);
  if (!req.body.description?.trim() || amount <= 0)
    return res
      .status(400)
      .json({
        success: false,
        message: "Description and a positive amount are required",
      });
  const row = await BillingEntity.create({
    hotelId: req.user.hotelId,
    entityType: "expense",
    status: req.body.status || "paid",
    reference: req.body.description.trim(),
    amount,
    data: {
      ...req.body,
      amount,
      paymentStatus: req.body.status || "paid",
      createdBy: req.user._id,
    },
    createdBy: req.user._id,
  });
  if (req.body.status === "pending")
    await BillingEntity.create({
      hotelId: req.user.hotelId,
      entityType: "payable",
      status: "pending",
      reference: `EXP-${row._id}`,
      amount,
      data: {
        billNo: `EXP-${row._id}`,
        vendorName: req.body.vendorName,
        category: req.body.category,
        amount,
        paid: 0,
        balance: amount,
        sourceExpenseId: row._id,
        dueDate: req.body.dueDate,
      },
      createdBy: req.user._id,
    });
  return res.status(201).json({ success: true, data: unwrap(row.toObject()) });
};

export const bulkUploadExpenses = async (req, res) => {
  const drafts = Array.isArray(req.body?.files)
    ? req.body.files.map((file) => ({
        fileName: file.fileName || file.name,
        status: "draft",
        extracted: {
          vendorName: "",
          description: file.fileName || file.name || "",
          amount: 0,
          category: "Others",
        },
      }))
    : [];
  const row = await BillingEntity.create({
    hotelId: req.user.hotelId,
    entityType: "expense",
    status: "draft",
    reference: `BULK-${Date.now()}`,
    data: { bulkUpload: true, drafts },
    createdBy: req.user._id,
  });
  return res
    .status(201)
    .json({ success: true, data: { batchId: row._id, drafts } });
};

export const listExpenses = async (req, res) => {
  const q = String(req.query.q || "").toLowerCase();
  const rows = (await list(req.user.hotelId, "expense"))
    .map(unwrap)
    .filter(
      (row) =>
        !q ||
        `${row.description} ${row.vendorName} ${row.category}`
          .toLowerCase()
          .includes(q),
    );
  return res.json({ success: true, data: rows });
};

export const expenseSummary = async (req, res) => {
  const rows = (await list(req.user.hotelId, "expense")).map(unwrap);
  const categories = [
    "Utilities",
    "Food & Beverages",
    "Housekeeping",
    "Maintenance",
    "Marketing",
    "Administration",
    "Others",
  ];
  const total = rows.reduce((sum, row) => sum + value(row.amount), 0);
  return res.json({
    success: true,
    data: {
      metrics: {
        total,
        paid: rows
          .filter(
            (row) => row.paymentStatus === "paid" || row.status === "paid",
          )
          .reduce((sum, row) => sum + value(row.amount), 0),
        pending: rows
          .filter(
            (row) =>
              row.paymentStatus === "pending" || row.status === "pending",
          )
          .reduce((sum, row) => sum + value(row.amount), 0),
        vendors: new Set(rows.map((row) => row.vendorId || row.vendorName))
          .size,
        average: total / Math.max(1, 6),
      },
      category: categories.map((category) => ({
        category,
        amount: rows
          .filter((row) => (row.category || "Others") === category)
          .reduce((sum, row) => sum + value(row.amount), 0),
      })),
      trend: ["Apr", "May", "Jun", "Jul", "Aug", "Sep"].map((month) => ({
        month,
        amount: rows
          .filter(
            (row) =>
              new Date(row.date || row.createdAt).toLocaleString("en-IN", {
                month: "short",
              }) === month,
          )
          .reduce((sum, row) => sum + value(row.amount), 0),
      })),
      recurring: (await list(req.user.hotelId, "recurring-expense"))
        .map(unwrap)
        .slice(0, 8),
      rows: rows.slice(0, 100),
    },
  });
};

export const createRecurringExpense = async (req, res) => {
  const row = await BillingEntity.create({
    hotelId: req.user.hotelId,
    entityType: "recurring-expense",
    status: "active",
    reference: req.body.description || "Recurring expense",
    amount: value(req.body.amount),
    data: { ...req.body, nextDate: req.body.nextDate || req.body.nextRunDate },
    createdBy: req.user._id,
  });
  return res.status(201).json({ success: true, data: unwrap(row.toObject()) });
};
