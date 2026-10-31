import { Router } from "express";
import multer from "multer";
import {
  listStaff,
  stats,
  getStaff,
  createStaff,
  updateStaff,
  archiveStaff,
  exportCsv,
  nextCode,
  uploadPhoto,
  removePhoto,
  listShifts,
  createShift,
  updateShift,
  deactivateShift,
  registerStaffFace,
  getStaffFaceStatus,
  importStaff,
  getImportJob,
  downloadImportErrors,
  downloadImportTemplate,
  listDepartments,
  departmentStats,
  createDepartment,
  getDepartment,
  updateDepartment,
  departmentSummary,
  departmentDesignations,
  deleteDepartment,
  listDesignations,
  designationStats,
  getDesignation,
  createDesignation,
  updateDesignation,
  deleteDesignation,
} from "../controllers/staffManagement.controller.js";
import { uploadImportFile } from "../middleware/uploadImport.js";

const staffManagementRoutes = Router();

// Staff photo upload (kept in memory, then sent to Cloudflare R2 by the controller)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

staffManagementRoutes.get("/stats", stats);
staffManagementRoutes.get("/next-code", nextCode);
staffManagementRoutes.get("/export", exportCsv);

// Designations page ("/designations/stats" before "/designations/:id")
staffManagementRoutes.get("/designations", listDesignations);
staffManagementRoutes.get("/designations/stats", designationStats);
staffManagementRoutes.post("/designations", createDesignation);
staffManagementRoutes.get("/designations/:id", getDesignation);
staffManagementRoutes.put("/designations/:id", updateDesignation);
staffManagementRoutes.delete("/designations/:id", deleteDesignation);

// Departments page
staffManagementRoutes.get("/departments", listDepartments);
staffManagementRoutes.get("/departments/stats", departmentStats);
staffManagementRoutes.post("/departments", createDepartment);
staffManagementRoutes.get("/departments/:id", getDepartment);
staffManagementRoutes.put("/departments/:id", updateDepartment);
staffManagementRoutes.delete("/departments/:id", deleteDepartment);
staffManagementRoutes.get("/departments/:id/summary", departmentSummary);
staffManagementRoutes.get(
  "/departments/:id/designations",
  departmentDesignations,
);

// Import ("template" before ":jobId")
staffManagementRoutes.get("/import/template", downloadImportTemplate);
staffManagementRoutes.post("/import", uploadImportFile, importStaff);
staffManagementRoutes.get("/import/:jobId", getImportJob);
staffManagementRoutes.get("/import/:jobId/errors", downloadImportErrors);

// Shifts
staffManagementRoutes.get("/shifts", listShifts);
staffManagementRoutes.post("/shifts", createShift);
staffManagementRoutes.put("/shifts/:id", updateShift);
staffManagementRoutes.delete("/shifts/:id", deactivateShift);

// Staff list / create
staffManagementRoutes.get("/", listStaff);
staffManagementRoutes.post("/", createStaff);

// One staff member: photo and face
staffManagementRoutes.post("/:id/photo", upload.single("photo"), uploadPhoto);
staffManagementRoutes.delete("/:id/photo", removePhoto);
staffManagementRoutes.post("/:id/face", registerStaffFace);
staffManagementRoutes.get("/:id/face", getStaffFaceStatus);

// One staff member: details (LAST, because it matches any single word)
staffManagementRoutes.get("/:id", getStaff);
staffManagementRoutes.put("/:id", updateStaff);
staffManagementRoutes.delete("/:id", archiveStaff);

export default staffManagementRoutes;
