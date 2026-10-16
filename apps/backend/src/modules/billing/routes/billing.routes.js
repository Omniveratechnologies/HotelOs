import express from "express";
import {
  saveBill,
  listBills,
  getBill,
  cancelBill,
  listRoomCharges,
  addRoomCharge,
  settleRoomCharge,
  createPayment,
  listPayments,
  retryPayment,
  sendPaymentLink,
  createRefund,
  listRefunds,
  decideRefund,
  listKots,
  updateKotStatus,
  chargeCrud,
  couponCrud,
  getBillingSettings,
  updateBillingSettings,
  listRoomsLookup,
} from "../controllers/billing.controller.js";
import { authenticate } from "#/shared/middleware/auth.middleware.js";
import { authorize } from "#/shared/middleware/role.middleware.js";
import {
  getBillingDashboard,
  getPaymentsDashboard,
} from "../controllers/billingDashboard.controller.js";
import {
  listFolios,
  getFolioByBooking,
  getFolio,
  addFolioCharge,
  getFolioTaxBreakdown,
  splitFolio,
  mergeFolio,
  generateFolioInvoice,
  collectFolioPayment,
  shareFolio,
  correctFolioCharge,
} from "../controllers/billingDashboard.controller.js";
import {
  openCashierShift,
  closeCashierShift,
  runReconciliation,
} from "../controllers/billingWorkflow.controller.js";
import {
  listBillingEntities,
  createBillingEntity,
  updateBillingEntity,
} from "../controllers/billingEntity.controller.js";
import {
  listInvoices,
  invoiceSummary,
  getInvoice,
  createInvoice,
  createProforma,
  createCreditNote,
  sendInvoice,
  cancelInvoice,
} from "../controllers/invoice.controller.js";
import {
  listTaxRules,
  createTaxRule,
  updateTaxRule,
  toggleTaxRule,
  simulateTax,
  getTaxSettings,
  updateTaxSettings,
} from "../controllers/tax.controller.js";
import {
  listCompanies,
  companySummary,
  createCompany,
  updateCompany,
  createCompanyInvoice,
  createCompanyPayment,
  listReceivables,
  receivableSummary,
  createReminder,
  recordReceivablePayment,
  updateReceivable,
  receivableFollowUps,
} from "../controllers/corporateReceivable.controller.js";
import {
  listPayables,
  payablesSummary,
  createPayable,
  approvePayable,
  createVendorPayment,
  createPaymentBatch,
  createExpense,
  bulkUploadExpenses,
  listExpenses,
  expenseSummary,
  createRecurringExpense,
} from "../controllers/payablesExpenses.controller.js";
import {
  currentCashier,
  cashierSummary,
  createCashEntry,
  recordCashCount,
  listCashierTransactions,
  reconciliationSummary,
  importReconciliation,
  runReconciliationJob,
  resolveDiscrepancy,
  lockReconciliation,
} from "../controllers/cashierReconciliation.controller.js";
import {
  nightAuditOverview,
  startNightAuditRun,
  executeNightAuditStep,
  confirmNightAuditStep,
  completeNightAudit,
  nightAuditReport,
} from "../controllers/nightAudit.controller.js";

const router = express.Router();

router.get("/coupons/public/:hotelId/:code", async (req, res) => {
  try {
    const coupon = await Coupon.findOne({
      hotelId: req.params.hotelId,
      code: req.params.code.toUpperCase(),
      status: true,
    });
    if (!coupon)
      return res
        .status(404)
        .json({ success: false, message: "Invalid coupon code" });
    if (coupon.validTill && new Date() > coupon.validTill)
      return res
        .status(400)
        .json({ success: false, message: "Coupon expired" });
    return res.status(200).json({ success: true, data: couponDTO(coupon) });
  } catch {
    return res
      .status(500)
      .json({ success: false, message: "Failed to validate coupon" });
  }
});
// keep this ABOVE router.use(authenticate, authorize(...))
router.use(authenticate, authorize("SUB_ADMIN", "KITCHEN", "RECEPTIONIST"));

