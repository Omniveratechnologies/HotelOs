export interface DashboardMetric {
  label: string;
  value: string | number;
  change?: string;
  icon: string;
}

export interface InsightData {
  model?: string;
  warning?: string;
  provider?: string;
  topInsight?: string;
  opportunity?: string;
  risk?: string;
  recommendation?: string;
  [key: string]: unknown;
}

export interface DashboardData {
  metrics?: DashboardMetric[];
  insights?: InsightData;
  generatedAt?: string;
  range?: string;
  series?: Record<string, unknown>[];
  [key: string]: unknown;
}

export interface DashboardState {
  key: string | null;
  data: DashboardData | null;
  error: string;
  loading: boolean;
}
