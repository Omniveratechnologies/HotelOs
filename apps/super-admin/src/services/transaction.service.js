import { mockTransactions } from "../data/mockData.js";

// =====================================================
// FETCH TRANSACTION SUMMARY
//
// Still using mock data.
// Do not connect to backend yet.
// =====================================================

export async function fetchTransactionSummary() {
  return [...mockTransactions];
}
