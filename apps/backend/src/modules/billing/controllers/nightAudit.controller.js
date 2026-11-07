import BillingWorkflow from "../models/BillingWorkflow.js";
import BillingEntity from "../models/BillingEntity.js";
import Booking from "#/modules/bookings/models/Booking.js";
import Room from "#/modules/rooms/models/Room.js";
import Bill from "../models/Bill.js";
import Payment from "../models/Payment.js";

const steps = [
  "Verify all bookings and in-house folios",
  "Post room charges",
  "Post recurring charges",
  "Verify payments and settlements",
  "Generate no-show and cancellation charges",
  "Reconcile POS postings",
  "Run audit reports",
  "Roll over to next business date",
];
const dayRange = (date) => {
  const start = new Date(date || Date.now());
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
};
const total = (rows, field) =>
  rows.reduce((sum, row) => sum + Number(row[field] || 0), 0);

export const nightAuditOverview = async (req, res) => {
  const { start, end } = dayRange(req.query.date);
  const hotelId = req.user.hotelId;
  const [rooms, bookings, bills, payments, openShift, run] = await Promise.all([
    Room.find({ hotelId }).lean(),
    Booking.find({ hotelId }).sort({ checkIn: 1 }).limit(1000).lean(),
    Bill.find({ hotelId, createdAt: { $gte: start, $lt: end } }).lean(),
    Payment.find({ hotelId, createdAt: { $gte: start, $lt: end } }).lean(),
    BillingWorkflow.findOne({
      hotelId,
      type: "cashier-shift",
      status: "open",
    }).lean(),
    BillingWorkflow.findOne({
      hotelId,
      type: "night-audit",
      status: { $in: ["running", "open"] },
      businessDate: { $gte: start, $lt: end },
    })
      .sort({ createdAt: -1 })
      .lean(),
  ]);
  const inHouse = bookings.filter((row) => row.status === "checked-in");
  const arrivals = bookings.filter(
    (row) =>
      row.checkIn &&
      new Date(row.checkIn) >= start &&
      new Date(row.checkIn) < end,
  );
  const departures = bookings.filter(
    (row) =>
      row.checkOut &&
      new Date(row.checkOut) >= start &&
      new Date(row.checkOut) < end,
  );
  const roomRevenue = total(
    bills.filter((row) => row.billType === "room-charge"),
    "totalAmount",
  );
  const fnbRevenue = total(
    bills.filter((row) =>
      ["dine-in", "takeaway", "room-service", "fnb"].includes(row.billType),
    ),
    "totalAmount",
  );
  const miscRevenue = total(
    bills.filter(
      (row) =>
        [
          "miscellaneous",
          "misc",
          "laundry",
          "spa",
          "minibar",
          "paid-amenity",
          "other",
        ].includes(row.billType) ||
        !["room-charge", "dine-in", "takeaway", "room-service", "fnb"].includes(
          row.billType,
        ),
    ),
    "totalAmount",
  );
  const totalRevenue =
    total(bills, "totalAmount") || roomRevenue + fnbRevenue + miscRevenue;
  const alerts = [
    departures.filter((row) => row.status === "checked-in").length
      ? `${departures.filter((row) => row.status === "checked-in").length} departures pending check-out`
      : null,
    openShift ? "Open cashier shift must be closed" : null,
    payments.some((row) => row.status === "pending")
      ? "Pending payment settlements require review"
      : null,
    rooms.filter((row) => row.status === "maintenance").length
      ? `${rooms.filter((row) => row.status === "maintenance").length} rooms in maintenance`
      : null,
    bills.filter((row) => row.status === "draft").length
      ? `${bills.filter((row) => row.status === "draft").length} unposted POS charges`
      : null,
  ].filter(Boolean);
  const stepRows = await BillingEntity.find({
    hotelId,
    entityType: "night-audit-step",
    "data.runId": run?._id,
  })
    .sort({ "data.stepNo": 1 })
    .lean();
  return res.json({
    success: true,
    data: {
      businessDate: start,
      run,
      metrics: {
        occupied: inHouse.length,
        totalRooms: rooms.length,
        arrivals: arrivals.length,
        departures: departures.length,
        roomRevenue,
        totalRevenue,
        occupancy: rooms.length
          ? Math.round((inHouse.length / rooms.length) * 100)
          : 0,
      },
      revenue: [
        { label: "Room Revenue", value: roomRevenue },
        { label: "F&B Revenue", value: fnbRevenue },
        {
          label: "Other Charges",
          value: Math.max(
            0,
            totalRevenue - roomRevenue - fnbRevenue - miscRevenue,
          ),
        },
        { label: "Miscellaneous", value: miscRevenue },
        { label: "Total Revenue", value: totalRevenue },
      ],
      occupancy: [
        { label: "Occupied", value: inHouse.length },
        {
          label: "Vacant",
          value: rooms.filter((row) => row.status === "available").length,
        },
        {
          label: "Out of Order",
          value: rooms.filter((row) => row.status === "out-of-order").length,
        },
        {
          label: "Maintenance",
          value: rooms.filter((row) => row.status === "maintenance").length,
        },
      ],
      arrivals,
      departures,
      inHouse: inHouse.slice(0, 100),
      alerts,
      steps: steps.map((name, index) => ({
        stepNo: index + 1,
        name,
        status:
          stepRows.find((row) => row.data?.stepNo === index + 1)?.status ||
          "pending",
      })),
    },
  });
};

