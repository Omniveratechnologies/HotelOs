import Bill from "../models/Bill.js";
import BillingEntity from "../models/BillingEntity.js";
import InvoiceSeries from "../models/InvoiceSeries.js";

const financialYear = (date = new Date()) => {
  const year =
    date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;
  return `${year}-${String(year + 1).slice(-2)}`;
};

const nextNumber = async (hotelId, type, date) => {
  const fy = financialYear(date);
  const prefix =
    type === "credit_note"
      ? "CN"
      : type === "proforma"
        ? "PRO"
        : type === "receipt"
          ? "RCT"
          : "INV";
  const series = await InvoiceSeries.findOneAndUpdate(
    { hotelId, type, financialYear: fy },
    { $setOnInsert: { prefix, lastNumber: 1000 }, $inc: { lastNumber: 1 } },
    { upsert: true, new: true },
  );
  return {
    invoiceNo: `${prefix}-${fy.split("-")[0]}-${series.lastNumber}`,
    financialYear: fy,
  };
};

const invoiceRows = async (hotelId, query = {}) => {
  const filter = { hotelId, entityType: "invoice" };
  if (query.status) filter.status = query.status;
  const rows = await BillingEntity.find(filter)
    .sort({ createdAt: -1 })
    .limit(Math.min(Number(query.limit || 250), 500))
    .lean();
  return rows.map((row) => ({
    ...row.data,
    ...row,
    id: row._id,
    invoiceNo: row.reference,
    amount: row.amount,
  }));
};

export const listInvoices = async (req, res) => {
  const rows = await invoiceRows(req.user.hotelId, req.query);
  return res.json({ success: true, data: rows });
};

export const invoiceSummary = async (req, res) => {
  const rows = await invoiceRows(req.user.hotelId, req.query);
  const amount = (items) =>
    items.reduce((total, row) => total + Number(row.amount || 0), 0);
  return res.json({
    success: true,
    data: {
      metrics: {
        total: amount(rows),
        totalCount: rows.length,
        paid: amount(rows.filter((row) => row.status === "paid")),
        paidCount: rows.filter((row) => row.status === "paid").length,
        pending: amount(rows.filter((row) => row.status === "pending")),
        pendingCount: rows.filter((row) => row.status === "pending").length,
        cancelled: amount(
          rows.filter((row) => ["cancelled", "refunded"].includes(row.status)),
        ),
        cancelledCount: rows.filter((row) =>
          ["cancelled", "refunded"].includes(row.status),
        ).length,
        corporate: amount(rows.filter((row) => row.type === "corporate")),
        corporateCount: rows.filter((row) => row.type === "corporate").length,
      },
      rows,
    },
  });
};

export const getInvoice = async (req, res) => {
  const invoice = await BillingEntity.findOne({
    _id: req.params.id,
    hotelId: req.user.hotelId,
    entityType: "invoice",
  }).lean();
  if (!invoice)
    return res
      .status(404)
      .json({ success: false, message: "Invoice not found" });
  return res.json({
    success: true,
    data: {
      ...invoice.data,
      ...invoice,
      id: invoice._id,
      invoiceNo: invoice.reference,
    },
  });
};

