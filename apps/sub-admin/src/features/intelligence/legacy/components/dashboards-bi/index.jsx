"use client";
import TotalRevenueDashboard from "./TotalRevenueDashboard";
import PmsPosRevenueDashboard from "./PmsPosRevenueDashboard";
import ProfitabilityDashboard from "./ProfitabilityDashboard";
import ConversionDashboard from "./ConversionDashboard";
import GuestSpendingDashboard from "./GuestSpendingDashboard";
import ForecastDashboard from "./ForecastDashboard";
import ClvDashboard from "./ClvDashboard";
import RecommendationsDashboard from "./RecommendationsDashboard";

export const BI_DASHBOARD_COMPONENTS = {
  "total-revenue": TotalRevenueDashboard,
  "pms-pos-revenue": PmsPosRevenueDashboard,
  profitability: ProfitabilityDashboard,
  conversion: ConversionDashboard,
  "guest-spending": GuestSpendingDashboard,
  "revenue-forecast": ForecastDashboard,
  clv: ClvDashboard,
  recommendations: RecommendationsDashboard,
};