export const startNightAuditRun = async (req, res) => {
  const existing = await BillingWorkflow.findOne({
    hotelId: req.user.hotelId,
    type: "night-audit",
    status: { $in: ["running", "open"] },
  });
  if (existing)
    return res.status(409).json({
      success: false,
      message: "A night audit is already running",
      data: existing,
    });
  const run = await BillingWorkflow.create({
    hotelId: req.user.hotelId,
    type: "night-audit",
    status: "running",
    businessDate: req.body.businessDate || new Date(),
    payload: { stepNames: steps },
    openedBy: req.user._id,
  });
  return res.status(201).json({ success: true, data: run });
};

export const executeNightAuditStep = async (req, res) => {
  const stepNo = Number(req.params.stepNo);
  if (!steps[stepNo - 1])
    return res
      .status(400)
      .json({ success: false, message: "Invalid night audit step" });
  const run = await BillingWorkflow.findOne({
    _id: req.params.runId,
    hotelId: req.user.hotelId,
    type: "night-audit",
    status: "running",
  });
  if (!run)
    return res
      .status(404)
      .json({ success: false, message: "Active night audit not found" });

  let stepResult = { completedAt: new Date() };

  // Step 1: Verify all bookings and in-house folios
  if (stepNo === 1) {
    const inHouse = await Booking.countDocuments({
      hotelId: req.user.hotelId,
      status: "checked-in",
    });
    const pendingArrivals = await Booking.countDocuments({
      hotelId: req.user.hotelId,
      status: "reserved",
      checkIn: { $lte: run.businessDate },
    });
    const pendingDepartures = await Booking.countDocuments({
      hotelId: req.user.hotelId,
      status: "checked-in",
      checkOut: { $lte: run.businessDate },
    });
    stepResult = {
      ...stepResult,
      inHouseCount: inHouse,
      pendingArrivals,
      pendingDepartures,
      summary: `Verified ${inHouse} in-house guests, ${pendingArrivals} pending arrivals, ${pendingDepartures} pending check-outs.`,
    };
  }

  // Step 2: Post room charges for in-house guests
  else if (stepNo === 2) {
    const inHouseBookings = await Booking.find({
      hotelId: req.user.hotelId,
      status: "checked-in",
    })
      .populate("roomId")
      .lean();

    let postedCount = 0;
    let totalTariffPosted = 0;

    for (const b of inHouseBookings) {
      const existing = await Bill.findOne({
        hotelId: req.user.hotelId,
        bookingId: b._id,
        billType: "room-charge",
        createdAt: { $gte: run.businessDate },
      });

      if (!existing) {
        const nightlyRate = Number(
          b.pricing?.totalRoomRate ||
            b.pricing?.baseRate ||
            b.roomId?.basePrice ||
            2500,
        );
        const cgst = Math.round(nightlyRate * 0.09);
        const sgst = Math.round(nightlyRate * 0.09);
        const totalRoomCharge = nightlyRate + cgst + sgst;

        await Bill.create({
          billNo: `RC-${Date.now().toString().slice(-6)}-${b.roomId?.roomNumber || "RM"}`,
          hotelId: req.user.hotelId,
          bookingId: b._id,
          roomId: b.roomId?._id,
          guestName: b.guestDetails?.primaryGuest?.name || "In-House Guest",
          guestPhone: b.guestDetails?.primaryGuest?.phone || "",
          billType: "room-charge",
          subtotal: nightlyRate,
          cgst,
          sgst,
          totalAmount: totalRoomCharge,
          paymentStatus: "unpaid",
          status: "saved",
          cashierId: req.user._id,
          items: [
            {
              name: `Room Tariff - Room ${b.roomId?.roomNumber || ""}`,
              price: nightlyRate,
              quantity: 1,
              notes: "Night audit automated room charge posting",
            },
          ],
        });
        postedCount++;
        totalTariffPosted += totalRoomCharge;
      }
    }

    stepResult = {
      ...stepResult,
      postedCount,
      totalTariffPosted,
      summary: `Posted room tariff charges for ${postedCount} in-house room(s) totaling ₹${totalTariffPosted}.`,
    };
  }

  // Step 3: Post recurring charges
  else if (stepNo === 3) {
    const recurring = await BillingEntity.find({
      hotelId: req.user.hotelId,
      entityType: "recurring-expense",
      status: "active",
    });

    let recurringCount = 0;
    let recurringAmount = 0;

    for (const rec of recurring) {
      const nextDate = rec.data?.nextDate
        ? new Date(rec.data.nextDate)
        : new Date();
      if (nextDate <= new Date(run.businessDate)) {
        await BillingEntity.create({
          hotelId: req.user.hotelId,
          entityType: "expense",
          status: "pending",
          reference: `REC-${rec.reference || "Recurring Charge"}`,
          amount: Number(rec.amount || 0),
          data: {
            description: `Recurring: ${rec.reference || "Expense"}`,
            category: rec.data?.category || "Utilities",
            amount: Number(rec.amount || 0),
            paymentStatus: "pending",
            sourceRecurringId: rec._id,
            postedByNightAudit: true,
          },
          createdBy: req.user._id,
        });

        // Advance nextDate by 1 month
        const updatedDate = new Date(nextDate);
        updatedDate.setMonth(updatedDate.getMonth() + 1);
        rec.data = { ...rec.data, nextDate: updatedDate };
        await rec.save();

        recurringCount++;
        recurringAmount += Number(rec.amount || 0);
      }
    }

    stepResult = {
      ...stepResult,
      recurringCount,
      recurringAmount,
      summary: `Processed ${recurringCount} recurring charge(s) totaling ₹${recurringAmount}.`,
    };
  }

  // Step 4: Verify payments and settlements
  else if (stepNo === 4) {
    const todayPayments = await Payment.find({
      hotelId: req.user.hotelId,
      createdAt: { $gte: run.businessDate },
    }).lean();

    const verifiedTotal = todayPayments
      .filter((p) => p.status === "success")
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    stepResult = {
      ...stepResult,
      paymentsVerifiedCount: todayPayments.length,
      verifiedTotal,
      summary: `Verified ${todayPayments.length} payment transactions totaling ₹${verifiedTotal}.`,
    };
  }

  // Step 5: Generate no-show and cancellation charges
  else if (stepNo === 5) {
    const noShowBookings = await Booking.find({
      hotelId: req.user.hotelId,
      status: "reserved",
      checkIn: { $lt: run.businessDate },
    });

    let noShowCount = 0;
    for (const b of noShowBookings) {
      b.status = "no-show";
      await b.save();

      const retentionFee = Number(b.pricing?.baseRate || 1500);
      await Bill.create({
        billNo: `NOSHOW-${Date.now().toString().slice(-6)}`,
        hotelId: req.user.hotelId,
        bookingId: b._id,
        guestName: b.guestDetails?.primaryGuest?.name || "No-Show Guest",
        billType: "room-charge",
        subtotal: retentionFee,
        totalAmount: retentionFee,
        paymentStatus: "unpaid",
        status: "saved",
        items: [
          {
            name: "No-Show Retention Charge (1 Night)",
            price: retentionFee,
            quantity: 1,
            notes: "Reservation did not arrive prior to night audit cutoff",
          },
        ],
      });
      noShowCount++;
    }

    stepResult = {
      ...stepResult,
      noShowCount,
      summary: `Processed ${noShowCount} no-show reservation(s) with retention charges.`,
    };
  }

  // Step 6: Reconcile POS postings
  else if (stepNo === 6) {
    const draftBills = await Bill.countDocuments({
      hotelId: req.user.hotelId,
      status: "draft",
    });

    stepResult = {
      ...stepResult,
      unpostedPosCount: draftBills,
      summary: draftBills
        ? `Found ${draftBills} unposted POS bill(s) requiring cashier review.`
        : "All POS and outlet postings verified and reconciled.",
    };
  }

  // Step 7: Run audit reports
  else if (stepNo === 7) {
    const [allBills, allRooms] = await Promise.all([
      Bill.find({
        hotelId: req.user.hotelId,
        createdAt: { $gte: run.businessDate },
      }).lean(),
      Room.find({ hotelId: req.user.hotelId }).lean(),
    ]);

    const revenue = allBills.reduce(
      (s, b) => s + Number(b.totalAmount || 0),
      0,
    );
    stepResult = {
      ...stepResult,
      trialBalanceRevenue: revenue,
      totalRooms: allRooms.length,
      summary: `Financial snapshot prepared: Total revenue ₹${revenue} across ${allRooms.length} rooms.`,
    };
  }

  // Step 8: Roll over to next business date
  else if (stepNo === 8) {
    const openShifts = await BillingWorkflow.updateMany(
      { hotelId: req.user.hotelId, type: "cashier-shift", status: "open" },
      {
        $set: {
          status: "closed",
          "payload.closingNote": "Closed by Night Audit Rollover",
        },
      },
    );

    const nextDate = new Date(run.businessDate);
    nextDate.setDate(nextDate.getDate() + 1);

    stepResult = {
      ...stepResult,
      closedShiftsCount: openShifts.modifiedCount,
      nextBusinessDate: nextDate,
      summary: `Closed ${openShifts.modifiedCount} open cashier shift(s). Property rolled over to business date ${nextDate.toLocaleDateString("en-IN")}.`,
    };
  }

  const row = await BillingEntity.findOneAndUpdate(
    {
      hotelId: req.user.hotelId,
      entityType: "night-audit-step",
      "data.runId": run._id,
      "data.stepNo": stepNo,
    },
    {
      $set: {
        status: "completed",
        amount: 0,
        data: {
          runId: run._id,
          stepNo,
          name: steps[stepNo - 1],
          result: stepResult,
          completedBy: req.user._id,
        },
      },
    },
    { upsert: true, new: true },
  );
  return res.json({ success: true, data: row });
};

