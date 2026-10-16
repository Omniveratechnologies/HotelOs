import QRCode from "qrcode";
import Table from "../models/Table.js";
import { tableDTO } from "../dto/table.dto.js";
import logger from "#/utils/logger.js";

export const createTable = async (req, res) => {
  try {
    const { tableNumber, seats, section, status } = req.body;
    if (!tableNumber || !seats) {
      return res
        .status(400)
        .json({
          success: false,
          message: "tableNumber and seats are required",
        });
    }

    const table = await Table.create({
      tableNumber,
      seats,
      section,
      status,
      hotelId: req.user.hotelId,
    });

    return res.status(201).json({
      success: true,
      message: "Table created successfully",
      data: tableDTO(table),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ success: false, message: "Table number already exists" });
    }
    logger.error(error, "Create table error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to create table" });
  }
};

export const getTables = async (req, res) => {
  try {
    const tables = await Table.find({ hotelId: req.user.hotelId }).sort({
      tableNumber: 1,
    });
    return res.status(200).json({ success: true, data: tables.map(tableDTO) });
  } catch (error) {
    logger.error(error, "Get tables error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch tables" });
  }
};

export const updateTable = async (req, res) => {
  try {
    const table = await Table.findOneAndUpdate(
      { _id: req.params.id, hotelId: req.user.hotelId },
      req.body,
      { new: true },
    );
    if (!table)
      return res
        .status(404)
        .json({ success: false, message: "Table not found" });
    return res.status(200).json({ success: true, data: tableDTO(table) });
  } catch (error) {
    logger.error(error, "Update table error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to update table" });
  }
};

export const deleteTable = async (req, res) => {
  try {
    const table = await Table.findOneAndDelete({
      _id: req.params.id,
      hotelId: req.user.hotelId,
    });
    if (!table)
      return res
        .status(404)
        .json({ success: false, message: "Table not found" });
    return res.status(200).json({ success: true, message: "Table deleted" });
  } catch (error) {
    logger.error(error, "Delete table error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to delete table" });
  }
};

// Returns the QR as a downloadable PNG image
export const getTableQr = async (req, res) => {
  try {
    const table = await Table.findOne({
      _id: req.params.id,
      hotelId: req.user.hotelId,
    });
    if (!table)
      return res
        .status(404)
        .json({ success: false, message: "Table not found" });

    const url = tableDTO(table).qrUrl;
    const pngBuffer = await QRCode.toBuffer(url, { width: 500 });

    res.setHeader("Content-Type", "image/png");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="table-${table.tableNumber}-qr.png"`,
    );
    return res.send(pngBuffer);
  } catch (error) {
    logger.error(error, "Generate QR error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to generate QR code" });
  }
};

// PUBLIC — used by the guest-facing table-order app to resolve a scanned QR
export const getPublicTable = async (req, res) => {
  try {
    const { hotelId, tableId } = req.params;
    const table = await Table.findOne({ _id: tableId, hotelId });
    if (!table)
      return res
        .status(404)
        .json({ success: false, message: "Table not found" });
    return res.status(200).json({ success: true, data: tableDTO(table) });
  } catch (error) {
    logger.error(error, "Get public table error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch table" });
  }
};
