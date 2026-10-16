import Bill from "../models/Bill.js";
import Payment from "../models/Payment.js";
import Refund from "../models/Refund.js";
import Booking from "#/modules/bookings/models/Booking.js";
import Room from "#/modules/rooms/models/Room.js";
import BillingEntity from "../models/BillingEntity.js";

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
  const successful = payments.filter((payment) => payment.status === "success");
  const todayPayments = successful.filter(
    (payment) => new Date(payment.createdAt) >= today,
  );
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
  const collectionTotal = sum(todayPayments);
  const refundRows = refunds.slice(0, 5).map((refund) => ({
    ...refund,
    guestName: billMap.get(String(refund.billId))?.guestName || "Guest",
    folioNo: `FL-${String(refund.billId || "")
      .slice(-6)
      .toUpperCase()}`,
  }));
  return res.json({
    success: true,
    data: {
      metrics: {
        todayCollections: collectionTotal,
        todayCollectionsChange: 12,
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
        .reverse()
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
      activity: [
        {
          label: "Room / bulk payments",
          amount: sum(
            todayPayments.filter((payment) => payment.method === "netbanking"),
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
    rows = entities.map((entity) => ({
      ...entity.data,
      ...entity,
      id: entity._id,
    }));
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
  const filter = { hotelId: req.user.hotelId };
  if (req.query.booking) filter.bookingId = req.query.booking;
  if (req.query.status === "open")
    filter.status = { $nin: ["paid", "cancelled"] };
  const bills = await Bill.find(filter)
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();
  return res.json({
    success: true,
    data: bills.map((bill) => ({
      id: bill._id,
      folioNo: `FL-${bill._id.toString().slice(-6).toUpperCase()}`,
      bookingId: bill.bookingId,
      roomId: bill.roomId,
      guestName: bill.guestName,
      charges: bill.items || [],
      total: bill.totalAmount,
      paid: bill.paymentStatus === "paid" ? bill.totalAmount : 0,
      balanceDue: bill.paymentStatus === "paid" ? 0 : bill.totalAmount,
      status: bill.status === "cancelled" ? "closed" : "open",
      createdAt: bill.createdAt,
    })),
  });
};

export const getFolioByBooking = async (req, res) => {
  const bill = await Bill.findOne({
    bookingId: req.params.bookingId,
    hotelId: req.user.hotelId,
  }).sort({ createdAt: -1 });
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
  }).lean();
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
    Booking.findOne({ _id: bill.bookingId, hotelId: req.user.hotelId })
      .populate("roomId")
      .populate("guestId")
      .lean(),
  ]);
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
  const guest = booking?.guestId;
  const room = booking?.roomId;
  return res.json({
    success: true,
    data: {
      folio: {
        ...bill,
        folioNo: `FL-${bill._id.toString().slice(-6).toUpperCase()}`,
        guestName: bill.guestName || guest?.name || guest?.fullName || "",
        guestPhone: bill.guestPhone || guest?.phone || "",
        guestEmail: bill.guestEmail || guest?.email || "",
        bookingNo: booking?.bookingNo || booking?._id,
        roomNumber: room?.roomNumber,
        roomType: room?.roomType || room?.type,
        checkIn: booking?.checkIn,
        checkOut: booking?.checkOut,
        nights: booking?.nights,
        summary: {
          ...departmentTotals,
          subtotal: bill.subtotal,
          discount: bill.discountAmount,
          serviceCharge,
          gst: Number(bill.cgst || 0) + Number(bill.sgst || 0),
          grandTotal: bill.totalAmount,
          totalPaid: paid,
          balanceDue: Math.max(Number(bill.totalAmount || 0) - paid, 0),
        },
      },
      charges,
      payments,
      deposits: deposits.map((deposit) => ({
        ...deposit.data,
        id: deposit._id,
        amount: deposit.amount,
        balance: Math.max(
          Number(deposit.amount || 0) -
            Number(deposit.data?.appliedAmount || 0),
          0,
        ),
      })),
    },
  });
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
    return res
      .status(409)
      .json({
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
  bill.subtotal = bill.items.reduce(
    (total, item) =>
      total + Number(item.price || 0) * Number(item.quantity || 1),
    0,
  );
  bill.totalAmount = bill.subtotal;
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
    return res
      .status(400)
      .json({
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
  }).lean();
  if (!bill)
    return res.status(404).json({ success: false, message: "Folio not found" });
  const log = await BillingEntity.create({
    hotelId: bill.hotelId,
    entityType: "audit-log",
    status: "queued",
    reference: `folio-share:${bill._id}`,
    data: {
      billId: bill._id,
      channel: req.body.channel || "download",
      recipient: req.body.recipient || "",
    },
    createdBy: req.user._id,
  });
  return res
    .status(202)
    .json({ success: true, data: { deliveryId: log._id, status: "queued" } });
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
  bill.subtotal = bill.items.reduce(
    (total, item) =>
      total + Number(item.price || 0) * Number(item.quantity || 1),
    0,
  );
  bill.totalAmount = bill.subtotal;
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
