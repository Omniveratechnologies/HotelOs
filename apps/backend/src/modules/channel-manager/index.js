// Channel manager module (inbound Aiosell webhooks). No JWT here — the webhook
// endpoint is authenticated via Basic Auth against the stored
// ChannelManagerConfig credentials instead.
export { default } from "./routes/channelManager.routes.js";