const createInvoiceRecord = async (req, res, type = "tax") => {
  const {
    folioId,
    billTo,
    placeOfSupply,
    amount,
    items = [],
    parentInvoiceId,
  } = req.body;
  let bill = null;
  if (folioId)
    bill = await Bill.findOne({
      _id: folioId,
      hotelId: req.user.hotelId,
    }).lean();
  if (folioId && !bill)
    return res.status(404).json({ success: false, message: "Folio not found" });
  const date = new Date();
  const numbering = await nextNumber(req.user.hotelId, type, date);
  const total = Number(amount ?? bill?.totalAmount ?? 0);
  const invoice = await BillingEntity.create({
    hotelId: req.user.hotelId,
    entityType: "invoice",
    status: type === "proforma" ? "pending" : "pending",
    reference: numbering.invoiceNo,
    amount: total,
    businessDate: date,
    createdBy: req.user._id,
    data: {
      type,
      financialYear: numbering.financialYear,
      folioId,
      bookingNo: bill?.bookingId || "",
      guestName: bill?.guestName || "",
      guestPhone: bill?.guestPhone || "",
      guestEmail: bill?.guestEmail || "",
      billTo: billTo || bill?.guestName || "",
      placeOfSupply: placeOfSupply || "",
      subtotal: Number(bill?.subtotal || total),
      discount: Number(bill?.discountAmount || 0),
      serviceCharge: Number(
        bill?.serviceCharges?.reduce(
          (sum, item) => sum + Number(item.amount || 0),
          0,
        ) || 0,
      ),
      cgst: Number(bill?.cgst || 0),
      sgst: Number(bill?.sgst || 0),
      grandTotal: total,
      paidAmount: 0,
      balanceDue: total,
      items: items.length
        ? items
        : (bill?.items || []).map((item) => ({
            description: item.name,
            qty: item.quantity,
            rate: item.price,
            amount: Number(item.price || 0) * Number(item.quantity || 1),
            hsnSac: item.hsnSac || "996311",
            taxRate: 18,
          })),
      parentInvoiceId,
    },
  });
  return res
    .status(201)
    .json({
      success: true,
      data: {
        ...invoice.data,
        ...invoice,
        id: invoice._id,
        invoiceNo: invoice.reference,
      },
    });
};

export const createInvoice = (req, res) => createInvoiceRecord(req, res, "tax");
export const createProforma = (req, res) =>
  createInvoiceRecord(req, res, "proforma");

export const createCreditNote = async (req, res) => {
  const original = await BillingEntity.findOne({
    _id: req.params.id,
    hotelId: req.user.hotelId,
    entityType: "invoice",
  }).lean();
  if (!original)
    return res
      .status(404)
      .json({ success: false, message: "Original invoice not found" });
  if (!req.body.reason)
    return res
      .status(400)
      .json({ success: false, message: "Credit note reason is required" });
  return createInvoiceRecord(
    {
      ...req,
      body: {
        ...req.body,
        type: "credit_note",
        parentInvoiceId: original._id,
        amount: Number(req.body.amount || original.amount),
        billTo: original.data?.billTo,
        items: original.data?.items,
      },
    },
    res,
    "credit_note",
  );
};

export const sendInvoice = async (req, res) => {
  const invoice = await BillingEntity.findOne({
    _id: req.params.id,
    hotelId: req.user.hotelId,
    entityType: "invoice",
  });
  if (!invoice)
    return res
      .status(404)
      .json({ success: false, message: "Invoice not found" });
  const delivery = await BillingEntity.create({
    hotelId: invoice.hotelId,
    entityType: "audit-log",
    status: "queued",
    reference: `invoice-delivery:${invoice._id}`,
    createdBy: req.user._id,
    data: {
      invoiceId: invoice._id,
      channel: req.body.channel,
      recipient: req.body.recipient || "",
      sentAt: new Date(),
    },
  });
  return res
    .status(202)
    .json({
      success: true,
      data: { deliveryId: delivery._id, status: "queued" },
    });
};

export const cancelInvoice = async (req, res) => {
  if (!req.body.reason)
    return res
      .status(400)
      .json({ success: false, message: "Cancellation reason is required" });
  const invoice = await BillingEntity.findOneAndUpdate(
    {
      _id: req.params.id,
      hotelId: req.user.hotelId,
      entityType: "invoice",
      status: { $ne: "cancelled" },
    },
    {
      $set: {
        status: "cancelled",
        "data.cancellationReason": req.body.reason,
        "data.cancelledAt": new Date(),
      },
    },
    { new: true },
  );
  if (!invoice)
    return res
      .status(404)
      .json({ success: false, message: "Active invoice not found" });
  return res.json({
    success: true,
    data: { ...invoice.data, ...invoice, invoiceNo: invoice.reference },
  });
};
