import mongoose from "mongoose";
import { Staff } from "../../staff-management/models/staffManagement.js";
import { StaffShift } from "../../staff-management/models/staffShift.js";
import { ShiftAssignment } from "../models/staffAssignment.js";
import { ApiError, isObjectId } from "../../../utils/http.js";
import * as time from "../../../utils/attendanceTime.js";
import * as rules from "./shiftRules.js";

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const toId = (value) => new mongoose.Types.ObjectId(String(value));

export const shiftView = (shift, assignedCount = 0) => {
  const minutes = rules.durationMinutes(shift);
  const segments = rules.segmentsOf(shift);
  return {
    _id: shift._id,
    name: shift.name,
    startTime: shift.startTime,
    endTime: shift.endTime,
    segments: shift.segments?.length ? shift.segments : [],
    isSplit: Boolean(shift.segments?.length),
    crossesMidnight: time.crossesMidnight(shift.startTime, shift.endTime),
    timeLabel: segments
      .map((s) => `${rules.to12h(s.startTime)} – ${rules.to12h(s.endTime)}`)
      .join(" + "),
    timeLines: segments.map(
      (s) => `${rules.to12h(s.startTime)} – ${rules.to12h(s.endTime)}`,
    ),
    durationMinutes: minutes,
    durationLabel: rules.hoursLabel(minutes),
    breakMinutes: shift.breakMinutes ?? 0,
    paidMinutes: Math.max(0, minutes - (shift.breakMinutes ?? 0)),
    graceMinutes: shift.graceMinutes ?? 10,
    color: shift.color || "#3B82F6",
    sortOrder: shift.sortOrder ?? 0,
    isActive: shift.isActive !== false,
    status: shift.isActive === false ? "INACTIVE" : "ACTIVE",
    assignedCount,
  };
};

export const findShift = async (hotelId, id, { activeOnly = false } = {}) => {
  if (!isObjectId(id)) throw new ApiError(400, "Invalid shift ID.");
  const shift = await StaffShift.findOne({ _id: id, hotelId });
  if (!shift) throw new ApiError(404, "Shift not found.");
  if (activeOnly && shift.isActive === false)
    throw new ApiError(400, `${shift.name} is switched off. Turn it on first.`);
  return shift;
};

const ensureUniqueName = async (hotelId, name, excludeId = null) => {
  const query = { hotelId, name: new RegExp(`^${escapeRegex(name)}$`, "i") };
  if (excludeId) query._id = { $ne: excludeId };
  if (await StaffShift.findOne(query).lean())
    throw new ApiError(409, `A shift called "${name}" already exists.`);
};

export const getShift = async (hotelId, id) =>
  shiftView(await findShift(hotelId, id));

export const createShift = async (hotelId, body) => {
  const input = rules.readShiftInput(body);
  await ensureUniqueName(hotelId, input.name);

  const existing = await StaffShift.find({ hotelId })
    .select("sortOrder")
    .lean();
  const sortOrder =
    existing.reduce((max, row) => Math.max(max, row.sortOrder ?? 0), 0) + 1;
  const shift = await StaffShift.create({
    hotelId,
    ...input,
    color: input.color || rules.defaultColor(existing.length),
    sortOrder,
  });
  return shiftView(shift);
};

const usage = async (hotelId, shiftId) => {
  const [defaults, booked] = await Promise.all([
    Staff.countDocuments({
      hotelId,
      shiftId: toId(shiftId),
      deletedAt: null,
      status: "ACTIVE",
    }),
    ShiftAssignment.countDocuments({
      hotelId,
      shiftId: toId(shiftId),
      date: { $gte: time.todayKey() },
    }),
  ]);
  return { defaults, booked };
};

const usageMessage = (name, { defaults, booked }) => {
  const parts = [];
  if (defaults) parts.push(`${defaults} staff have it as their default shift`);
  if (booked)
    parts.push(
      `${booked} upcoming day${booked === 1 ? " is" : "s are"} booked on it`,
    );
  return `${name} is still in use: ${parts.join(" and ")}. Move them to another shift first.`;
};

export const updateShift = async (hotelId, id, body) => {
  const shift = await findShift(hotelId, id);
  const input = rules.readShiftInput(
    body,
    shift.toObject ? shift.toObject() : shift,
  );

  if (input.name.toLowerCase() !== shift.name.toLowerCase())
    await ensureUniqueName(hotelId, input.name, shift._id);

  if (shift.isActive !== false && input.isActive === false) {
    const used = await usage(hotelId, shift._id);
    if (used.defaults || used.booked)
      throw new ApiError(409, usageMessage(shift.name, used));
  }

  Object.assign(shift, {
    ...input,
    color: input.color || shift.color || "#3B82F6",
  });
  await shift.save();
  return shiftView(shift);
};

export const deleteShift = async (hotelId, id) => {
  const shift = await findShift(hotelId, id);
  const used = await usage(hotelId, shift._id);
  if (used.defaults || used.booked)
    throw new ApiError(409, usageMessage(shift.name, used));
  shift.isActive = false;
  await shift.save();
  return shiftView(shift);
};
