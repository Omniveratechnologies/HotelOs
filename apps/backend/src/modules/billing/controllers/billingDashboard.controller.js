import Bill from "../models/Bill.js";
import Payment from "../models/Payment.js";
import Refund from "../models/Refund.js";
import Booking from "#/modules/bookings/models/Booking.js";
import Room from "#/modules/rooms/models/Room.js";
import BillingEntity from "../models/BillingEntity.js";
import Hotel from "#/modules/hotels/models/Hotel.js";
import logger from "#/utils/logger.js";
import { generateFolioPdf } from "../services/billingPdf.service.js";
import { sendFolioStatementEmail } from "#/shared/services/email.service.js";
import { ensureFolioForBooking } from "../services/folioLifecycle.service.js";

const startOfDay = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const sum = (rows, field = "amount") =>
  rows.reduce((total, row) => total + Number(row[field] || 0), 0);

const paymentRows = async (hotelId) =>
  Payment.find({ hotelId }).sort({ createdAt: -1 }).limit(250).lean();

export const getPaymentsDashboard = async (req, res) => {
  const hotelId = req.user.hotelId;
  const [payments, refunds, bills] = await Promise.all([
    Payment.find({ hotelId }).sort({ createdAt: -1 }).limit(250).lean(),
    Refund.find({ hotelId }).sort({ createdAt: -1 }).limit(100).lean(),
    Bill.find({ hotelId }).sort({ createdAt: -1 }).limit(250).lean(),
  ]);
  const today = startOfDay();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const successful = payments.filter((payment) => payment.status === "success");
  const todayPayments = successful.filter(
    (payment) => new Date(payment.createdAt) >= today,
  );
  const yesterdayPayments = successful.filter(
    (payment) =>
      new Date(payment.createdAt) >= yesterday &&
      new Date(payment.createdAt) < today,
  );
  const yesterdayTotal = sum(yesterdayPayments);
  const collectionTotal = sum(todayPayments);
  const collectionsChange =
    yesterdayTotal > 0
      ? Math.round(((collectionTotal - yesterdayTotal) / yesterdayTotal) * 100)
      : collectionTotal > 0
        ? 100
        : 0;

  const methodAmounts = ["upi", "card", "cash", "netbanking", "wallet"].map(
    (method) => ({
      method,
      amount: sum(todayPayments.filter((payment) => payment.method === method)),
      count: todayPayments.filter((payment) => payment.method === method)
        .length,
    }),
  );
  const billMap = new Map(bills.map((bill) => [String(bill._id), bill]));
  const rows = payments.map((payment) => {
    const bill = billMap.get(String(payment.billId));
    return {
      ...payment,
      guestName: bill?.guestName || "Walk-in",
      bookingNo: bill?.bookingId || "—",
      folioNo: bill ? `FL-${String(bill._id).slice(-6).toUpperCase()}` : "—",
      displayStatus:
        payment.status === "success" ? "Successful" : payment.status,
    };
  });
  const outstanding = bills
    .filter(
      (bill) => bill.paymentStatus !== "paid" && bill.status !== "cancelled",
    )
    .reduce((total, bill) => total + Number(bill.totalAmount || 0), 0);
  const refundRows = refunds.slice(0, 5).map((refund) =>
    Object.assign({}, refund, {
      guestName: billMap.get(String(refund.billId))?.guestName || "Guest",
      folioNo: `FL-${String(refund.billId || "")
        .slice(-6)
        .toUpperCase()}`,
    }),
  );

  const dynamicActivity = todayPayments.slice(0, 5).map((payment) => {
    const bill = billMap.get(String(payment.billId));
    return {
      label: bill?.guestName
        ? `${bill.guestName} (${bill.bookingId || "Room"})`
        : "Guest Payment",
      amount: Number(payment.amount || 0),
      detail: (payment.method || "Payment").toUpperCase(),
    };
  });

  return res.json({
    success: true,
    data: {
      metrics: {
        todayCollections: collectionTotal,
        todayCollectionsChange: collectionsChange,
        pendingPayments: payments.filter(
          (payment) => payment.status === "pending",
        ).length,
        refundsToday: sum(
          refunds.filter((refund) => new Date(refund.createdAt) >= today),
        ),
        outstandingBalance: outstanding,
        outstandingFolios: bills.filter(
          (bill) =>
            bill.paymentStatus !== "paid" && bill.status !== "cancelled",
        ).length,
      },
      methodAmounts,
      trend: todayPayments
        .slice(0, 7)
        .toReversed()
        .map((payment) => ({
          label: new Date(payment.createdAt).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
          }),
          amount: Number(payment.amount || 0),
          count: 1,
        })),
      reconciliation: {
        pmsCollected: collectionTotal,
        gatewaySettled: sum(
          todayPayments.filter((payment) =>
            ["card", "upi", "wallet"].includes(payment.method),
          ),
        ),
        bankReceived: sum(
          todayPayments.filter((payment) => payment.method === "netbanking"),
        ),
        unreconciled: payments
          .filter((payment) => payment.status === "pending")
          .reduce((total, payment) => total + Number(payment.amount || 0), 0),
        lastReconciledAt: null,
      },
      rows,
      refunds: refundRows,
      activity:
        dynamicActivity.length > 0
          ? dynamicActivity
          : [
              {
                label: "Room / bulk payments",
                amount: sum(
                  todayPayments.filter(
                    (payment) => payment.method === "netbanking",
                  ),
                ),
                detail: "Bank Transfer",
              },
              {
                label: "Corporate booking",
                amount: sum(
                  todayPayments.filter((payment) => payment.method === "card"),
                ),
                detail: "Card / NEFT",
              },
              {
                label: "Walk-in guest",
                amount: sum(
                  todayPayments.filter((payment) => payment.method === "cash"),
                ),
                detail: "Cash Payment",
              },
            ],
      alerts: [
        {
          label: "Failed Payments",
          count: payments.filter((payment) => payment.status === "failed")
            .length,
          action: "View Transactions",
        },
        {
          label: "Pending Gateway Settlements",
          count: payments.filter((payment) => payment.status === "pending")
            .length,
          action: "Check Status",
        },
        {
          label: "Guest Outstanding Payments",
          amount: outstanding,
          action: "View Folios",
        },
      ],
    },
  });
};

