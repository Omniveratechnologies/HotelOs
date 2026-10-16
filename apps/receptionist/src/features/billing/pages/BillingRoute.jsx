import BillingPage from "../BillingPage.jsx";
import GuestFolioPage from "./GuestFolioPage.jsx";
import PaymentsPage from "./PaymentsPage.jsx";
import InvoicesPage from "./InvoicesPage.jsx";
import TaxesChargesPage from "./TaxesChargesPage.jsx";
import CorporateBillingPage from "./CorporateBillingPage.jsx";
import ReceivablesPage from "./ReceivablesPage.jsx";
import PayablesPage from "./PayablesPage.jsx";
import ExpensesPage from "./ExpensesPage.jsx";
import CashierPage from "./CashierPage.jsx";
import ReconciliationPage from "./ReconciliationPage.jsx";
import NightAuditPage from "./NightAuditPage.jsx";
import { useLoaderData } from "react-router";

export default function BillingRoute() {
  const { section } = useLoaderData();
  if (section === "folio") return <GuestFolioPage />;
  if (section === "payments") return <PaymentsPage />;
  if (section === "invoices") return <InvoicesPage />;
  if (section === "taxes-charges") return <TaxesChargesPage />;
  if (section === "corporate") return <CorporateBillingPage />;
  if (section === "receivables") return <ReceivablesPage />;
  if (section === "payables") return <PayablesPage />;
  if (section === "expenses") return <ExpensesPage />;
  if (section === "cashier") return <CashierPage />;
  if (section === "reconciliation") return <ReconciliationPage />;
  if (section === "night-audit") return <NightAuditPage />;
  return <BillingPage section={section} />;
}
