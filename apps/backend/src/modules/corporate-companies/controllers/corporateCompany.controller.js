import CorporateCompany from "../models/CorporateCompany.js";
import logger from "#/utils/logger.js";

// =====================================================
// LIST CORPORATE COMPANIES
// =====================================================
export const getCorporateCompanies = async (req, res) => {
  try {
    const { status, q, page = 1, limit = 50 } = req.query;
    const filter = { hotelId: req.user.hotelId };

    if (status && ["ACTIVE", "INACTIVE"].includes(status)) {
      filter.status = status;
    }

    if (q?.trim()) {
      const rx = new RegExp(
        q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i",
      );
      filter.$or = [
        { name: rx },
        { code: rx },
        { contactPerson: rx },
        { email: rx },
        { phone: rx },
      ];
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 50));

    const [companies, total] = await Promise.all([
      CorporateCompany.find(filter)
        .sort({ name: 1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      CorporateCompany.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Corporate companies fetched",
      data: {
        companies,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum) || 1,
        },
      },
    });
  } catch (error) {
    logger.error(error, "Get Corporate Companies Error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch corporate companies" });
  }
};

// =====================================================
// GET SINGLE CORPORATE COMPANY
// =====================================================
export const getCorporateCompany = async (req, res) => {
  try {
    const company = await CorporateCompany.findOne({
      _id: req.params.id,
      hotelId: req.user.hotelId,
    }).lean();

    if (!company) {
      return res
        .status(404)
        .json({ success: false, message: "Corporate company not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Corporate company fetched",
      data: company,
    });
  } catch (error) {
    logger.error(error, "Get Corporate Company Error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch corporate company" });
  }
};

// =====================================================
// CREATE CORPORATE COMPANY
// =====================================================
export const createCorporateCompany = async (req, res) => {
  try {
    const {
      name,
      code,
      contactPerson,
      phone,
      phonePrefix,
      email,
      address,
      gstNumber,
      billingType,
      creditLimit,
      paymentTerms,
      costCenter,
      tier,
      creditFacility,
      status,
    } = req.body;

    if (!name?.trim() || !contactPerson?.trim() || !phone?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name, contact person, and phone are required",
      });
    }

    const existing = await CorporateCompany.findOne({
      hotelId: req.user.hotelId,
      name: name.trim(),
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "A company with this name already exists for this hotel",
      });
    }

    const company = await CorporateCompany.create({
      hotelId: req.user.hotelId,
      name: name.trim(),
      code: code?.trim() || undefined,
      contactPerson: contactPerson.trim(),
      phone: phone.trim(),
      phonePrefix: phonePrefix || "+91",
      email: email?.trim().toLowerCase() || undefined,
      address: address?.trim() || undefined,
      gstNumber: gstNumber?.trim().toUpperCase() || undefined,
      billingType: billingType || "Corporate Account",
      creditLimit: Number(creditLimit) || 0,
      paymentTerms: paymentTerms || "30 DAYS",
      costCenter: costCenter?.trim() || undefined,
      tier: tier || "Standard",
      creditFacility: creditFacility || false,
      status: status || "ACTIVE",
    });

    return res.status(201).json({
      success: true,
      message: "Corporate company created",
      data: company,
    });
  } catch (error) {
    logger.error(error, "Create Corporate Company Error");
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Company code or name already exists",
      });
    }
    return res
      .status(500)
      .json({ success: false, message: "Failed to create corporate company" });
  }
};

// =====================================================
// UPDATE CORPORATE COMPANY
// =====================================================
export const updateCorporateCompany = async (req, res) => {
  try {
    const company = await CorporateCompany.findOne({
      _id: req.params.id,
      hotelId: req.user.hotelId,
    });

    if (!company) {
      return res
        .status(404)
        .json({ success: false, message: "Corporate company not found" });
    }

    const allowedFields = [
      "name",
      "code",
      "contactPerson",
      "phone",
      "phonePrefix",
      "email",
      "address",
      "gstNumber",
      "billingType",
      "creditLimit",
      "paymentTerms",
      "costCenter",
      "tier",
      "creditFacility",
      "status",
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        company[field] = req.body[field];
      }
    }

    if (req.body.name !== undefined) {
      const existing = await CorporateCompany.findOne({
        hotelId: req.user.hotelId,
        name: req.body.name.trim(),
        _id: { $ne: company._id },
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          message: "Another company with this name already exists",
        });
      }
    }

    await company.save();

    return res.status(200).json({
      success: true,
      message: "Corporate company updated",
      data: company,
    });
  } catch (error) {
    logger.error(error, "Update Corporate Company Error");
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Company code or name already exists",
      });
    }
    return res
      .status(500)
      .json({ success: false, message: "Failed to update corporate company" });
  }
};

// =====================================================
// DELETE CORPORATE COMPANY
// =====================================================
export const deleteCorporateCompany = async (req, res) => {
  try {
    const company = await CorporateCompany.findOneAndDelete({
      _id: req.params.id,
      hotelId: req.user.hotelId,
    });

    if (!company) {
      return res
        .status(404)
        .json({ success: false, message: "Corporate company not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Corporate company deleted",
    });
  } catch (error) {
    logger.error(error, "Delete Corporate Company Error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to delete corporate company" });
  }
};