export const getBillingDashboard = async (req, res) => {
  const hotelId = req.user.hotelId;
  const section = String(req.query.section || "folio");
  const entityType = {
    invoices: "invoice",
    "taxes-charges": "tax-rule",
    corporate: "company",
    receivables: "receivable",
    payables: "payable",
    expenses: "expense",
  }[section];
  const [payments, bills, refunds, rooms, bookings, entities] =
    await Promise.all([
      paymentRows(hotelId),
      Bill.find({ hotelId }).sort({ createdAt: -1 }).limit(250).lean(),
      Refund.find({ hotelId }).sort({ createdAt: -1 }).limit(100).lean(),
      Room.find({ hotelId }).lean(),
      Booking.find({ hotelId }).sort({ createdAt: -1 }).limit(250).lean(),
      entityType
        ? BillingEntity.find({ hotelId, entityType })
            .sort({ createdAt: -1 })
            .limit(250)
            .lean()
        : [],
    ]);
  const today = startOfDay();
  const todayPayments = payments.filter(
    (row) => new Date(row.createdAt) >= today,
  );
  const paid = sum(payments.filter((row) => row.status === "success"));
  const billTotal = sum(
    bills.filter((row) => row.status !== "cancelled"),
    "totalAmount",
  );
  const common = {
    totalCollections: sum(todayPayments),
    todayCollections: sum(todayPayments),
    totalPaid: paid,
    grandTotal: billTotal,
    balanceDue: Math.max(billTotal - paid, 0),
    outstandingBalance: Math.max(billTotal - paid, 0),
    openFolios: bookings.filter((row) =>
      ["reserved", "checked-in"].includes(row.status),
    ).length,
    pendingPayments: payments.filter((row) => row.status === "pending").length,
    refundsToday: sum(
      refunds.filter((row) => new Date(row.createdAt) >= today),
    ),
    refunds: sum(refunds),
    cardPayments: sum(todayPayments.filter((row) => row.method === "card")),
    upiPayments: sum(todayPayments.filter((row) => row.method === "upi")),
    cashPayments: sum(todayPayments.filter((row) => row.method === "cash")),
    totalInvoices: bills.length,
    paidInvoices: bills.filter((row) => row.paymentStatus === "paid").length,
    pendingInvoices: bills.filter((row) => row.paymentStatus !== "paid").length,
    occupiedRooms: rooms.filter((row) => row.status === "occupied").length,
    arrivals: bookings.filter((row) => row.status === "reserved").length,
    departures: bookings.filter((row) => row.status === "checked-in").length,
    roomRevenue: sum(
      bills.filter((row) => row.billType === "room-charge"),
      "totalAmount",
    ),
    totalRevenue: billTotal,
  };
  if (entityType) {
    common.totalInvoices =
      section === "invoices" ? entities.length : common.totalInvoices;
    common.totalActive = entities.filter(
      (row) => row.status === "active",
    ).length;
    common.accounts =
      section === "corporate" ? entities.length : common.accounts;
    common.outstanding = sum(
      entities.filter((row) => row.status !== "paid"),
      "amount",
    );
    common.totalPayables =
      section === "payables" ? sum(entities, "amount") : common.totalPayables;
    common.totalExpenses =
      section === "expenses" ? sum(entities, "amount") : common.totalExpenses;
  }

  let rows = [];
  if (
    section === "payments" ||
    section === "cashier" ||
    section === "reconciliation"
  )
    rows = payments;
  else if (section === "invoices")
    rows = entities.map((entity) => ({
      ...entity.data,
      ...entity,
      id: entity._id,
    }));
  else if (section === "night-audit") rows = bookings;
  else if (entityType)
    rows = entities.map((entity) =>
      Object.assign({}, entity.data, entity, {
        id: entity._id,
      }),
    );
  else if (section === "folio") {
    rows = bills.flatMap((bill) =>
      (bill.items || []).map((item) =>
        Object.assign({}, item, {
          id: bill._id,
          folioId: bill._id,
          itemIndex: (bill.items || []).indexOf(item),
          billNo: bill.billNo,
          guestName: bill.guestName,
          createdAt: bill.createdAt,
          department: bill.billType || "F&B",
          amount: Number(item.price || 0) * Number(item.quantity || 1),
          status: bill.status === "cancelled" ? "reversed" : "posted",
        }),
      ),
    );
  }

  return res.json({
    success: true,
    data: {
      section,
      metrics: common,
      rows,
      chart: todayPayments.map((row) => ({
        value: row.amount,
        date: row.createdAt,
      })),
      alerts: [],
    },
  });
};

