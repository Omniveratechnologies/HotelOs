import BillingEntity from "../models/BillingEntity.js";

const money = (value) => Number(value || 0);
const daysSince = (value) =>
  Math.max(
    0,
    Math.floor(
      (Date.now() - new Date(value || Date.now()).getTime()) / 86400000,
    ),
  );
const ageingBucket = (days) =>
  days <= 30 ? "0-30" : days <= 60 ? "31-60" : days <= 90 ? "61-90" : "90+";
const dataOf = (row) => ({ ...row?.data, id: row?._id });

const rowsFor = (hotelId, entityType) =>
  BillingEntity.find({ hotelId, entityType })
    .sort({ createdAt: -1 })
    .limit(1000)
    .lean();

export const listCompanies = async (req, res) => {
  const companies = (await rowsFor(req.user.hotelId, "company")).map(dataOf);
  const q = String(req.query.q || "").toLowerCase();
  const rows = companies.filter((company) => {
    const textMatch =
      !q ||
      `${company.name} ${company.industry} ${company.gstin} ${company.email}`
        .toLowerCase()
        .includes(q);
    const statusMatch =
      !req.query.status ||
      req.query.status === "all" ||
      String(company.status || "active").toLowerCase() ===
        String(req.query.status).toLowerCase();
    const industryMatch =
      !req.query.industry ||
      req.query.industry === "all" ||
      company.industry === req.query.industry;
    return textMatch && statusMatch && industryMatch;
  });
  return res.json({ success: true, data: rows });
};

export const companySummary = async (req, res) => {
  const [companies, invoices, ledger] = await Promise.all([
    rowsFor(req.user.hotelId, "company"),
    rowsFor(req.user.hotelId, "invoice"),
    rowsFor(req.user.hotelId, "city-ledger"),
  ]);
  const companyRows = companies.map(dataOf).map((company) => {
    const companyInvoices = invoices
      .map(dataOf)
      .filter(
        (invoice) =>
          String(invoice.companyId) === String(company.id) ||
          String(invoice.billToCompanyId) === String(company.id),
      );
    const companyLedger = ledger
      .map(dataOf)
      .filter((entry) => String(entry.companyId) === String(company.id));
    const outstanding =
      companyInvoices.reduce(
        (sum, invoice) =>
          sum +
          Math.max(
            0,
            money(invoice.amount || invoice.grandTotal) -
              money(invoice.paidAmount),
          ),
        0,
      ) +
      companyLedger.reduce(
        (sum, entry) => sum + money(entry.debit) - money(entry.credit),
        0,
      );
    return {
      ...company,
      outstanding,
      creditUsed: outstanding,
      creditUsage: company.creditLimit
        ? Math.round((outstanding / company.creditLimit) * 100)
        : 0,
    };
  });
  const outstanding = companyRows.reduce(
    (sum, row) => sum + row.outstanding,
    0,
  );
  const monthBilled = invoices.reduce((sum, row) => sum + money(row.amount), 0);
  return res.json({
    success: true,
    data: {
      metrics: {
        totalAccounts: companyRows.length,
        newThisMonth: companyRows.filter(
          (row) =>
            new Date(row.createdAt || Date.now()).getMonth() ===
            new Date().getMonth(),
        ).length,
        totalBilled: monthBilled,
        outstanding,
        outstandingAccounts: companyRows.filter((row) => row.outstanding > 0)
          .length,
        overdue: companyRows
          .filter((row) => row.outstanding > 0 && row.status === "overdue")
          .reduce((sum, row) => sum + row.outstanding, 0),
        activeContracts: companyRows.filter(
          (row) => row.contractEnd && new Date(row.contractEnd) > new Date(),
        ).length,
      },
      rows: companyRows,
      aging: ["0-30", "31-60", "61-90", "90+"].map((bucket) => ({
        bucket,
        amount: companyRows.reduce(
          (sum, row) =>
            sum + (row.ageingBucket === bucket ? row.outstanding : 0),
          0,
        ),
      })),
      invoices: invoices.slice(0, 8).map(dataOf),
      creditUsage: companyRows.filter((row) => row.creditLimit).slice(0, 8),
      contracts: companyRows
        .filter((row) => row.contractEnd)
        .sort((a, b) => new Date(a.contractEnd) - new Date(b.contractEnd))
        .slice(0, 6),
    },
  });
};

