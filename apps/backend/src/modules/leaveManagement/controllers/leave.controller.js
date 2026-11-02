import { getHotelId, route } from "../../../utils/http.js";
import * as service from "../services/leave.service.js";
import * as notifications from "../services/leaveNotifcation.service.js";

// Who is making the change (empty until login exists)
const actorOf = (req) => ({
  userId: req.user?._id || req.user?.id || null,
  name: req.user?.name || req.user?.fullName || "",
});

// GET /leaves?from=&to=&department_id=&leave_type_id=&status=&q=&sort=&direction=&page=&limit=
export const listLeaves = route(async (req, res) => {
  const { rows, pagination } = await service.listLeaves(
    getHotelId(req),
    req.query,
  );
  res.json({ success: true, data: rows, pagination });
});

// GET /leaves/stats
export const leaveStats = route(async (req, res) => {
  res.json({
    success: true,
    data: await service.leaveStats(getHotelId(req), req.query),
  });
});

// GET /leaves/types
export const listLeaveTypes = route(async (req, res) => {
  res.json({
    success: true,
    data: await service.listLeaveTypes(getHotelId(req)),
  });
});

// GET /leaves/staff/:id/leave-balance?year=
export const staffLeaveBalance = route(async (req, res) => {
  res.json({
    success: true,
    data: await service.staffLeaveBalance(
      getHotelId(req),
      req.params.id,
      req.query,
    ),
  });
});

// GET /leaves/notifications?for=APPROVER|STAFF&staffId=&unread=1&limit=
export const listNotifications = route(async (req, res) => {
  res.json({
    success: true,
    data: await notifications.listNotifications(getHotelId(req), req.query),
  });
});

// POST /leaves/notifications/read
export const markNotificationsRead = route(async (req, res) => {
  res.json({
    success: true,
    data: await notifications.markRead(getHotelId(req), req.body),
  });
});

// GET /leaves/:id
export const getLeave = route(async (req, res) => {
  res.json({
    success: true,
    data: await service.getLeave(getHotelId(req), req.params.id),
  });
});

// POST /leaves
export const applyLeave = route(async (req, res) => {
  const data = await service.applyLeave(
    getHotelId(req),
    req.body,
    actorOf(req),
  );
  res.status(201).json({ success: true, data, message: "Leave applied" });
});

// POST /leaves/:id/approve
export const approveLeave = route(async (req, res) => {
  const data = await service.approveLeave(
    getHotelId(req),
    req.params.id,
    req.body,
    actorOf(req),
  );
  res.json({ success: true, data, message: "Leave approved" });
});

// POST /leaves/:id/reject
export const rejectLeave = route(async (req, res) => {
  const data = await service.rejectLeave(
    getHotelId(req),
    req.params.id,
    req.body,
    actorOf(req),
  );
  res.json({ success: true, data, message: "Leave rejected" });
});

// POST /leaves/:id/cancel
export const cancelLeave = route(async (req, res) => {
  const data = await service.cancelLeave(
    getHotelId(req),
    req.params.id,
    req.body,
    actorOf(req),
  );
  res.json({ success: true, data, message: "Leave cancelled" });
});
