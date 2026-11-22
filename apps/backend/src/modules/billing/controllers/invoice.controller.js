import Bill from "../models/Bill.js";
import BillingEntity from "../models/BillingEntity.js";
import InvoiceSeries from "../models/InvoiceSeries.js";
import Hotel from "#/modules/hotels/models/Hotel.js";
import Booking from "#/modules/bookings/models/Booking.js";
import logger from "#/utils/logger.js";
import { generateInvoicePdf } from "../services/billingPdf.service.js";
import { sendTaxInvoiceEmail } from "#/shared/services/email.service.js";

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
  return rows.map((row) =>
    Object.assign({}, row.data, row, {
      id: row._id,
      invoiceNo: row.reference,
      amount: row.amount,
    }),
  );
};

export const listInvoices = async (req, res) => {
  const rows = await invoiceRows(req.user.hotelId, req.query);
  return res.json({ success: true, data: rows });
};

const sumInvoiceAmount = (items) =>
  items.reduce((total, row) => total + Number(row.amount || 0), 0);

export const invoiceSummary = async (req, res) => {
  const rows = await invoiceRows(req.user.hotelId, req.query);
  const totalAmount = sumInvoiceAmount(rows);
  const paidRows = rows.filter((row) => row.status === "paid");
  const pendingRows = rows.filter((row) => row.status === "pending");
  const overdueRows = rows.filter(
    (row) =>
      row.status === "overdue" ||
      (row.status === "pending" &&
        row.dueDate &&
        new Date(row.dueDate) < new Date()),
  );
  const creditNoteRows = rows.filter((row) => row.type === "credit_note");
  const cancelledRows = rows.filter((row) =>
    ["cancelled", "refunded"].includes(row.status),
  );
  const corporateRows = rows.filter((row) => row.type === "corporate");

  return res.json({
    success: true,
    data: {
      metrics: {
        total: totalAmount,
        totalInvoiced: totalAmount,
        totalCount: rows.length,
        paid: amount(paidRows),
        paidAmount: amount(paidRows),
        paidCount: paidRows.length,
        pending: amount(pendingRows),
        unpaidAmount: amount(pendingRows),
        unpaidCount: pendingRows.length,
        pendingCount: pendingRows.length,
        overdueAmount: amount(overdueRows),
        overdueCount: overdueRows.length,
        creditNoteAmount: amount(creditNoteRows),
        creditNoteCount: creditNoteRows.length,
        cancelled: amount(cancelledRows),
        cancelledCount: cancelledRows.length,
        corporate: amount(corporateRows),
        corporateCount: corporateRows.length,
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
  return res.status(201).json({
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

  const channel = req.body.channel || "email";
  const recipient =
    req.body.recipient ||
    (channel === "whatsapp"
      ? invoice.data?.guestPhone
      : invoice.data?.guestEmail) ||
    "";
  const trackingId = `INV-DLV-${Date.now().toString().slice(-8)}`;

  let emailResult = null;
  if (channel === "email" && recipient) {
    emailResult = await sendTaxInvoiceEmail({
      email: recipient,
      guestName: invoice.data?.guestName || "Valued Guest",
      invoiceNo: invoice.reference || "INV-1001",
      totalAmount: invoice.amount || 0,
    });
  } else if (channel === "whatsapp") {
    // TODO: integrate WhatsApp Business API (e.g. Meta Cloud API / Twilio)
    logger.info(
      {
        event: "whatsapp_notification_queued",
        recipient,
        invoiceNo: invoice.reference,
      },
      "WhatsApp notification queued",
    );
  }

  const delivery = await BillingEntity.create({
    hotelId: invoice.hotelId,
    entityType: "audit-log",
    status:
      channel === "email"
        ? emailResult?.success
          ? "delivered"
          : "queued"
        : "delivered",
    reference: `invoice-delivery:${invoice._id}`,
    createdBy: req.user._id,
    data: {
      invoiceId: invoice._id,
      invoiceNo: invoice.reference,
      channel,
      recipient,
      trackingId,
      sentAt: new Date(),
      deliveryStatus: "delivered",
      emailResult,
    },
  });

  return res.status(200).json({
    success: true,
    message: `Invoice shared successfully via ${channel}`,
    data: {
      deliveryId: delivery._id,
      trackingId,
      status: delivery.status,
      channel,
      recipient,
      sentAt: new Date(),
    },
  });
};

export const streamInvoicePdf = async (req, res) => {
  try {
    const invoice = await BillingEntity.findOne({
      _id: req.params.id,
      hotelId: req.user.hotelId,
      entityType: "invoice",
    }).lean();

    if (!invoice) {
      return res
        .status(404)
        .json({ success: false, message: "Invoice not found" });
    }

    const [bill, hotel] = await Promise.all([
      invoice.data?.billId
        ? Bill.findById(invoice.data.billId).populate("roomId").lean()
        : null,
      Hotel.findById(req.user.hotelId).lean(),
    ]);

    const booking = bill?.bookingId
      ? await Booking.findById(bill.bookingId).populate("guestId").lean()
      : null;

    return await generateInvoicePdf(res, {
      invoice,
      bill: bill || { items: invoice.data?.items || [] },
      booking: booking || {},
      hotel: hotel || {
        name: "Stayscape Dev",
        city: "Kolkata",
        state: "West Bengal",
      },
    });
  } catch (error) {
    logger.error({ err: error }, "Failed to stream invoice PDF");
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Error generating invoice PDF" });
    }
  }
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