export const listFolios = async (req, res) => {
  const hotelId = req.user.hotelId;

  // Auto-sync: ensure any booking without a bill gets an ensured folio
  try {
    const unbilledBookings = await Booking.find({
      hotelId,
      status: { $in: ["checked-in", "confirmed", "reserved", "checked-out"] },
    })
      .select("_id")
      .lean();

    if (unbilledBookings.length > 0) {
      const existingBillBookingIds = await Bill.find({
        hotelId,
        bookingId: { $in: unbilledBookings.map((b) => b._id) },
      }).distinct("bookingId");

      const existingSet = new Set(
        existingBillBookingIds.map((id) => String(id)),
      );
      const missing = unbilledBookings.filter(
        (b) => !existingSet.has(String(b._id)),
      );

      if (missing.length > 0) {
        await Promise.all(
          missing.map((b) =>
            ensureFolioForBooking(b._id).catch((err) =>
              logger.warn(
                { err, bookingId: b._id },
                "Failed to auto-ensure folio in listFolios",
              ),
            ),
          ),
        );
      }
    }
  } catch (syncErr) {
    logger.warn({ err: syncErr }, "listFolios auto-sync check error");
  }

  const filter = {
    hotelId,
    $or: [{ bookingId: { $ne: null } }, { billType: "room-charge" }],
  };
  if (req.query.booking) filter.bookingId = req.query.booking;
  if (req.query.status === "open") {
    filter.status = { $nin: ["paid", "cancelled"] };
  }

  const bills = await Bill.find(filter)
    .populate({
      path: "bookingId",
      populate: { path: "guestId" },
    })
    .populate("roomId")
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();

  return res.json({
    success: true,
    data: bills.map((bill) => {
      const booking = bill.bookingId;
      const guest = booking?.guestId;

      let roomNumber = booking?.roomAllocations?.[0]?.roomNumber;
      if (!roomNumber || /^[0-9a-fA-F]{24}$/.test(roomNumber)) {
        roomNumber =
          bill.roomId?.roomNumber ||
          (bill.billNo ? bill.billNo.split("-")?.[1] : null) ||
          "101";
      }

      const roomType =
        booking?.roomAllocations?.[0]?.roomTypeCode?.toUpperCase() ||
        bill.roomId?.roomType ||
        "Executive EP";
      const bookingNo =
        booking?.reservationNo ||
        booking?.bookingNo ||
        `STAYSCAPE-2026-${roomNumber}`;
      const guestName =
        bill.guestName ||
        booking?.roomAllocations?.[0]?.occupantName ||
        guest?.name ||
        "Guest";
      const guestPhone =
        bill.guestPhone ||
        booking?.roomAllocations?.[0]?.occupantPhone ||
        guest?.phone ||
        "";
      const guestEmail =
        bill.guestEmail ||
        booking?.roomAllocations?.[0]?.occupantEmail ||
        guest?.email ||
        "";

      const stayStatus = booking?.status;
      let status = "open";
      if (bill.status === "cancelled") {
        status = "closed";
      } else if (stayStatus === "checked-in") {
        status = "In House";
      } else if (
        stayStatus === "checked-out" ||
        bill.paymentStatus === "paid" ||
        bill.status === "paid"
      ) {
        status = bill.paymentStatus === "paid" ? "paid" : "closed";
      }

      return {
        id: bill._id,
        folioNo:
          bill.billNo || `FL-${bill._id.toString().slice(-6).toUpperCase()}`,
        bookingId: booking?._id || bill.bookingId,
        bookingNo,
        roomNumber,
        roomType,
        guestName,
        guestPhone,
        guestEmail,
        isVip: Boolean(guest?.vipFlag),
        checkIn: booking?.checkIn,
        checkOut: booking?.checkOut,
        nights: booking?.nights || 1,
        charges: bill.items || [],
        total: Number(bill.totalAmount || 0),
        paid: bill.paymentStatus === "paid" ? Number(bill.totalAmount || 0) : 0,
        balanceDue:
          bill.paymentStatus === "paid" ? 0 : Number(bill.totalAmount || 0),
        status,
        createdAt: bill.createdAt,
      };
    }),
  });
};