router.get("/dashboard", getBillingDashboard);
router.get("/payments/summary", getPaymentsDashboard);
router.get("/invoices", listInvoices);
router.get("/invoices/summary", invoiceSummary);
router.get("/invoices/:id", getInvoice);
router.post("/invoices", createInvoice);
router.post("/invoices/proforma", createProforma);
router.post("/invoices/:id/credit-note", createCreditNote);
router.post("/invoices/:id/send", sendInvoice);
router.post("/invoices/:id/cancel", cancelInvoice);
router.get("/tax-rules", listTaxRules);
router.post("/tax-rules", createTaxRule);
router.put("/tax-rules/:id", updateTaxRule);
router.patch("/tax-rules/:id/status", toggleTaxRule);
router.post("/tax-rules/simulate", simulateTax);
router.get("/tax-settings", getTaxSettings);
router.put("/tax-settings", updateTaxSettings);
router.get("/payables", listPayables);
router.get("/payables/summary", payablesSummary);
router.get("/payables/trend", payablesSummary);
router.get("/payables/by-category", payablesSummary);
router.get("/payables/upcoming", payablesSummary);
router.post("/payables/bills", createPayable);
router.post("/bills/:id/approve", approvePayable);
router.post("/vendor-payments", createVendorPayment);
router.post("/vendor-payments/batch", createPaymentBatch);
router.get("/expenses", listExpenses);
router.get("/expenses/summary", expenseSummary);
router.get("/expenses/trend", expenseSummary);
router.get("/expenses/by-category", expenseSummary);
router.post("/expenses", createExpense);
router.post("/expenses/bulk-upload", bulkUploadExpenses);
router.post("/recurring-expenses", createRecurringExpense);
router.get("/companies", listCompanies);
router.post("/companies", createCompany);
router.put("/companies/:id", updateCompany);
router.get("/companies/summary", companySummary);
router.get("/companies/aging", companySummary);
router.post("/companies/:id/invoices", createCompanyInvoice);
router.post("/companies/:id/payments", createCompanyPayment);
router.get("/companies/credit-usage", companySummary);
router.get("/contracts/expiring", companySummary);
router.get("/receivables/summary", receivableSummary);
router.get("/receivables/follow-ups", receivableFollowUps);
router.get("/receivables", listReceivables);
router.post("/receivables/reminders", createReminder);
router.post("/receivables/payments", recordReceivablePayment);
router.post("/receivables/:id/dispute", updateReceivable);
router.post("/receivables/:id/write-off", updateReceivable);
router.get("/receivables/:account/statement", listReceivables);
router.get("/folios", listFolios);
router.get("/folios/by-booking/:bookingId", getFolioByBooking);
router.get("/folios/:id", getFolio);
router.post("/folios/:id/charges", (req, res) => {
  req.body.billId = req.params.id;
  return addFolioCharge(req, res);
});
router.get("/folios/:id/tax-breakdown", getFolioTaxBreakdown);
router.post("/folios/:id/split", splitFolio);
router.post("/folios/:id/merge", mergeFolio);
router.post("/folios/:id/invoice", generateFolioInvoice);
router.post("/folios/:id/payments", collectFolioPayment);
router.post("/folios/:id/share", shareFolio);
router.post("/folios/:id/charges/:action", correctFolioCharge);
router.post("/cashier/shifts/open", openCashierShift);
router.post("/cashier/shifts/:id/close", closeCashierShift);
router.get("/cashier/shifts/current", currentCashier);
router.get("/cashier/summary", cashierSummary);
router.get("/cashier/transactions", listCashierTransactions);
router.post("/cashier/cash-entries", createCashEntry);
router.post("/cashier/cash-count", recordCashCount);
router.get("/night-audit/overview", nightAuditOverview);
router.get("/night-audit/folios", nightAuditOverview);
router.post("/night-audit/start", startNightAuditRun);
router.post("/night-audit/:runId/steps/:stepNo/execute", executeNightAuditStep);
router.post("/night-audit/:runId/steps/:stepId/confirm", confirmNightAuditStep);
router.post("/night-audit/:runId/complete", completeNightAudit);
router.get("/night-audit/reports/:type", nightAuditReport);
router.post("/reconciliation/run", runReconciliation);
router.get("/recon/summary", reconciliationSummary);
router.get("/recon/transactions", listCashierTransactions);
router.get("/recon/discrepancies", reconciliationSummary);
router.post("/recon/import", importReconciliation);
router.post("/recon/run", runReconciliationJob);
router.post("/recon/discrepancies/:id/resolve", resolveDiscrepancy);
router.post("/recon/lock", lockReconciliation);
router.get("/resources/:type", listBillingEntities);
router.post("/resources/:type", createBillingEntity);
router.patch("/resources/:type/:id", updateBillingEntity);

router.patch("/bills/:id/save", saveBill);
router.get("/bills", listBills);
router.get("/bills/:id", getBill);
router.patch("/bills/:id/cancel", cancelBill);

router.get("/room-charges", listRoomCharges);
router.post("/room-charges", addRoomCharge);
router.patch("/room-charges/:id/settle", settleRoomCharge);

router.post("/payments", createPayment);
router.get("/payments", listPayments);
router.post("/payments/:id/retry", retryPayment);
router.post("/payments/:id/send-link", sendPaymentLink);

router.post("/refunds", createRefund);
router.get("/refunds", listRefunds);
router.patch("/refunds/:id/decision", decideRefund);

router.get("/kots", listKots);
router.patch("/kots/:id/status", updateKotStatus);

router.get("/charges", chargeCrud.list);
router.post("/charges", chargeCrud.create);
router.patch("/charges/:id", chargeCrud.update);
router.delete("/charges/:id", chargeCrud.remove);

router.get("/coupons", couponCrud.list);
router.post("/coupons", couponCrud.create);
router.patch("/coupons/:id", couponCrud.update);
router.delete("/coupons/:id", couponCrud.remove);

router.get("/settings", getBillingSettings);
router.patch("/settings", updateBillingSettings);

router.get("/rooms", listRoomsLookup);

export default router;
