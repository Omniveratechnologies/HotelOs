import { formatCurrency } from "@hotelos/utils";

export function formatMoney(value?: number) {
  return value == null ? "—" : formatCurrency(value);
}