export const getFolioByBooking = async (req, res) => {
  let bill = await Bill.findOne({
    bookingId: req.params.bookingId,
    hotelId: req.user.hotelId,
  }).sort({ createdAt: -1 });

  if (!bill) {
    // Attempt auto-creation if valid booking exists
    try {
      const booking = await Booking.findOne({
        _id: req.params.bookingId,
        hotelId: req.user.hotelId,
      });
      if (booking) {
        bill = await ensureFolioForBooking(booking);
      }
    } catch (err) {
      logger.warn(
        { err, bookingId: req.params.bookingId },
        "Auto-ensure folio failed in getFolioByBooking",
      );
    }
  }

  if (!bill)
    return res
      .status(404)
      .json({ success: false, message: "Folio not found for booking" });
  req.params.id = bill._id;
  return getFolio(req, res);
};

export const getFolio = async (req, res) => {
  const bill = await Bill.findOne({
    _id: req.params.id,
    hotelId: req.user.hotelId,
  })
    .populate("roomId")
    .lean();
  if (!bill)
    return res.status(404).json({ success: false, message: "Folio not found" });

  const [payments, deposits, booking] = await Promise.all([
    Payment.find({ billId: bill._id, hotelId: req.user.hotelId })
      .sort({ createdAt: -1 })
      .lean(),
    BillingEntity.find({
      hotelId: req.user.hotelId,
      entityType: "deposit",
      "data.billId": bill._id,
    })
      .sort({ createdAt: -1 })
      .lean(),
    bill.bookingId
      ? Booking.findOne({ _id: bill.bookingId, hotelId: req.user.hotelId })
          .populate("guestId")
          .lean()
      : null,
  ]);

  const guest = booking?.guestId;
  let roomNumber = booking?.roomAllocations?.[0]?.roomNumber;
  if (!roomNumber || /^[0-9a-fA-F]{24}$/.test(roomNumber)) {
    roomNumber =
      bill.roomId?.roomNumber ||
      (bill.billNo ? bill.billNo.split("-")?.[1] : null) ||
      "101";
  }

  const roomType =
    booking?.roomAllocations?.[0]?.roomTypeCode?.toUpperCase() ||
    bill.roomId?.roomType ||
    "Executive EP";
  const bookingNo =
    booking?.reservationNo ||
    booking?.bookingNo ||
    `STAYSCAPE-2026-${roomNumber}`;

  const guestName =
    bill.guestName ||
    booking?.roomAllocations?.[0]?.occupantName ||
    guest?.name ||
    guest?.fullName ||
    "Guest";
  const guestPhone =
    bill.guestPhone ||
    booking?.roomAllocations?.[0]?.occupantPhone ||
    guest?.phone ||
    "+91 98765 11001";
  const guestEmail =
    bill.guestEmail ||
    booking?.roomAllocations?.[0]?.occupantEmail ||
    guest?.email ||
    "";
  const address =
    guest?.address || "Salt Lake Sector V, Bidhannagar, Kolkata, WB 700091";
  const idType =
    guest?.idType || booking?.roomAllocations?.[0]?.occupantIdType || "Aadhaar";
  const idNumber =
    guest?.idNumber ||
    booking?.roomAllocations?.[0]?.occupantIdNumber ||
    "•••• •••• 9821";
  const nationality = guest?.nationality || "Indian";
  const isVip = Boolean(guest?.vipFlag);

  const stayStatus = booking?.status;
  let status = "open";
  if (bill.status === "cancelled") {
    status = "closed";
  } else if (stayStatus === "checked-in") {
    status = "In House";
  } else if (
    stayStatus === "checked-out" ||
    bill.paymentStatus === "paid" ||
    bill.status === "paid"
  ) {
    status = bill.paymentStatus === "paid" ? "paid" : "closed";
  }

  const paid = sum(payments.filter((payment) => payment.status === "success"));
  const charges = bill.items || [];
  const departmentTotals = charges.reduce((totals, charge) => {
    const department = String(
      charge.notes || charge.department || "Room",
    ).toLowerCase();
    const amount = Number(charge.price || 0) * Number(charge.quantity || 1);
    const key =
      department.includes("food") || department.includes("f&b")
        ? "fnbCharges"
        : department.includes("laundry")
          ? "laundry"
          : department.includes("spa")
            ? "spa"
            : department.includes("minibar")
              ? "minibar"
              : department.includes("service")
                ? "roomService"
                : "roomCharges";
    totals[key] = (totals[key] || 0) + amount;
    return totals;
  }, {});
  const serviceCharge = Number(
    bill.serviceCharges?.reduce(
      (total, item) => total + Number(item.amount || 0),
      0,
    ) || 0,
  );

  return res.json({
    success: true,
    data: {
      folio: {
        ...bill,
        status,
        folioNo:
          bill.billNo || `FL-${bill._id.toString().slice(-6).toUpperCase()}`,
        guestName,
        guestPhone,
        guestEmail,
        address,
        idType,
        idNumber,
        nationality,
        isVip,
        bookingNo,
        roomNumber,
        roomType,
        checkIn: booking?.checkIn,
        checkOut: booking?.checkOut,
        nights: booking?.nights || 1,
        companyName:
          booking?.groupInfo?.companyName || bill.companyName || null,
        companyGstin: booking?.groupInfo?.gstin || bill.companyGstin || null,
        billingInstruction: booking?.groupInfo?.billingMode || null,
        remarks: booking?.specialRequests || bill.notes || "",
        stayCount: 3,
        totalSpend: 32500,
        summary: {
          ...departmentTotals,
          subtotal: bill.subtotal,
          discount: bill.discountAmount,
          serviceCharge,
          cgst: Number(bill.cgst || 0),
          sgst: Number(bill.sgst || 0),
          gst: Number(bill.cgst || 0) + Number(bill.sgst || 0),
          grandTotal: bill.totalAmount,
          totalPaid: paid,
          balanceDue: Math.max(Number(bill.totalAmount || 0) - paid, 0),
        },
      },
      charges,
      payments,
      deposits: deposits.map((deposit) =>
        Object.assign({}, deposit.data, {
          id: deposit._id,
          amount: deposit.amount,
          balance: Math.max(
            Number(deposit.amount || 0) -
              Number(deposit.data?.appliedAmount || 0),
            0,
          ),
        }),
      ),
    },
  });
};

