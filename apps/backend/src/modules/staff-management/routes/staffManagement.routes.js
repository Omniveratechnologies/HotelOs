import { Router } from "express";
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
import { uploadPhotoFile, uploadPhotoToR2 } from "../middleware/uploadPhoto.js";
import { validate } from "#/shared/middleware/validate.middleware.js";
import {
  createStaffBodySchema,
  updateStaffBodySchema,
  listStaffQuerySchema,
  exportCsvQuerySchema,
  createShiftBodySchema,
  updateShiftBodySchema,
  createDepartmentBodySchema,
  updateDepartmentBodySchema,
  createDesignationBodySchema,
  updateDesignationBodySchema,
  registerStaffFaceBodySchema,
  staffIdParamsSchema,
  shiftIdParamsSchema,
  departmentIdParamsSchema,
  designationIdParamsSchema,
  importJobIdParamsSchema,
} from "../schemas.js";

const staffManagementRoutes = Router();

staffManagementRoutes.get("/stats", stats);
staffManagementRoutes.get("/next-code", nextCode);
staffManagementRoutes.get(
  "/export",
  validate({ query: exportCsvQuerySchema }),
  exportCsv,
);

// Designations page
staffManagementRoutes.get("/designations", listDesignations);
staffManagementRoutes.get("/designations/stats", designationStats);
staffManagementRoutes.post(
  "/designations",
  validate({ body: createDesignationBodySchema }),
  createDesignation,
);
staffManagementRoutes.get(
  "/designations/:id",
  validate({ params: designationIdParamsSchema }),
  getDesignation,
);
staffManagementRoutes.put(
  "/designations/:id",
  validate({
    params: designationIdParamsSchema,
    body: updateDesignationBodySchema,
  }),
  updateDesignation,
);
staffManagementRoutes.delete(
  "/designations/:id",
  validate({ params: designationIdParamsSchema }),
  deleteDesignation,
);

// Departments page
staffManagementRoutes.get("/departments", listDepartments);
staffManagementRoutes.get("/departments/stats", departmentStats);
staffManagementRoutes.post(
  "/departments",
  validate({ body: createDepartmentBodySchema }),
  createDepartment,
);
staffManagementRoutes.get(
  "/departments/:id",
  validate({ params: departmentIdParamsSchema }),
  getDepartment,
);
staffManagementRoutes.put(
  "/departments/:id",
  validate({
    params: departmentIdParamsSchema,
    body: updateDepartmentBodySchema,
  }),
  updateDepartment,
);
staffManagementRoutes.delete(
  "/departments/:id",
  validate({ params: departmentIdParamsSchema }),
  deleteDepartment,
);
staffManagementRoutes.get(
  "/departments/:id/summary",
  validate({ params: departmentIdParamsSchema }),
  departmentSummary,
);
staffManagementRoutes.get(
  "/departments/:id/designations",
  validate({ params: departmentIdParamsSchema }),
  departmentDesignations,
);

// Import
staffManagementRoutes.get("/import/template", downloadImportTemplate);
staffManagementRoutes.post("/import", uploadImportFile, importStaff);
staffManagementRoutes.get(
  "/import/:jobId",
  validate({ params: importJobIdParamsSchema }),
  getImportJob,
);
staffManagementRoutes.get(
  "/import/:jobId/errors",
  validate({ params: importJobIdParamsSchema }),
  downloadImportErrors,
);

// Shifts
staffManagementRoutes.get("/shifts", listShifts);
staffManagementRoutes.post(
  "/shifts",
  validate({ body: createShiftBodySchema }),
  createShift,
);
staffManagementRoutes.put(
  "/shifts/:id",
  validate({ params: shiftIdParamsSchema, body: updateShiftBodySchema }),
  updateShift,
);
staffManagementRoutes.delete(
  "/shifts/:id",
  validate({ params: shiftIdParamsSchema }),
  deactivateShift,
);

// Staff list / create
staffManagementRoutes.get(
  "/",
  validate({ query: listStaffQuerySchema }),
  listStaff,
);
staffManagementRoutes.post(
  "/",
  validate({ body: createStaffBodySchema }),
  createStaff,
);

// One staff member: photo and face
staffManagementRoutes.post(
  "/:id/photo",
  uploadPhotoFile,
  uploadPhotoToR2,
  uploadPhoto,
);
staffManagementRoutes.delete(
  "/:id/photo",
  validate({ params: staffIdParamsSchema }),
  removePhoto,
);
staffManagementRoutes.post(
  "/:id/face",
  validate({ params: staffIdParamsSchema, body: registerStaffFaceBodySchema }),
  registerStaffFace,
);
staffManagementRoutes.get(
  "/:id/face",
  validate({ params: staffIdParamsSchema }),
  getStaffFaceStatus,
);

// One staff member
staffManagementRoutes.get(
  "/:id",
  validate({ params: staffIdParamsSchema }),
  getStaff,
);
staffManagementRoutes.put(
  "/:id",
  validate({ params: staffIdParamsSchema, body: updateStaffBodySchema }),
  updateStaff,
);
staffManagementRoutes.delete(
  "/:id",
  validate({ params: staffIdParamsSchema }),
  archiveStaff,
);

export default staffManagementRoutes;
