import Supplier from "../models/Supplier.js";
import PurchaseHistory from "../models/PurchaseHistory.js";

const getSuppliers = async ({
  search = "",
  status = "ALL",
  category = "ALL",
}) => {
  const query = {};

  if (search.trim()) {
    query.$or = [
      {
        supplierName: {
          $regex: search.trim(),
          $options: "i",
        },
      },
      {
        contactPerson: {
          $regex: search.trim(),
          $options: "i",
        },
      },
      {
        phone: {
          $regex: search.trim(),
          $options: "i",
        },
      },
      {
        email: {
          $regex: search.trim(),
          $options: "i",
        },
      },
    ];
  }

  if (status !== "ALL") {
    query.status = status;
  }

  if (category !== "ALL") {
    query.categories = category;
  }

  const suppliers = await Supplier.find(query).sort({
    createdAt: -1,
  });

  // Purchase value is calculated using supplierName
  // because PurchaseHistory already stores supplierName.
  const purchaseValues = await PurchaseHistory.aggregate([
    {
      $group: {
        _id: "$supplierName",
        totalPurchaseValue: {
          $sum: "$totalCost",
        },
      },
    },
  ]);

  const purchaseValueMap = new Map(
    purchaseValues.map((item) => [
      item._id,
      Number(item.totalPurchaseValue || 0),
    ]),
  );

  return suppliers.map((supplier) => ({
    ...supplier.toObject(),

    totalPurchaseValue: purchaseValueMap.get(supplier.supplierName) || 0,
  }));
};

const getSupplierById = async (supplierId) => {
  const supplier = await Supplier.findById(supplierId);

  if (!supplier) {
    throw new Error("Supplier not found");
  }

  const purchaseValue = await PurchaseHistory.aggregate([
    {
      $match: {
        supplierName: supplier.supplierName,
      },
    },
    {
      $group: {
        _id: null,
        totalPurchaseValue: {
          $sum: "$totalCost",
        },
      },
    },
  ]);

  return {
    ...supplier.toObject(),

    totalPurchaseValue: Number(purchaseValue[0]?.totalPurchaseValue || 0),
  };
};

const createSupplier = async (supplierData) => {
  const {
    supplierName,
    supplierCode,
    companyName,
    contactPerson,
    phone,
    email,
    address,
    addressLine2,
    city,
    state,
    pincode,
    gstNumber,
    paymentTerms,
    categories,
    status,
    notes,
  } = supplierData;

  if (!supplierName?.trim()) {
    throw new Error("Supplier name is required");
  }

  if (!contactPerson?.trim()) {
    throw new Error("Contact person is required");
  }

  if (!phone?.trim()) {
    throw new Error("Phone number is required");
  }

  if (!Array.isArray(categories) || categories.length === 0) {
    throw new Error("At least one supplier category is required");
  }

  const existingSupplier = await Supplier.findOne({
    supplierName: {
      $regex: `^${supplierName.trim()}$`,
      $options: "i",
    },
  });

  if (existingSupplier) {
    throw new Error("Supplier already exists");
  }

  if (supplierCode?.trim()) {
    const existingCode = await Supplier.findOne({
      supplierCode: supplierCode.trim(),
    });

    if (existingCode) {
      throw new Error("Supplier code already exists");
    }
  }

  if (gstNumber?.trim()) {
    const existingGST = await Supplier.findOne({
      gstNumber: gstNumber.trim().toUpperCase(),
    });

    if (existingGST) {
      throw new Error("GST number already exists");
    }
  }

  const supplier = await Supplier.create({
    supplierName: supplierName.trim(),
    supplierCode: supplierCode?.trim() || undefined,
    companyName: companyName?.trim() || undefined,
    contactPerson: contactPerson.trim(),
    phone: phone.trim(),
    email: email?.trim() || undefined,
    address: address?.trim() || undefined,
    addressLine2: addressLine2?.trim() || undefined,
    city: city?.trim() || undefined,
    state: state?.trim() || undefined,
    pincode: pincode?.trim() || undefined,
    gstNumber: gstNumber?.trim().toUpperCase() || undefined,
    paymentTerms: paymentTerms || "CASH",
    categories,
    status: status || "ACTIVE",
    notes: notes?.trim() || undefined,
  });

  return supplier;
};

const updateSupplier = async (supplierId, supplierData) => {
  const supplier = await Supplier.findById(supplierId);

  if (!supplier) {
    throw new Error("Supplier not found");
  }

  if (
    supplierData.categories &&
    (!Array.isArray(supplierData.categories) ||
      supplierData.categories.length === 0)
  ) {
    throw new Error("At least one supplier category is required");
  }

  if (supplierData.gstNumber) {
    supplierData.gstNumber = supplierData.gstNumber.trim().toUpperCase();
  }

  const updatedSupplier = await Supplier.findByIdAndUpdate(
    supplierId,
    {
      $set: supplierData,
    },
    {
      new: true,
      runValidators: true,
    },
  );

  return updatedSupplier;
};

const updateSupplierStatus = async (supplierId, status) => {
  if (!["ACTIVE", "INACTIVE"].includes(status)) {
    throw new Error("Invalid supplier status");
  }

  const supplier = await Supplier.findByIdAndUpdate(
    supplierId,
    {
      $set: {
        status,
      },
    },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!supplier) {
    throw new Error("Supplier not found");
  }

  return supplier;
};

const deleteSupplier = async (supplierId) => {
  const supplier = await Supplier.findById(supplierId);

  if (!supplier) {
    throw new Error("Supplier not found");
  }

  // PurchaseHistory stores supplierName, not supplier ObjectId.
  const purchaseExists = await PurchaseHistory.exists({
    supplierName: supplier.supplierName,
  });

  if (purchaseExists) {
    throw new Error(
      "Supplier cannot be deleted because purchase history exists",
    );
  }

  await Supplier.findByIdAndDelete(supplierId);

  return {
    message: "Supplier deleted successfully",
  };
};

const getSupplierSummary = async () => {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [totalSuppliers, activeSuppliers, inactiveSuppliers, purchaseSummary] =
    await Promise.all([
      Supplier.countDocuments(),

      Supplier.countDocuments({
        status: "ACTIVE",
      }),

      Supplier.countDocuments({
        status: "INACTIVE",
      }),

      PurchaseHistory.aggregate([
        {
          $match: {
            purchaseDate: {
              $gte: startOfMonth,
            },
          },
        },
        {
          $group: {
            _id: null,
            totalPurchaseValue: {
              $sum: "$totalCost",
            },
          },
        },
      ]),
    ]);

  return {
    totalSuppliers,
    activeSuppliers,
    inactiveSuppliers,
    totalPurchaseValue: Number(purchaseSummary[0]?.totalPurchaseValue || 0),
  };
};

export default {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  updateSupplierStatus,
  deleteSupplier,
  getSupplierSummary,
};
