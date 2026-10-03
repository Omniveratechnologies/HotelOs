import { generateUploadUrl } from "../utils/r2.js";
import crypto from "crypto";

export const getUploadUrl = async (req, res) => {
  try {
    const { fileName, contentType } = req.body;

    if (!fileName || !contentType) {
      return res.status(400).json({
        success: false,
        message: "fileName and contentType are required",
      });
    }

    if (!contentType.startsWith("image/")) {
      return res.status(400).json({
        success: false,
        message: "Only image files are allowed",
      });
    }

    const extension = fileName.split(".").pop();

    const key = `menu/${crypto.randomUUID()}.${extension}`;

    const uploadUrl = await generateUploadUrl(key, {
      contentType,
    });

    return res.status(200).json({
      success: true,
      data: {
        uploadUrl,
        key,
      },
    });
  } catch (error) {
    console.error("Generate upload URL error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate upload URL",
    });
  }
};
