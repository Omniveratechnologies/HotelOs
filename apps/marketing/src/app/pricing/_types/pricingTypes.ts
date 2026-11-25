export interface ComparisonColumn {
  title: string;
  note: string;
  kind: "fixed" | "custom";
}

export interface ComparisonRow {
  label: string;
  values: Array<string | boolean>;
}

export interface FaqItem {
  question: string;
  answer: string;
}
