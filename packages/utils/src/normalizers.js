import {
  ORDER_STATUS_MAP,
  REQUEST_STATUS_MAP,
  REQUEST_TYPE_MAP,
} from "./constants.js";
import { formatTime } from "./formatters.js";

/**
 * Normalizes a raw backend room DTO into the consistent shape expected by the UI.
 *
 * @param {object|null} room - Raw room object from API
 * @returns {object|null} Normalized room entity
 */
export const normalizeRoom = (room) => {
  if (!room) return null;
  return {
    id: room.id || room._id,
    _id: room._id || room.id,
    roomNumber: room.roomNumber,
    floor: room.floor,
    type: room.type,
    status: room.status,
    rate: room.rate,
    guest: room.currentGuest || null,
    checkIn: room.checkIn ? String(room.checkIn).split("T")[0] : null,
    checkOut: room.checkOut ? String(room.checkOut).split("T")[0] : null,
    roomCode: room.roomCode || null,
    channelSyncStatus: room.channelSyncStatus || "completed",
    channelVerified: room.channelVerified !== false,
  };
};

/**
 * Normalizes a raw backend guest/booking DTO into the shape expected by the UI.
 *
 * @param {object|null} g - Raw guest object from API
 * @returns {object|null} Normalized guest entity
 */
export const normalizeGuest = (g) => {
  if (!g) return null;
  return {
    id: g.id || g._id,
    _id: g._id || g.id,
    guestId: g.guestId,
    name: g.name,
    email: g.email,
    phone: g.phone,
    address: g.address,
    idType: g.idType,
    idNumber: g.idNumber,
    room: g.room ? String(g.room.roomNumber || g.room) : "",
    roomId: g.roomId,
    checkIn: g.checkIn ? String(g.checkIn).split("T")[0] : null,
    checkOut: g.checkOut ? String(g.checkOut).split("T")[0] : null,
    nights: g.nights ?? null,
    status: g.status,
    documents: g.documents || [],
  };
};

/**
 * Normalizes a raw backend food order DTO into the shape expected by the UI.
 *
 * @param {object|null} order - Raw food order object from API
 * @returns {object|null} Normalized food order entity
 */
export const normalizeFoodOrder = (order) => {
  if (!order) return null;
  return {
    id: order.id || order._id,
    _id: order._id || order.id,
    room: order.roomNumber || null,
    items: (order.items || [])
      .map((i) => `${i.quantity}× ${i.name}`)
      .join(", "),
    rawItems: order.items || [],
    payment: order.paymentMethod,
    status:
      ORDER_STATUS_MAP[order.status] || String(order.status).toLowerCase(),
    time: formatTime(order.createdAt),
    amount: order.totalAmount,
    createdAt: order.createdAt,
  };
};

/**
 * Normalizes a raw backend service request DTO into the shape expected by the UI.
 *
 * @param {object|null} request - Raw service request object from API
 * @returns {object|null} Normalized service request entity
 */
export const normalizeRequest = (request) => {
  if (!request) return null;
  return {
    id: request.id || request._id,
    _id: request._id || request.id,
    room: request.roomNumber || null,
    type: REQUEST_TYPE_MAP[request.type] || request.type,
    rawType: request.type,
    detail: request.description || "",
    items: Array.isArray(request.items) ? request.items : [],
    status:
      REQUEST_STATUS_MAP[request.status] ||
      String(request.status).toLowerCase(),
    time: formatTime(request.createdAt),
    priority: request.priority || "normal",
    createdAt: request.createdAt,
  };
};

/**
 * Inserts or replaces an item in an array by matching `id` or `_id`.
 *
 * @param {Array<object>} [list=[]] - Source array
 * @param {object|null} item - Item to upsert
 * @returns {Array<object>} New array with the item inserted or updated
 */
export const upsert = (list = [], item) => {
  if (!item) return list;
  const index = list.findIndex(
    (entry) => entry.id === item.id || entry._id === item._id,
  );

  if (index === -1) return [item, ...list];

  const copy = [...list];
  copy[index] = item;
  return copy;
};