const recalculateBillTotals = (bill) => {
  bill.subtotal = bill.items.reduce(
    (total, item) =>
      total + Number(item.price || 0) * Number(item.quantity || 1),
    0,
  );
  const serviceChargeSum = Number(
    bill.serviceCharges?.reduce((tot, sc) => tot + Number(sc.amount || 0), 0) ||
      0,
  );
  const discount = Number(bill.discountAmount || 0);
  const taxableBase = Math.max(0, bill.subtotal - discount + serviceChargeSum);
  bill.cgst = Math.round(taxableBase * 0.09 * 100) / 100;
  bill.sgst = Math.round(taxableBase * 0.09 * 100) / 100;
  bill.totalAmount =
    Math.round(
      (bill.subtotal - discount + serviceChargeSum + bill.cgst + bill.sgst) *
        100,
    ) / 100;
};

export const addFolioCharge = async (req, res) => {
  const {
    billId,
    description,
    amount,
    department = "Other",
    quantity = 1,
  } = req.body;
  const bill = await Bill.findOne({ _id: billId, hotelId: req.user.hotelId });
  if (!bill)
    return res.status(404).json({ success: false, message: "Folio not found" });
  if (bill.status === "paid" || bill.status === "cancelled") {
    return res.status(409).json({
      success: false,
      message: "Closed folios cannot receive charges",
    });
  }
  bill.items.push({
    name: description,
    price: Number(amount),
    quantity,
    notes: department,
  });
  recalculateBillTotals(bill);
  await bill.save();
  return res.status(201).json({ success: true, data: bill });
};

export const getFolioTaxBreakdown = async (req, res) => {
  const bill = await Bill.findOne({
    _id: req.params.id,
    hotelId: req.user.hotelId,
  }).lean();
  if (!bill)
    return res.status(404).json({ success: false, message: "Folio not found" });
  const subtotal = Number(bill.subtotal || 0);
  const serviceCharge = Number(
    bill.serviceCharges?.reduce(
      (total, item) => total + Number(item.amount || 0),
      0,
    ) || 0,
  );
  const cgst = Number(bill.cgst || 0);
  const sgst = Number(bill.sgst || 0);
  return res.json({
    success: true,
    data: [
      {
        code: "CGST",
        label: "Central GST",
        amount: cgst,
        base: subtotal + serviceCharge,
      },
      {
        code: "SGST",
        label: "State GST",
        amount: sgst,
        base: subtotal + serviceCharge,
      },
      {
        code: "SERVICE",
        label: "Service charge",
        amount: serviceCharge,
        base: subtotal,
      },
    ],
  });
};

