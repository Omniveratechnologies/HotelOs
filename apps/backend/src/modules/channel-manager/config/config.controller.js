import ChannelManagerConfig from "./models/ChannelManagerConfig.js";
import aiosell from "#/shared/services/aiosell.service.js";
import logger from "#/utils/logger.js";

export const getChannelManagerConfig = async (req, res) => {
  try {
    const config = await ChannelManagerConfig.findOne();
    if (!config) {
      return res.status(200).json({
        success: true,
        message: "Channel manager config fetched",
        data: { pmsSlug: null, baseUrl: null, isEnabled: false },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Channel manager config fetched",
      data: {
        pmsSlug: config.pmsSlug,
        baseUrl: config.baseUrl,
        isEnabled: config.isEnabled,
        lastSyncAt: config.lastSyncAt,
      },
    });
  } catch (error) {
    logger.error(error, "Get channel manager config error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch config" });
  }
};

export const updateChannelManagerConfig = async (req, res) => {
  try {
    const { pmsSlug, username, password, baseUrl, isEnabled } = req.body;

    let config = await ChannelManagerConfig.findOne();

    if (
      pmsSlug === undefined &&
      username === undefined &&
      password === undefined &&
      baseUrl === undefined &&
      isEnabled === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    if (config) {
      if (pmsSlug !== undefined) config.pmsSlug = pmsSlug;
      if (username !== undefined) config.username = username;
      if (password !== undefined) config.password = password;
      if (baseUrl !== undefined) config.baseUrl = baseUrl;
      if (isEnabled !== undefined) config.isEnabled = isEnabled;
      await config.save();
    } else {
      config = await ChannelManagerConfig.create({
        pmsSlug,
        username,
        password,
        baseUrl,
        isEnabled: isEnabled ?? false,
      });
    }

    aiosell.invalidateConfigCache();

    return res.status(200).json({
      success: true,
      message: "Channel manager config updated",
      data: {
        pmsSlug: config.pmsSlug,
        baseUrl: config.baseUrl,
        isEnabled: config.isEnabled,
      },
    });
  } catch (error) {
    logger.error(error, "Update channel manager config error");
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update config",
    });
  }
};
