import mongoose from "mongoose";
import logger from "#/utils/logger.js";
import { queryLiveDashboardData } from "#/modules/intelligence/services/pms/live-dashboard-data.js";
import { queryPosLiveData } from "#/modules/intelligence/services/pos/live-data.js";
import { queryBiLiveData } from "#/modules/intelligence/services/bi/live-data.js";

const SUPPORTED_RANGES = new Set(["7d", "30d", "90d", "12m"]);
const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const INSIGHT_FIELDS = ["topInsight", "opportunity", "risk", "recommendation"];

const buildLocalInsights = (dashboard, data) => {
  const primaryMetric = data.metrics?.[0];
  const metricSummary = primaryMetric
    ? `${primaryMetric.label}: ${primaryMetric.value} (${primaryMetric.change}).`
    : "Review the dashboard metrics for the selected period.";

  return {
    topInsight: metricSummary,
    opportunity:
      "Use the dashboard breakdowns to identify the strongest opportunity for this period.",
    risk: "Monitor changes across the selected period and investigate unusual movements.",
    recommendation:
      "Compare this period with the previous period before changing pricing or operations.",
    model: `local-rules-${dashboard}`,
  };
};

const aggregateValue = (value) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const text = String(value ?? "").trim();
  const normalized = text
    .replace(/\p{Sc}/gu, "")
    .replaceAll(",", "")
    .trim();
  return /^[-+]?\d+(?:\.\d+)?%?$/.test(normalized) ? text : null;
};

export const buildGroqInsights = async ({ module, dashboard, range, data }) => {
  const metrics = Array.isArray(data.metrics)
    ? data.metrics.slice(0, 12).map((metric) => ({
        label: String(metric?.label || "").slice(0, 100),
        value: aggregateValue(metric?.value),
        change: aggregateValue(metric?.change),
      }))
    : [];
  const response = await fetch(GROQ_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.MODEL || "qwen/qwen3.8-27b",
      messages: [
        {
          role: "system",
          content:
            "Write concise hotel analytics insights using only the supplied aggregate metrics. Do not invent numbers or claim causes not supported by the data. Return only a JSON object with exactly these string fields: topInsight, opportunity, risk, recommendation. Each field must be one sentence.",
        },
        {
          role: "user",
          content: JSON.stringify({ module, dashboard, range, metrics }),
        },
      ],
      temperature: 0.2,
      max_tokens: 400,
      response_format: { type: "json_object" },
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Groq returned HTTP ${response.status}.`);
  }

  const result = await response.json();
  const content = result.choices?.[0]?.message?.content;
  const parsed = JSON.parse(content);
  const insights = {};

  for (const field of INSIGHT_FIELDS) {
    if (typeof parsed[field] !== "string" || !parsed[field].trim()) {
      throw new Error(`Groq response is missing ${field}.`);
    }
    insights[field] = parsed[field].trim().slice(0, 500);
  }

  return {
    ...insights,
    model: process.env.MODEL || "qwen/qwen3.8-27b",
    provider: "groq",
  };
};

export const getIntelligenceDashboard = async (req, res) => {
  try {
    const { module, dashboard } = req.params;
    const { range = "30d" } = req.query;
    const hotelId = req.user?.hotelId;

    if (!hotelId || !mongoose.isValidObjectId(hotelId)) {
      return res.status(400).json({
        success: false,
        message: "A valid hotel assignment is required.",
      });
    }

    if (!SUPPORTED_RANGES.has(range)) {
      return res.status(400).json({
        success: false,
        message: "Unsupported range. Use 7d, 30d, 90d, or 12m.",
      });
    }

    let data;
    if (module === "pms") {
      data = await queryLiveDashboardData(dashboard, range, hotelId.toString());
    } else if (module === "pos") {
      data = await queryPosLiveData(dashboard, range, req);
    } else if (module === "bi") {
      data = await queryBiLiveData(dashboard, range, req);
    } else {
      return res.status(404).json({
        success: false,
        message: "Unknown intelligence module.",
      });
    }

    if (!(module === "bi" && dashboard === "recommendations")) {
      const localInsights = buildLocalInsights(dashboard, data);
      if (process.env.GROQ_API_KEY) {
        try {
          data.insights = await buildGroqInsights({
            module,
            dashboard,
            range,
            data,
          });
        } catch (error) {
          logger.warn(
            { dashboard, error: error.message },
            "Groq insight generation failed; using local insights",
          );
          data.insights = {
            ...localInsights,
            model: "local-rules-groq-fallback",
            warning:
              "Groq could not generate insights. Showing local rule-based insights instead.",
          };
        }
      } else {
        data.insights = localInsights;
      }
    }

    res.set("Cache-Control", "no-store");
    return res.status(200).json(data);
  } catch (error) {
    logger.error(error, "Get intelligence dashboard error");

    return res.status(error.status || 500).json({
      success: false,
      message:
        error.status && error.status < 500
          ? error.message
          : "Failed to fetch intelligence dashboard",
    });
  }
};

export const updateIntelligenceRecommendation = async (req, res) => {
  try {
    const hotelId = req.user?.hotelId;
    const recommendationId = req.params.id;
    const { action } = req.body || {};

    if (!hotelId || !mongoose.isValidObjectId(hotelId)) {
      return res.status(400).json({
        success: false,
        message: "A valid hotel assignment is required.",
      });
    }

    if (!mongoose.isValidObjectId(recommendationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid recommendation id.",
      });
    }

    if (!["apply", "dismiss", "reopen"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action must be "apply", "dismiss", or "reopen".',
      });
    }

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("Database connection is unavailable.");
    }

    const status =
      action === "apply"
        ? "applied"
        : action === "dismiss"
          ? "dismissed"
          : "new";
    const result = await db.collection("recommendations").findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(recommendationId),
        hotelId: new mongoose.Types.ObjectId(hotelId),
      },
      {
        $set: {
          status,
          appliedAt: status === "applied" ? new Date() : null,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" },
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Recommendation not found.",
      });
    }

    return res.status(200).json({
      success: true,
      recommendation: {
        ...result,
        id: result._id.toString(),
      },
    });
  } catch (error) {
    logger.error(error, "Update intelligence recommendation error");

    return res.status(500).json({
      success: false,
      message: "Failed to update recommendation.",
    });
  }
};
