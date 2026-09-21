// Channel manager module
// Sub-modules:
//   - approvals (staff change requests & super-admin manual verification flow)
//   - config (Aiosell credentials & property settings)
//   - distribution (live rates, inventory, restrictions & channel operations)
//   - sync (two-way reconciliation between Hotel OS and Aiosell)
//   - webhooks (inbound Aiosell reservations webhooks)

export * as approvals from "./approvals/index.js";
export * as config from "./config/index.js";
export * as distribution from "./distribution/index.js";
export * as sync from "./sync/index.js";
export * as webhooks from "./webhooks/index.js";

export { default } from "./routes/channelManager.routes.js";