export const confirmNightAuditStep = async (req, res) => {
  const row = await BillingEntity.findOneAndUpdate(
    {
      _id: req.params.stepId,
      hotelId: req.user.hotelId,
      entityType: "night-audit-step",
    },
    {
      $set: {
        status: "confirmed",
        "data.confirmedBy": req.user._id,
        "data.confirmedAt": new Date(),
      },
    },
    { new: true },
  ).lean();
  if (!row)
    return res
      .status(404)
      .json({ success: false, message: "Audit step not found" });
  return res.json({ success: true, data: row });
};

export const completeNightAudit = async (req, res) => {
  const run = await BillingWorkflow.findOne({
    _id: req.params.runId,
    hotelId: req.user.hotelId,
    type: "night-audit",
    status: "running",
  });
  if (!run)
    return res
      .status(404)
      .json({ success: false, message: "Active night audit not found" });
  const completed = await BillingEntity.countDocuments({
    hotelId: req.user.hotelId,
    entityType: "night-audit-step",
    "data.runId": run._id,
    status: { $in: ["completed", "confirmed"] },
  });
  if (completed < steps.length && !req.body.overrideReason)
    return res.status(400).json({
      success: false,
      message: `Complete all ${steps.length} audit steps before rollover`,
    });
  run.status = "completed";
  run.closedBy = req.user._id;
  run.payload = {
    ...run.payload,
    completedSteps: completed,
    overrideReason: req.body.overrideReason || null,
    completedAt: new Date(),
  };
  await run.save();
  return res.json({ success: true, data: run });
};

export const nightAuditReport = async (req, res) => {
  const overview = await nightAuditOverview(
    { ...req, query: { ...req.query, date: req.query.date } },
    { json: (payload) => payload },
  );
  return res.json({
    success: true,
    data: { type: req.params.type, generatedAt: new Date(), report: overview },
  });
};
