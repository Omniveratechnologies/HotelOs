import { Notification } from "../models/notification.js";
import {
  NotificationQueue,
  QUEUE_CHANNELS,
} from "../models/notificationQueue.js";
import { Staff } from "../../staff-management/models/staffManagement.js";
import { ApiError, isObjectId } from "../../../utils/http.js";

const MAX_ATTEMPTS = 5;
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const enabledChannels = () =>
  String(process.env.LEAVE_NOTIFY_CHANNELS ?? QUEUE_CHANNELS.join(","))
    .split(",")
    .map((value) => value.trim().toUpperCase())
    .filter((value) => QUEUE_CHANNELS.includes(value));

const prettyDate = (key) => {
  const [y, m, d] = String(key).split("-");
  return `${d} ${MONTHS[Number(m) - 1]} ${y}`;
};

const range = (request) =>
  request.fromDate === request.toDate
    ? prettyDate(request.fromDate)
    : `${prettyDate(request.fromDate)} - ${prettyDate(request.toDate)}`;

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

const deliver = async ({
  hotelId,
  recipientType,
  recipientId = null,
  type,
  title,
  message,
  ref,
  contact = {},
}) => {
  await Notification.create({
    hotelId,
    recipientType,
    recipientId,
    type,
    title,
    message,
    ref,
  });

  for (const channel of enabledChannels()) {
    const to = channel === "EMAIL" ? contact.email : contact.phone;
    if (!to) continue;
    await NotificationQueue.create({
      hotelId,
      channel,
      to: String(to).trim(),
      subject: channel === "EMAIL" ? title : "",
      body: `${title}. ${message}`.slice(0, 1000),
      ref,
    });
  }
};
export const leaveApplied = async ({ hotelId, request, staff, type }) => {
  const manager = staff.managerId
    ? await Staff.findOne({ _id: staff.managerId, hotelId })
        .select("email phone")
        .lean()
    : null;

  await deliver({
    hotelId,
    recipientType: "APPROVER",
    recipientId: staff.managerId || null,
    type: "LEAVE_APPLIED",
    title: "New leave request",
    message: `${staff.name} applied for ${type.name} (${range(request)}, ${plural(request.days, "day")}).`,
    ref: { kind: "LeaveRequest", id: request._id },
    contact: { email: manager?.email, phone: manager?.phone },
  });
};

export const leaveDecided = async ({ hotelId, request, staff, type }) => {
  const word = {
    APPROVED: "approved",
    REJECTED: "rejected",
    CANCELLED: "cancelled",
  }[request.status];
  const tail = request.remarks ? ` Remarks: ${request.remarks}` : "";

  await deliver({
    hotelId,
    recipientType: "STAFF",
    recipientId: staff._id,
    type: `LEAVE_${request.status}`,
    title: `Your leave was ${word}`,
    message: `${type.name} ${range(request)} (${plural(request.days, "day")}) was ${word}.${tail}`,
    ref: { kind: "LeaveRequest", id: request._id },
    contact: { email: staff.email, phone: staff.phone },
  });
};

export const listNotifications = async (hotelId, query = {}) => {
  const recipientType = String(query.for || "APPROVER").toUpperCase();
  if (!["STAFF", "APPROVER"].includes(recipientType))
    throw new ApiError(400, "for must be STAFF or APPROVER.");

  const match = { hotelId, recipientType };
  if (recipientType === "STAFF") {
    if (!isObjectId(query.staffId))
      throw new ApiError(400, "staffId is required for STAFF notifications.");
    match.recipientId = query.staffId;
  }
  if (["1", "true"].includes(String(query.unread))) match.readAt = null;

  const limit = Math.min(50, Math.max(1, Number(query.limit) || 20));
  const [rows, unread] = await Promise.all([
    Notification.find(match)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .lean(),
    Notification.countDocuments({ ...match, readAt: null }),
  ]);

  return { unread, rows };
};

export const markRead = async (hotelId, body = {}, now = new Date()) => {
  const match = { hotelId, readAt: null };

  if (body.all === true) {
    match.recipientType = String(body.for || "APPROVER").toUpperCase();
    if (match.recipientType === "STAFF") {
      if (!isObjectId(body.staffId))
        throw new ApiError(400, "staffId is required.");
      match.recipientId = body.staffId;
    }
  } else if (
    Array.isArray(body.ids) &&
    body.ids.length > 0 &&
    body.ids.every(isObjectId)
  ) {
    match._id = { $in: body.ids };
  } else {
    throw new ApiError(400, "Send ids: [...] or all: true.");
  }

  const result = await Notification.updateMany(match, {
    $set: { readAt: now },
  });
  return { updated: result.modifiedCount ?? result.nModified ?? 0 };
};

export const processQueue = async (
  sender,
  { limit = 20, now = new Date() } = {},
) => {
  const due = await NotificationQueue.find({
    status: "PENDING",
    nextAttemptAt: { $lte: now },
  })
    .sort({ createdAt: 1 })
    .limit(limit)
    .lean();

  const result = { sent: 0, retried: 0, failed: 0 };

  for (const row of due) {
    // claim it, so a second worker does not send the same message
    const claimed = await NotificationQueue.findOneAndUpdate(
      { _id: row._id, status: "PENDING", nextAttemptAt: { $lte: now } },
      {
        $set: { nextAttemptAt: new Date(now.getTime() + 5 * 60000) },
        $inc: { attempts: 1 },
      },
      { new: true },
    );
    if (!claimed) continue;

    try {
      await sender({
        channel: claimed.channel,
        to: claimed.to,
        subject: claimed.subject,
        body: claimed.body,
      });
      await NotificationQueue.findOneAndUpdate(
        { _id: claimed._id },
        { $set: { status: "SENT", sentAt: now, lastError: "" } },
      );
      result.sent += 1;
    } catch (error) {
      const giveUp = claimed.attempts >= MAX_ATTEMPTS;
      await NotificationQueue.findOneAndUpdate(
        { _id: claimed._id },
        {
          $set: {
            status: giveUp ? "FAILED" : "PENDING",
            lastError: String(error?.message || error).slice(0, 200),
            nextAttemptAt: new Date(
              now.getTime() + 2 ** claimed.attempts * 60000,
            ),
          },
        },
      );
      result[giveUp ? "failed" : "retried"] += 1;
    }
  }

  return result;
};