export const createCompany = async (req, res) => {
  const { name, gstin, pan, creditLimit = 0 } = req.body;
  if (!name?.trim())
    return res
      .status(400)
      .json({ success: false, message: "Legal company name is required" });
  if (gstin && !/^[0-9A-Z]{15}$/.test(String(gstin).toUpperCase()))
    return res
      .status(400)
      .json({ success: false, message: "GSTIN must contain 15 characters" });
  const identityChecks = [];
  if (gstin) identityChecks.push({ "data.gstin": String(gstin).toUpperCase() });
  if (pan) identityChecks.push({ "data.pan": String(pan).toUpperCase() });
  const duplicate = identityChecks.length
    ? await BillingEntity.findOne({
        hotelId: req.user.hotelId,
        entityType: "company",
        $or: identityChecks,
      })
    : null;
  if (duplicate && (gstin || pan))
    return res
      .status(409)
      .json({
        success: false,
        message: "A company with this GSTIN or PAN already exists",
      });
  const row = await BillingEntity.create({
    hotelId: req.user.hotelId,
    entityType: "company",
    status: "active",
    reference: name.trim(),
    amount: Number(creditLimit),
    data: {
      ...req.body,
      name: name.trim(),
      gstin: gstin?.toUpperCase(),
      pan: pan?.toUpperCase(),
      creditLimit: Number(creditLimit),
      outstanding: 0,
    },
    createdBy: req.user._id,
  });
  return res.status(201).json({ success: true, data: dataOf(row.toObject()) });
};

export const updateCompany = async (req, res) => {
  const row = await BillingEntity.findOneAndUpdate(
    { _id: req.params.id, hotelId: req.user.hotelId, entityType: "company" },
    { $set: { data: req.body, amount: Number(req.body.creditLimit || 0) } },
    { new: true },
  ).lean();
  if (!row)
    return res
      .status(404)
      .json({ success: false, message: "Company not found" });
  await BillingEntity.create({
    hotelId: req.user.hotelId,
    entityType: "audit-log",
    status: "completed",
    reference: `company-update-${row._id}`,
    data: { companyId: row._id, changes: req.body },
    createdBy: req.user._id,
  });
  return res.json({ success: true, data: dataOf(row) });
};

export const createCompanyInvoice = async (req, res) => {
  const company = await BillingEntity.findOne({
    _id: req.params.id,
    hotelId: req.user.hotelId,
    entityType: "company",
  }).lean();
  if (!company)
    return res
      .status(404)
      .json({ success: false, message: "Company not found" });
  const invoice = await BillingEntity.create({
    hotelId: req.user.hotelId,
    entityType: "invoice",
    status: "pending",
    reference: `CORP-${Date.now()}`,
    amount: Number(req.body.amount || 0),
    data: {
      ...req.body,
      companyId: company._id,
      billToCompanyId: company._id,
      type: "corporate",
      paidAmount: 0,
      issueDate: new Date(),
      dueDate:
        req.body.dueDate ||
        new Date(Date.now() + Number(company.data.creditDays || 30) * 86400000),
    },
    createdBy: req.user._id,
  });
  return res
    .status(201)
    .json({ success: true, data: dataOf(invoice.toObject()) });
};

