import { ApiError } from "../../../utils/http.js";
import * as time from "../../../utils/attendanceTime.js";

const DAY = 1440;
const COLORS = [
  "#22C55E",
  "#3B82F6",
  "#A855F7",
  "#F59E0B",
  "#EF4444",
  "#14B8A6",
];

export const dayNumber = (key) =>
  Math.round(Date.parse(`${key}T00:00:00Z`) / 86400000);
export const weekdayOf = (key) => new Date(`${key}T00:00:00Z`).getUTCDay();

export const segmentsOf = (shift) =>
  shift.segments?.length
    ? shift.segments
    : [{ startTime: shift.startTime, endTime: shift.endTime }];

export const spansOf = (shift) => {
  let offset = 0;
  let previousEnd = -1;
  return segmentsOf(shift).map((segment) => {
    let start = time.toMinutes(segment.startTime) + offset;
    if (start < previousEnd) {
      offset += DAY;
      start += DAY;
    }
    let end = time.toMinutes(segment.endTime) + offset;
    if (end <= start) end += DAY;
    previousEnd = end;
    return [start, end];
  });
};

export const durationMinutes = (shift) =>
  spansOf(shift).reduce((sum, [start, end]) => sum + (end - start), 0);

export const absWindows = (dateKey, shift) => {
  const base = dayNumber(dateKey) * DAY;
  return spansOf(shift).map(([start, end]) => [base + start, base + end]);
};

export const windowsOverlap = (a, b) =>
  a.some((x) => b.some((y) => x[0] < y[1] && y[0] < x[1]));
export const firstStart = (windows) => windows[0][0];
export const lastEnd = (windows) => windows[windows.length - 1][1];

export const shiftInstants = (dateKey, shift) => {
  const spans = spansOf(shift);
  const at = (minute) => {
    const day = Math.floor(minute / DAY);
    const rest = minute % DAY;
    const hhmm = `${String(Math.floor(rest / 60)).padStart(2, "0")}:${String(rest % 60).padStart(2, "0")}`;
    return time.wallTimeToInstant(time.addDays(dateKey, day), hhmm);
  };
  return { start: at(spans[0][0]), end: at(spans[spans.length - 1][1]) };
};

export const to12h = (hhmm) => {
  const [h, m] = String(hhmm).split(":").map(Number);
  return `${String(h % 12 === 0 ? 12 : h % 12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};

export const hoursLabel = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h} ${h === 1 ? "hr" : "hrs"}`;
  return `${h}h ${String(m).padStart(2, "0")}m`;
};

export const clock = (instant) =>
  instant
    ? new Intl.DateTimeFormat("en-US", {
        timeZone: time.hotelTimezone(),
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }).format(new Date(instant))
    : "";

const text = (value) => String(value ?? "").trim();

export const readShiftInput = (body = {}, current = null) => {
  const pick = (key) => (body[key] !== undefined ? body[key] : current?.[key]);

  const name = text(pick("name")).replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 40)
    throw new ApiError(400, "Shift name must be 2-40 characters.");

  let segments =
    body.segments !== undefined ? body.segments : current?.segments || [];
  if (!Array.isArray(segments))
    throw new ApiError(400, "Segments must be a list.");
  segments = segments.map((segment) => ({
    startTime: text(segment?.startTime),
    endTime: text(segment?.endTime),
  }));

  let startTime = text(pick("startTime"));
  let endTime = text(pick("endTime"));

  if (segments.length === 1 || segments.length > 4) {
    throw new ApiError(
      400,
      "A split shift needs 2 to 4 segments. Leave segments empty for a normal shift.",
    );
  }
  if (segments.length >= 2) {
    startTime = segments[0].startTime;
    endTime = segments[segments.length - 1].endTime;
  }

  const times = segments.length
    ? segments.flatMap((segment) => [segment.startTime, segment.endTime])
    : [startTime, endTime];
  if (times.some((value) => !time.isTime(value)))
    throw new ApiError(400, "Times must use HH:mm (24-hour) format.");

  const shape = { startTime, endTime, segments };
  segments.forEach((segment) => {
    if (segment.startTime === segment.endTime)
      throw new ApiError(
        400,
        "A segment can't start and end at the same time.",
      );
  });
  if (!segments.length && startTime === endTime)
    throw new ApiError(400, "Start and end time can't be the same.");

  const spans = spansOf(shape);
  if (spans[spans.length - 1][1] - spans[0][0] > DAY) {
    throw new ApiError(
      400,
      "A shift can't be longer than 24 hours. Check the segment order.",
    );
  }
  for (let i = 1; i < segments.length; i += 1) {
    const before = segments[i - 1];
    if (time.toMinutes(before.endTime) <= time.toMinutes(before.startTime)) {
      throw new ApiError(
        400,
        "Only the last segment of a split shift can run past midnight.",
      );
    }
    if (
      time.toMinutes(segments[i].startTime) < time.toMinutes(before.endTime)
    ) {
      throw new ApiError(400, "Split segments overlap or are out of order.");
    }
  }

  const breakMinutes = Number(pick("breakMinutes") ?? 0);
  const graceMinutes = Number(pick("graceMinutes") ?? 10);
  if (!Number.isInteger(breakMinutes) || breakMinutes < 0 || breakMinutes > 240)
    throw new ApiError(400, "Break must be 0-240 minutes.");
  if (!Number.isInteger(graceMinutes) || graceMinutes < 0 || graceMinutes > 120)
    throw new ApiError(400, "Grace period must be 0-120 minutes.");
  if (breakMinutes >= durationMinutes(shape))
    throw new ApiError(400, "The break can't be as long as the shift.");

  const color = text(pick("color")) || "";
  if (color && !/^#[0-9a-fA-F]{6}$/.test(color))
    throw new ApiError(400, "Colour must look like #22C55E.");

  return {
    name,
    ...shape,
    breakMinutes,
    graceMinutes,
    color: color.toUpperCase(),
    isActive: pick("isActive") === undefined ? true : Boolean(pick("isActive")),
  };
};

export const defaultColor = (index) => COLORS[index % COLORS.length];

export const gapBetween = (earlierWindows, laterWindows) =>
  firstStart(laterWindows) - lastEnd(earlierWindows);
