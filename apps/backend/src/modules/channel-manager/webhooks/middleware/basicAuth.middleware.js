import ChannelManagerConfig from "#/modules/channel-manager/config/models/ChannelManagerConfig.js";

import logger from "#/utils/logger.js";

// Validates the incoming Basic Auth header against the stored
// ChannelManagerConfig credentials (this is what Aiosell uses to authenticate
// its webhook deliveries).
export const validateBasicAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Basic ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const config = await ChannelManagerConfig.findOne().select("+password");
    if (!config) {
      return res.status(401).json({
        success: false,
        message: "Channel manager not configured",
      });
    }

    const expectedAuth =
      "Basic " +
      Buffer.from(`${config.username}:${config.password}`).toString("base64");

    if (authHeader !== expectedAuth) {
      logger.warn("Invalid Basic Auth on channel manager webhook");
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    next();
  } catch (error) {
    logger.error(error, "Basic auth validation error");
    return res.status(500).json({
      success: false,
      message: "Authentication error",
    });
  }
};