export const createCompanyPayment = async (req, res) => {
  const amount = Number(req.body.amount || 0);
  if (amount <= 0)
    return res
      .status(400)
      .json({
        success: false,
        message: "Payment amount must be greater than zero",
      });
  let allocations = req.body.allocations || [];
  if (!allocations.length) {
    const openInvoices = await BillingEntity.find({
      hotelId: req.user.hotelId,
      entityType: "invoice",
      $or: [
        { "data.companyId": req.params.id },
        { "data.billToCompanyId": req.params.id },
      ],
    })
      .sort({ createdAt: 1 })
      .lean();
    let remaining = amount;
    allocations = openInvoices
      .map((invoice) => {
        const balance = Math.max(
          0,
          Number(invoice.amount || 0) - Number(invoice.data?.paidAmount || 0),
        );
        const allocationAmount = Math.min(balance, remaining);
        remaining -= allocationAmount;
        return allocationAmount > 0
          ? { invoiceId: invoice._id, amount: allocationAmount }
          : null;
      })
      .filter(Boolean);
  }
  for (const allocation of allocations) {
    const invoice = await BillingEntity.findOne({
      _id: allocation.invoiceId,
      hotelId: req.user.hotelId,
      entityType: "invoice",
    });
    if (invoice) {
      const paidAmount =
        Number(invoice.data?.paidAmount || 0) + Number(allocation.amount || 0);
      invoice.data = { ...invoice.data, paidAmount };
      invoice.status =
        paidAmount >= Number(invoice.amount || 0) ? "paid" : "partial";
      await invoice.save();
    }
  }
  const payment = await BillingEntity.create({
    hotelId: req.user.hotelId,
    entityType: "company-payment",
    status: "posted",
    reference: req.body.reference || `CP-${Date.now()}`,
    amount,
    data: { ...req.body, companyId: req.params.id, allocated: allocations },
    createdBy: req.user._id,
  });
  return res
    .status(201)
    .json({ success: true, data: dataOf(payment.toObject()) });
};

const receivableRows = async (hotelId) => {
  const [stored, invoices] = await Promise.all([
    rowsFor(hotelId, "receivable"),
    rowsFor(hotelId, "invoice"),
  ]);
  return [
    ...stored.map(dataOf),
    ...invoices
      .map(dataOf)
      .filter(
        (invoice) =>
          money(invoice.amount || invoice.grandTotal) -
            money(invoice.paidAmount) >
          0,
      )
      .map((invoice) => ({
        ...invoice,
        accountType: invoice.companyId ? "corporate" : "direct_guest",
        accountName: invoice.billTo || invoice.guestName || "Guest",
        balance:
          money(invoice.amount || invoice.grandTotal) -
          money(invoice.paidAmount),
        dueDate: invoice.dueDate || invoice.issueDate,
      })),
  ];
};

export const listReceivables = async (req, res) => {
  const q = String(req.query.q || "").toLowerCase();
  const rows = (await receivableRows(req.user.hotelId))
    .map((row) => {
      const ageingDays = daysSince(row.dueDate);
      return {
        ...row,
        ageingDays,
        ageingBucket: ageingBucket(ageingDays),
        status: row.disputeFlag
          ? "disputed"
          : ageingDays > 30
            ? "overdue"
            : "due_soon",
      };
    })
    .filter(
      (row) =>
        (!req.query.type ||
          req.query.type === "all" ||
          row.accountType === req.query.type) &&
        (!q ||
          `${row.accountName} ${row.reference} ${row.invoiceNo}`
            .toLowerCase()
            .includes(q)),
    );
  return res.json({ success: true, data: rows });
};

export const receivableSummary = async (req, res) => {
  const rows = await receivableRows(req.user.hotelId);
  const normalized = rows.map((row) => ({
    ...row,
    balance: money(
      row.balance ?? (row.amount || row.grandTotal) - row.paidAmount,
    ),
    ageingDays: daysSince(row.dueDate),
    accountType:
      row.accountType || (row.companyId ? "corporate" : "direct_guest"),
  }));
  const aging = ["0-30", "31-60", "61-90", "90+"].map((bucket) => ({
    bucket,
    amount: normalized
      .filter((row) => ageingBucket(row.ageingDays) === bucket)
      .reduce((sum, row) => sum + row.balance, 0),
  }));
  return res.json({
    success: true,
    data: {
      metrics: {
        outstanding: normalized.reduce((sum, row) => sum + row.balance, 0),
        ...Object.fromEntries(aging.map((row) => [row.bucket, row.amount])),
        remindersDue: normalized.filter((row) => row.ageingDays > 0).length,
        overdue: normalized.filter((row) => row.ageingDays > 30).length,
        dueSoon: normalized.filter((row) => row.ageingDays <= 7).length,
      },
      aging,
      typeSplit: ["corporate", "direct_guest", "travel_agent", "other"].map(
        (type) => ({
          type,
          amount: normalized
            .filter((row) => row.accountType === type)
            .reduce((sum, row) => sum + row.balance, 0),
        }),
      ),
      rows: normalized.sort((a, b) => b.balance - a.balance).slice(0, 10),
    },
  });
};

