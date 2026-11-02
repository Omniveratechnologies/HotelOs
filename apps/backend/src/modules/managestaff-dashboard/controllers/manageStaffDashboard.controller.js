import { getHotelId, route } from "../../../utils/http.js";
import * as service from "../services/manageStaffDashboard.service.js";

export const dashboard = route(async (req, res) => {
  res.json({
    success: true,
    data: await service.getDashboard(getHotelId(req), req.query),
  });
});