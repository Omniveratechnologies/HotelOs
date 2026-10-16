import { api } from "@hotelos/api";

const unwrap = (result) => result.data || result || [];
const request = (path, options = {}) =>
  api.get(path, { auth: true, ...options }).then(unwrap);
const mutate = (method, path, body, options = {}) =>
  api[method](path, body, { auth: true, ...options }).then(unwrap);

export const billingApi = {
  dashboard: (section, query = {}) =>
    request("/api/v1/billing/dashboard", { query: { section, ...query } }),
  bills: (query = {}) => request("/api/v1/billing/bills", { query }),
  payments: (query = {}) => request("/api/v1/billing/payments", { query }),
  paymentsSummary: (query = {}) =>
    request("/api/v1/billing/payments/summary", { query }),
  invoicesSummary: (query = {}) =>
    request("/api/v1/billing/invoices/summary", { query }),
  invoice: (id) => request(`/api/v1/billing/invoices/${id}`),
  createInvoice: (body) => mutate("post", "/api/v1/billing/invoices", body),
  createProforma: (body) =>
    mutate("post", "/api/v1/billing/invoices/proforma", body),
  createCreditNote: (id, body) =>
    mutate("post", `/api/v1/billing/invoices/${id}/credit-note`, body),
  sendInvoice: (id, body) =>
    mutate("post", `/api/v1/billing/invoices/${id}/send`, body),
  cancelInvoice: (id, body) =>
    mutate("post", `/api/v1/billing/invoices/${id}/cancel`, body),
  refunds: (query = {}) => request("/api/v1/billing/refunds", { query }),
  rooms: () => request("/api/v1/billing/rooms"),
  folio: (query = {}) => request("/api/v1/billing/folios", { query }),
  folioDetail: (id) => request(`/api/v1/billing/folios/${id}`),
  resource: (type, query = {}) =>
    request(`/api/v1/billing/resources/${type}`, { query }),
  createResource: (type, body) =>
    mutate("post", `/api/v1/billing/resources/${type}`, body),
  createPayment: (body) => mutate("post", "/api/v1/billing/payments", body),
  createBill: (body) => mutate("post", "/api/v1/billing/bills", body),
  createCharge: (body) => mutate("post", "/api/v1/billing/room-charges", body),
  createRefund: (body) => mutate("post", "/api/v1/billing/refunds", body),
  taxRules: (query = {}) => request("/api/v1/billing/tax-rules", { query }),
  createTaxRule: (body) => mutate("post", "/api/v1/billing/tax-rules", body),
  updateTaxRule: (id, body) =>
    mutate("put", `/api/v1/billing/tax-rules/${id}`, body),
  toggleTaxRule: (id, active) =>
    mutate("patch", `/api/v1/billing/tax-rules/${id}/status`, { active }),
  simulateTax: (body) =>
    mutate("post", "/api/v1/billing/tax-rules/simulate", body),
  taxSettings: () => request("/api/v1/billing/tax-settings"),
  updateTaxSettings: (body) =>
    mutate("put", "/api/v1/billing/tax-settings", body),
  companies: (query = {}) => request("/api/v1/billing/companies", { query }),
  companiesSummary: (query = {}) =>
    request("/api/v1/billing/companies/summary", { query }),
  createCompany: (body) => mutate("post", "/api/v1/billing/companies", body),
  updateCompany: (id, body) =>
    mutate("put", `/api/v1/billing/companies/${id}`, body),
  createCompanyInvoice: (id, body) =>
    mutate("post", `/api/v1/billing/companies/${id}/invoices`, body),
  createCompanyPayment: (id, body) =>
    mutate("post", `/api/v1/billing/companies/${id}/payments`, body),
  receivables: (query = {}) =>
    request("/api/v1/billing/receivables", { query }),
  receivablesSummary: (query = {}) =>
    request("/api/v1/billing/receivables/summary", { query }),
  sendReceivableReminders: (body) =>
    mutate("post", "/api/v1/billing/receivables/reminders", body),
  recordReceivablePayment: (body) =>
    mutate("post", "/api/v1/billing/receivables/payments", body),
  disputeReceivable: (id, body) =>
    mutate("post", `/api/v1/billing/receivables/${id}/dispute`, body),
  writeOffReceivable: (id, body) =>
    mutate("post", `/api/v1/billing/receivables/${id}/write-off`, body),
  receivableFollowUps: () => request("/api/v1/billing/receivables/follow-ups"),
  payables: (query = {}) => request("/api/v1/billing/payables", { query }),
  payablesSummary: (query = {}) =>
    request("/api/v1/billing/payables/summary", { query }),
  createPayable: (body) =>
    mutate("post", "/api/v1/billing/payables/bills", body),
  approvePayable: (id) =>
    mutate("post", `/api/v1/billing/bills/${id}/approve`, {}),
  createVendorPayment: (body) =>
    mutate("post", "/api/v1/billing/vendor-payments", body),
  createPaymentBatch: (body) =>
    mutate("post", "/api/v1/billing/vendor-payments/batch", body),
  expenses: (query = {}) => request("/api/v1/billing/expenses", { query }),
  expensesSummary: (query = {}) =>
    request("/api/v1/billing/expenses/summary", { query }),
  createExpense: (body) => mutate("post", "/api/v1/billing/expenses", body),
  bulkUploadExpenses: (body) =>
    mutate("post", "/api/v1/billing/expenses/bulk-upload", body),
  createRecurringExpense: (body) =>
    mutate("post", "/api/v1/billing/recurring-expenses", body),
  openCashierShift: (body) =>
    mutate("post", "/api/v1/billing/cashier/shifts/open", body),
  closeCashierShift: (id, body) =>
    mutate("post", `/api/v1/billing/cashier/shifts/${id}/close`, body),
  startNightAudit: (body) =>
    mutate("post", "/api/v1/billing/night-audit/start", body),
  nightAuditOverview: (query = {}) =>
    request("/api/v1/billing/night-audit/overview", { query }),
  executeNightAuditStep: (runId, stepNo) =>
    mutate(
      "post",
      `/api/v1/billing/night-audit/${runId}/steps/${stepNo}/execute`,
      {},
    ),
  confirmNightAuditStep: (runId, stepId) =>
    mutate(
      "post",
      `/api/v1/billing/night-audit/${runId}/steps/${stepId}/confirm`,
      {},
    ),
  completeNightAudit: (runId, body = {}) =>
    mutate("post", `/api/v1/billing/night-audit/${runId}/complete`, body),
  nightAuditReport: (type, query = {}) =>
    request(`/api/v1/billing/night-audit/reports/${type}`, { query }),
  runReconciliation: (body) =>
    mutate("post", "/api/v1/billing/reconciliation/run", body),
  cashierCurrent: () => request("/api/v1/billing/cashier/shifts/current"),
  cashierSummary: (query = {}) =>
    request("/api/v1/billing/cashier/summary", { query }),
  cashierTransactions: (query = {}) =>
    request("/api/v1/billing/cashier/transactions", { query }),
  createCashEntry: (body) =>
    mutate("post", "/api/v1/billing/cashier/cash-entries", body),
  recordCashCount: (body) =>
    mutate("post", "/api/v1/billing/cashier/cash-count", body),
  reconciliationSummary: (query = {}) =>
    request("/api/v1/billing/recon/summary", { query }),
  importReconciliation: (body) =>
    mutate("post", "/api/v1/billing/recon/import", body),
  runReconciliationJob: (body) =>
    mutate("post", "/api/v1/billing/recon/run", body),
  resolveDiscrepancy: (id, body) =>
    mutate("post", `/api/v1/billing/recon/discrepancies/${id}/resolve`, body),
  lockReconciliation: (body) =>
    mutate("post", "/api/v1/billing/recon/lock", body),
  addFolioCharge: (id, body) =>
    mutate("post", `/api/v1/billing/folios/${id}/charges`, body),
  splitFolio: (id, body) =>
    mutate("post", `/api/v1/billing/folios/${id}/split`, {
      ...body,
      itemIndexes: String(body.itemIndexes || "")
        .split(",")
        .map((value) => Number(value.trim()))
        .filter(Number.isInteger),
    }),
  mergeFolio: (id, body) =>
    mutate("post", `/api/v1/billing/folios/${id}/merge`, body),
  generateInvoice: (id, body) =>
    mutate("post", `/api/v1/billing/folios/${id}/invoice`, body),
  collectFolioPayment: (id, body) =>
    mutate("post", `/api/v1/billing/folios/${id}/payments`, body),
  shareFolio: (id, body) =>
    mutate("post", `/api/v1/billing/folios/${id}/share`, body),
  folioTaxBreakdown: (id) =>
    request(`/api/v1/billing/folios/${id}/tax-breakdown`),
  correctFolioCharge: (id, action, body) =>
    mutate("post", `/api/v1/billing/folios/${id}/charges/${action}`, body),
};