export const createReminder = async (req, res) => {
  const row = await BillingEntity.create({
    hotelId: req.user.hotelId,
    entityType: "reminder",
    status: "queued",
    reference: `REM-${Date.now()}`,
    data: { ...req.body, sentAt: new Date(), sentBy: req.user._id },
    createdBy: req.user._id,
  });
  return res.status(201).json({ success: true, data: dataOf(row.toObject()) });
};

export const recordReceivablePayment = async (req, res) => {
  if (Number(req.body.amount || 0) <= 0)
    return res
      .status(400)
      .json({
        success: false,
        message: "Payment amount must be greater than zero",
      });
  const amount = Number(req.body.amount);
  let allocations = req.body.allocations || [];
  if (!allocations.length) {
    const openInvoices = await BillingEntity.find({
      hotelId: req.user.hotelId,
      entityType: "invoice",
      status: { $nin: ["paid", "cancelled"] },
    })
      .sort({ createdAt: 1 })
      .lean();
    let remaining = amount;
    allocations = openInvoices
      .map((invoice) => {
        const balance = Math.max(
          0,
          Number(invoice.amount || 0) - Number(invoice.data?.paidAmount || 0),
        );
        const allocationAmount = Math.min(balance, remaining);
        remaining -= allocationAmount;
        return allocationAmount > 0
          ? { invoiceId: invoice._id, amount: allocationAmount }
          : null;
      })
      .filter(Boolean);
  }
  for (const allocation of allocations) {
    const invoice = await BillingEntity.findOne({
      _id: allocation.invoiceId,
      hotelId: req.user.hotelId,
      entityType: "invoice",
    });
    if (invoice) {
      const paidAmount =
        Number(invoice.data?.paidAmount || 0) + Number(allocation.amount || 0);
      invoice.data = { ...invoice.data, paidAmount };
      invoice.status =
        paidAmount >= Number(invoice.amount || 0) ? "paid" : "partial";
      await invoice.save();
    }
  }
  const row = await BillingEntity.create({
    hotelId: req.user.hotelId,
    entityType: "receivable-payment",
    status: "posted",
    amount,
    reference: req.body.reference || `ARP-${Date.now()}`,
    data: { ...req.body, allocations },
    createdBy: req.user._id,
  });
  return res.status(201).json({ success: true, data: dataOf(row.toObject()) });
};

export const updateReceivable = async (req, res) => {
  const entityType = req.path.endsWith("/write-off")
    ? "write-off"
    : "receivable";
  const row = await BillingEntity.create({
    hotelId: req.user.hotelId,
    entityType,
    status: req.body.status || "pending_approval",
    amount: Number(req.body.amount || 0),
    reference: req.params.id,
    data: { ...req.body, itemId: req.params.id, createdBy: req.user._id },
    createdBy: req.user._id,
  });
  return res.status(201).json({ success: true, data: dataOf(row.toObject()) });
};

export const receivableFollowUps = async (req, res) => {
  const rows = await receivableRows(req.user.hotelId);
  return res.json({
    success: true,
    data: {
      remindersDue: rows.filter((row) => daysSince(row.dueDate) > 0).length,
      overdue: rows.filter((row) => daysSince(row.dueDate) > 30).length,
      dueSoon: rows.filter((row) => daysSince(row.dueDate) <= 7).length,
      creditExceeded: 0,
    },
  });
};
