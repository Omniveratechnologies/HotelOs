import { getHotelId, route } from "../../../utils/http.js";
import * as service from "../services/face.service.js";
import { config } from "../services/faceRules.js";

const actorOf = (req) => ({
  userId: req.user?._id || req.user?.id || null,
  name: req.user?.name || req.user?.fullName || "",
});

export const requireFaceAdmin = (req, res, next) => {
  if (!req.user) {
    if (config.strictAuth)
      return res
        .status(401)
        .json({ success: false, message: "Please sign in." });
    return next();
  }
  const role = String(req.user.role || req.user.roleName || "").toLowerCase();
  if (!config.adminRoles.includes(role))
    return res
      .status(403)
      .json({
        success: false,
        message: "You don't have permission to manage face data.",
      });
  return next();
};

// GET /faces/summary
export const summary = route(async (req, res) => {
  res.json({ success: true, data: await service.summary(getHotelId(req)) });
});

// GET /faces/filters
export const filters = route(async (req, res) => {
  res.json({ success: true, data: await service.filters(getHotelId(req)) });
});

// GET /faces/staff?search=&department_id=&face_status=&sort=&direction=&page=&limit=
export const listStaff = route(async (req, res) => {
  const { rows, pagination } = await service.listStaff(
    getHotelId(req),
    req.query,
  );
  res.json({ success: true, data: rows, pagination });
});

// GET /faces/staff-options?q=&only=unregistered&limit=
export const staffOptions = route(async (req, res) => {
  res.json({
    success: true,
    data: await service.staffOptions(getHotelId(req), req.query),
  });
});

// POST /faces/check   (multipart: image)
export const checkPhoto = route(async (req, res) => {
  res.json({
    success: true,
    data: await service.checkPhoto(getHotelId(req), req.file),
  });
});

// POST /faces/enroll
export const enroll = route(async (req, res) => {
  const data = await service.enroll(
    getHotelId(req),
    req.body,
    req.files,
    actorOf(req),
  );
  res
    .status(data.updated ? 200 : 201)
    .json({
      success: true,
      message: data.updated ? "Face updated." : "Face registered.",
      data,
    });
});

// GET /faces/sync?cursor=&limit=
export const kioskSync = route(async (req, res) => {
  const header = req.get("authorization") || "";
  const token = req.get("x-device-token") || header.replace(/^Bearer\s+/i, "");
  res.json({ success: true, data: await service.kioskSync(token, req.query) });
});

// GET /faces/:staffId
export const getFace = route(async (req, res) => {
  res.json({
    success: true,
    data: await service.getFace(getHotelId(req), req.params.staffId),
  });
});

// GET /faces/:staffId/samples/:sampleId/image
export const sampleImage = route(async (req, res) => {
  const { buffer, mimeType } = await service.readSampleImage(
    getHotelId(req),
    req.params.staffId,
    req.params.sampleId,
    actorOf(req),
  );
  res.setHeader("Content-Type", mimeType);
  res.setHeader("Cache-Control", "private, no-store");
  res.send(buffer);
});

// DELETE /faces/:staffId
export const removeFace = route(async (req, res) => {
  const data = await service.removeFace(
    getHotelId(req),
    req.params.staffId,
    req.body,
    actorOf(req),
  );
  res.json({ success: true, message: "Face data deleted.", data });
});