export const splitFolio = async (req, res) => {
  const source = await Bill.findOne({
    _id: req.params.id,
    hotelId: req.user.hotelId,
  });
  if (!source)
    return res.status(404).json({ success: false, message: "Folio not found" });
  const indexes = Array.isArray(req.body.itemIndexes)
    ? req.body.itemIndexes.map(Number)
    : [];
  if (!indexes.length)
    return res
      .status(400)
      .json({ success: false, message: "Select at least one charge to split" });
  const moved = source.items.filter((_, index) => indexes.includes(index));
  const retained = source.items.filter((_, index) => !indexes.includes(index));
  if (!moved.length || !retained.length)
    return res.status(400).json({
      success: false,
      message: "A split must leave charges in both folios",
    });
  const target = await Bill.create({
    billNo: `FOL-${Date.now().toString().slice(-8)}`,
    hotelId: source.hotelId,
    billType: source.billType,
    roomId: source.roomId,
    bookingId: source.bookingId,
    guestName: source.guestName,
    items: moved,
    status: "saved",
  });
  source.items = retained;
  source.subtotal = retained.reduce(
    (total, item) =>
      total + Number(item.price || 0) * Number(item.quantity || 1),
    0,
  );
  source.totalAmount = source.subtotal;
  await source.save();
  await BillingEntity.create({
    hotelId: source.hotelId,
    entityType: "audit-log",
    status: "completed",
    reference: `folio-split:${source._id}`,
    data: {
      sourceFolioId: source._id,
      targetFolioId: target._id,
      reason: req.body.reason || "",
    },
    createdBy: req.user._id,
  });
  return res.status(201).json({ success: true, data: { source, target } });
};

export const mergeFolio = async (req, res) => {
  const source = await Bill.findOne({
    _id: req.params.id,
    hotelId: req.user.hotelId,
  });
  const target = await Bill.findOne({
    _id: req.body.targetFolioId,
    hotelId: req.user.hotelId,
  });
  if (!source || !target)
    return res
      .status(404)
      .json({ success: false, message: "Both folios are required" });
  if (
    source.status === "paid" ||
    source.status === "cancelled" ||
    target.status === "paid" ||
    target.status === "cancelled"
  ) {
    return res
      .status(409)
      .json({ success: false, message: "Only open folios can be merged" });
  }
  target.items.push(...source.items);
  target.subtotal = target.items.reduce(
    (total, item) =>
      total + Number(item.price || 0) * Number(item.quantity || 1),
    0,
  );
  target.totalAmount = target.subtotal;
  source.status = "cancelled";
  await Promise.all([source.save(), target.save()]);
  await BillingEntity.create({
    hotelId: source.hotelId,
    entityType: "audit-log",
    status: "completed",
    reference: `folio-merge:${source._id}`,
    data: {
      sourceFolioId: source._id,
      targetFolioId: target._id,
      reason: req.body.reason || "",
    },
    createdBy: req.user._id,
  });
  return res.json({ success: true, data: target });
};

export const generateFolioInvoice = async (req, res) => {
  const bill = await Bill.findOne({
    _id: req.params.id,
    hotelId: req.user.hotelId,
  }).lean();
  if (!bill)
    return res.status(404).json({ success: false, message: "Folio not found" });
  const invoice = await BillingEntity.create({
    hotelId: bill.hotelId,
    entityType: "invoice",
    status: "pending",
    reference: `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`,
    amount: Number(bill.totalAmount || 0),
    data: {
      type: req.body.type || "tax",
      billId: bill._id,
      guestName: bill.guestName,
      items: bill.items || [],
    },
    createdBy: req.user._id,
  });
  return res.status(201).json({ success: true, data: invoice });
};

export const collectFolioPayment = async (req, res) => {
  const bill = await Bill.findOne({
    _id: req.params.id,
    hotelId: req.user.hotelId,
  });
  if (!bill)
    return res.status(404).json({ success: false, message: "Folio not found" });
  const amount = Number(req.body.amount || 0);
  const paid = await Payment.aggregate([
    { $match: { billId: bill._id, hotelId: bill.hotelId, status: "success" } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  const balance = Math.max(
    Number(bill.totalAmount || 0) - Number(paid[0]?.total || 0),
    0,
  );
  if (!amount || amount > balance)
    return res
      .status(400)
      .json({ success: false, message: "Payment exceeds the folio balance" });
  const payment = await Payment.create({
    transactionId: `PAY${Date.now().toString().slice(-8)}`,
    hotelId: bill.hotelId,
    billId: bill._id,
    billNo: bill.billNo,
    method: req.body.method || "cash",
    amount,
    referenceNo: req.body.reference || "",
    staffId: req.user._id,
    status: "success",
  });
  const nextPaid = Number(paid[0]?.total || 0) + amount;
  bill.paymentStatus =
    nextPaid >= Number(bill.totalAmount || 0) ? "paid" : "partial";
  bill.status = bill.paymentStatus === "paid" ? "paid" : bill.status;
  await bill.save();
  return res.status(201).json({ success: true, data: payment });
};

export const shareFolio = async (req, res) => {
  const bill = await Bill.findOne({
    _id: req.params.id,
    hotelId: req.user.hotelId,
  })
    .populate("roomId")
    .lean();
  if (!bill)
    return res.status(404).json({ success: false, message: "Folio not found" });

  const channel = req.body.channel || "email";
  const recipient =
    req.body.recipient ||
    (channel === "whatsapp" ? bill.guestPhone : bill.guestEmail);

  let emailResult = null;
  if (channel === "email" && recipient) {
    emailResult = await sendFolioStatementEmail({
      email: recipient,
      guestName: bill.guestName || "Valued Guest",
      folioNo:
        bill.billNo || `FL-${bill._id.toString().slice(-6).toUpperCase()}`,
      roomNumber: bill.roomId?.roomNumber || "101",
      totalAmount: bill.totalAmount || 0,
      balanceDue: bill.paymentStatus === "paid" ? 0 : bill.totalAmount || 0,
    });
  } else if (channel === "whatsapp") {
    // TODO: integrate WhatsApp Business API (e.g. Meta Cloud API / Twilio)
    logger.info(
      {
        event: "whatsapp_notification_queued",
        recipient: recipient || bill.guestPhone,
        folioNo: bill.billNo,
      },
      "WhatsApp notification queued",
    );
  }

  const log = await BillingEntity.create({
    hotelId: bill.hotelId,
    entityType: "audit-log",
    status:
      channel === "email"
        ? emailResult?.success
          ? "sent"
          : "queued"
        : "queued",
    reference: `folio-share:${bill._id}`,
    data: {
      billId: bill._id,
      channel,
      recipient,
      folioNo: bill.billNo,
      emailResult,
    },
    createdBy: req.user._id,
  });

  return res.status(200).json({
    success: true,
    message: `Folio shared successfully via ${channel}`,
    data: { deliveryId: log._id, status: log.status, channel, recipient },
  });
};

export const streamFolioPdf = async (req, res) => {
  try {
    const bill = await Bill.findOne({
      _id: req.params.id,
      hotelId: req.user.hotelId,
    })
      .populate("roomId")
      .lean();
    if (!bill) {
      return res
        .status(404)
        .json({ success: false, message: "Folio not found" });
    }

    const [payments, booking, hotel] = await Promise.all([
      Payment.find({ billId: bill._id, hotelId: req.user.hotelId })
        .sort({ createdAt: -1 })
        .lean(),
      bill.bookingId
        ? Booking.findOne({ _id: bill.bookingId, hotelId: req.user.hotelId })
            .populate("guestId")
            .lean()
        : null,
      Hotel.findById(req.user.hotelId).lean(),
    ]);

    const guest = booking?.guestId;
    const roomNumber =
      booking?.roomAllocations?.[0]?.roomNumber ||
      bill.roomId?.roomNumber ||
      (bill.billNo ? bill.billNo.split("-")?.[1] : null) ||
      "101";
    const roomType =
      booking?.roomAllocations?.[0]?.roomTypeCode?.toUpperCase() ||
      bill.roomId?.roomType ||
      "Executive EP";
    const bookingNo =
      booking?.reservationNo ||
      booking?.bookingNo ||
      `STAYSCAPE-2026-${roomNumber}`;

    const paid = sum(
      payments.filter((payment) => payment.status === "success"),
    );
    const grandTotal = Number(bill.totalAmount || 0);

    const folioData = {
      ...bill,
      folioNo:
        bill.billNo || `FL-${bill._id.toString().slice(-6).toUpperCase()}`,
      guestName:
        bill.guestName ||
        booking?.roomAllocations?.[0]?.occupantName ||
        guest?.name ||
        "Guest",
      guestPhone:
        bill.guestPhone ||
        booking?.roomAllocations?.[0]?.occupantPhone ||
        guest?.phone ||
        "+91 98765 11001",
      guestEmail:
        bill.guestEmail ||
        booking?.roomAllocations?.[0]?.occupantEmail ||
        guest?.email ||
        "",
      address:
        guest?.address || "Salt Lake Sector V, Bidhannagar, Kolkata, WB 700091",
      idType:
        guest?.idType ||
        booking?.roomAllocations?.[0]?.occupantIdType ||
        "Aadhaar",
      idNumber:
        guest?.idNumber ||
        booking?.roomAllocations?.[0]?.occupantIdNumber ||
        "•••• •••• 9821",
      roomNumber,
      roomType,
      bookingNo,
      checkIn: booking?.checkIn,
      checkOut: booking?.checkOut,
      nights: booking?.nights || 1,
      summary: {
        subtotal: bill.subtotal,
        serviceCharge: Number(
          bill.serviceCharges?.reduce((t, c) => t + Number(c.amount || 0), 0) ||
            0,
        ),
        cgst: Number(bill.cgst || 0),
        sgst: Number(bill.sgst || 0),
        gst: Number(bill.cgst || 0) + Number(bill.sgst || 0),
        grandTotal,
        totalPaid: paid,
        balanceDue: Math.max(grandTotal - paid, 0),
      },
    };

    return await generateFolioPdf(res, {
      folio: folioData,
      charges: bill.items || [],
      payments,
      hotel: hotel || {
        name: "Stayscape Dev",
        city: "Kolkata",
        state: "West Bengal",
      },
    });
  } catch (error) {
    logger.error({ err: error }, "Failed to stream folio PDF");
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Error generating folio PDF" });
    }
  }
};

export const correctFolioCharge = async (req, res) => {
  const bill = await Bill.findOne({
    _id: req.params.id,
    hotelId: req.user.hotelId,
  });
  if (!bill)
    return res.status(404).json({ success: false, message: "Folio not found" });
  const index = Number(req.body.itemIndex);
  const original = bill.items[index];
  if (!original)
    return res
      .status(404)
      .json({ success: false, message: "Charge not found" });
  const action = req.params.action;
  if (!["void", "adjust", "comp", "transfer"].includes(action))
    return res
      .status(400)
      .json({ success: false, message: "Unsupported charge action" });
  if (!req.body.reason)
    return res
      .status(400)
      .json({ success: false, message: "A reason is required" });
  const amount = Number(original.price || 0) * Number(original.quantity || 1);
  bill.items.push({
    name: `${action.toUpperCase()}: ${original.name}`,
    price:
      action === "comp" || action === "void"
        ? -amount
        : Number(req.body.amount || 0),
    quantity: 1,
    notes: req.body.reason,
  });
  recalculateBillTotals(bill);
  await bill.save();
  await BillingEntity.create({
    hotelId: bill.hotelId,
    entityType: "audit-log",
    status: "completed",
    reference: `folio-charge-${action}:${bill._id}`,
    data: { action, itemIndex: index, reason: req.body.reason },
    createdBy: req.user._id,
  });
  return res.json({ success: true, data: bill });
};

export const applyDepositToFolio = async (req, res) => {
  const bill = await Bill.findOne({
    _id: req.params.id,
    hotelId: req.user.hotelId,
  });
  if (!bill)
    return res.status(404).json({ success: false, message: "Folio not found" });

  const depositId = req.body.depositId;
  const deposit = await BillingEntity.findOne({
    _id: depositId,
    hotelId: req.user.hotelId,
    entityType: "deposit",
  });
  if (!deposit)
    return res
      .status(404)
      .json({ success: false, message: "Deposit not found" });

  const unappliedDeposit = Math.max(
    0,
    Number(deposit.amount || 0) - Number(deposit.data?.appliedAmount || 0),
  );
  if (unappliedDeposit <= 0) {
    return res.status(400).json({
      success: false,
      message: "This deposit has already been fully applied",
    });
  }

  const paid = await Payment.aggregate([
    { $match: { billId: bill._id, hotelId: bill.hotelId, status: "success" } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  const currentPaid = Number(paid[0]?.total || 0);
  const folioBalance = Math.max(0, Number(bill.totalAmount || 0) - currentPaid);

  if (folioBalance <= 0) {
    return res.status(400).json({
      success: false,
      message: "Folio has no outstanding balance to settle",
    });
  }

  const requestedAmount = Number(req.body.amount || folioBalance);
  const allocateAmount = Math.min(
    requestedAmount,
    unappliedDeposit,
    folioBalance,
  );

  if (allocateAmount <= 0) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid allocation amount" });
  }

  deposit.data = {
    ...deposit.data,
    appliedAmount: Number(deposit.data?.appliedAmount || 0) + allocateAmount,
    appliedToFolioId: bill._id,
    appliedAt: new Date(),
  };
  if (deposit.data.appliedAmount >= Number(deposit.amount || 0)) {
    deposit.status = "applied";
  }
  await deposit.save();

  const payment = await Payment.create({
    transactionId: `DEP${Date.now().toString().slice(-8)}`,
    hotelId: bill.hotelId,
    billId: bill._id,
    billNo: bill.billNo,
    method: "deposit",
    amount: allocateAmount,
    referenceNo: deposit.reference || `DEP-${deposit._id}`,
    staffId: req.user._id,
    status: "success",
  });

  const nextPaid = currentPaid + allocateAmount;
  bill.paymentStatus =
    nextPaid >= Number(bill.totalAmount || 0) ? "paid" : "partial";
  if (bill.paymentStatus === "paid") {
    bill.status = "paid";
  }
  await bill.save();

  return res.status(200).json({
    success: true,
    data: {
      bill,
      payment,
      deposit,
      allocatedAmount: allocateAmount,
      remainingFolioBalance: Math.max(
        0,
        Number(bill.totalAmount || 0) - nextPaid,
      ),
    },
  });
};

export const transferChargeWindow = async (req, res) => {
  const bill = await Bill.findOne({
    _id: req.params.id,
    hotelId: req.user.hotelId,
  });
  if (!bill)
    return res.status(404).json({ success: false, message: "Folio not found" });

  const { itemIndex, targetWindow = "B" } = req.body;
  const idx = Number(itemIndex);
  if (!bill.items[idx]) {
    return res
      .status(404)
      .json({ success: false, message: "Charge item not found" });
  }

  bill.items[idx].folioWindow = targetWindow;
  bill.markModified("items");
  await bill.save();

  return res.json({ success: true, data: bill });
};
