import React, { useEffect, useMemo, useState } from "react";

import { HotelOSContext } from "./hotelOSContext.js";

import {
  getRooms as fetchRoomsApi,
  createRoom as createRoomApi,
  updateRoom as updateRoomApi,
  deleteRoom as deleteRoomApi,
} from "../services/room.service.js";
import {
  getGuests as fetchGuestsApi,
  registerGuest as registerGuestApi,
  deleteGuest as deleteGuestApi,
} from "../services/guest.service.js";
import { getDashboardStats as fetchStatsApi } from "../services/dashboard.service.js";
import {
  getStaffOrders as fetchOrdersApi,
  createDeskOrder as createDeskOrderApi,
  updateOrderStatusApi,
  getFoodItems as fetchFoodItemsApi,
} from "../services/order.service.js";
import {
  getStaffRequests as fetchRequestsApi,
  createDeskRequest as createDeskRequestApi,
  updateRequestStatusApi,
} from "../services/serviceRequest.service.js";
import { subscribeRealtime } from "../services/realtime.service.js";

// Map a backend room DTO onto the shape the UI expects
const normalizeRoom = (room) => ({
  id: room.id,
  roomNumber: room.roomNumber,
  floor: room.floor,
  type: room.type,
  status: room.status,
  rate: room.rate,
  guest: room.currentGuest || null,
  checkIn: room.checkIn ? String(room.checkIn).split("T")[0] : null,
  checkOut: room.checkOut ? String(room.checkOut).split("T")[0] : null,
});

// Map a backend guest DTO onto the shape the UI expects
const normalizeGuest = (g) => ({
  id: g.id,
  guestId: g.guestId,
  name: g.name,
  email: g.email,
  phone: g.phone,
  address: g.address,
  idType: g.idType,
  idNumber: g.idNumber,
  room: g.room ? String(g.room.roomNumber) : "",
  roomId: g.roomId,
  checkIn: g.checkIn ? String(g.checkIn).split("T")[0] : null,
  checkOut: g.checkOut ? String(g.checkOut).split("T")[0] : null,
  nights: g.nights ?? null,
  status: g.status,
  documents: g.documents || [],
});

const ORDER_STATUS_MAP = {
  NEW: "new",
  PREPARING: "preparing",
  READY: "ready",
  OUT_FOR_DELIVERY: "out-for-delivery",
  DELIVERED: "delivered",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
};

const UI_TO_ORDER_STATUS = {
  new: "NEW",
  preparing: "PREPARING",
  ready: "READY",
  "out-for-delivery": "OUT_FOR_DELIVERY",
  delivered: "DELIVERED",
  rejected: "REJECTED",
  cancelled: "CANCELLED",
};

const REQUEST_STATUS_MAP = {
  REQUESTED: "requested",
  ACKNOWLEDGED: "acknowledged",
  IN_PROGRESS: "in-progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

const REQUEST_TYPE_MAP = {
  AMENITY: "Amenity request",
  HOUSEKEEPING: "Housekeeping request",
  RESTAURANT: "Call restaurant",
  RECEPTION: "Reception request",
  MAINTENANCE: "Maintenance",
};

const formatTime = (value) => {
  if (!value) return "";

  return new Date(value).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Backend staff order DTO -> the shape the receptionist UI already expects
const normalizeFoodOrder = (order) => ({
  id: order.id,
  room: order.roomNumber || null,
  items: (order.items || []).map((i) => `${i.quantity}× ${i.name}`).join(", "),
  payment: order.paymentMethod,
  status: ORDER_STATUS_MAP[order.status] || String(order.status).toLowerCase(),
  time: formatTime(order.createdAt),
  amount: order.totalAmount,
});

// Backend staff service-request DTO -> the shape the UI already expects
const normalizeRequest = (request) => ({
  id: request.id,
  room: request.roomNumber || null,
  type: REQUEST_TYPE_MAP[request.type] || request.type,
  detail: request.description || "",
  items: Array.isArray(request.items) ? request.items : [],
  status:
    REQUEST_STATUS_MAP[request.status] || String(request.status).toLowerCase(),
  time: formatTime(request.createdAt),
  priority: request.priority || "normal",
});

const upsert = (list, item) => {
  const index = list.findIndex((entry) => entry.id === item.id);

  if (index === -1) return [item, ...list];

  const copy = [...list];
  copy[index] = item;
  return copy;
};

export function HotelOSProvider({ children }) {
  const [chatOpen, setChatOpen] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [roomsError, setRoomsError] = useState("");
  const [serviceRequests, setServiceRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestsError, setRequestsError] = useState("");
  const [foodOrders, setFoodOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState("");
  const [foodItems, setFoodItems] = useState([]);
  const [foodItemsLoading, setFoodItemsLoading] = useState(true);
  const [guests, setGuests] = useState([]);
  const [guestsLoading, setGuestsLoading] = useState(true);
  const [guestsError, setGuestsError] = useState("");
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await fetchRoomsApi();
        if (!cancelled) {
          setRooms(data.map(normalizeRoom));
          setRoomsError("");
        }
      } catch (err) {
        console.error("Failed to load rooms:", err);
        if (!cancelled) setRoomsError(err.message || "Failed to load rooms");
      } finally {
        if (!cancelled) setRoomsLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await fetchGuestsApi();
        if (!cancelled) {
          setGuests(data.map(normalizeGuest));
          setGuestsError("");
        }
      } catch (err) {
        console.error("Failed to load guests:", err);
        if (!cancelled) setGuestsError(err.message || "Failed to load guests");
      } finally {
        if (!cancelled) setGuestsLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await fetchStatsApi();
        if (!cancelled) {
          setStats(data);
          setStatsError("");
        }
      } catch (err) {
        console.error("Failed to load dashboard stats:", err);
        if (!cancelled)
          setStatsError(err.message || "Failed to load dashboard stats");
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  // Live food orders for the hotel (also on the kitchen board)
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await fetchOrdersApi();
        if (!cancelled) {
          setFoodOrders(data.map(normalizeFoodOrder));
          setOrdersError("");
        }
      } catch (err) {
        console.error("Failed to load food orders:", err);
        if (!cancelled)
          setOrdersError(err.message || "Failed to load food orders");
      } finally {
        if (!cancelled) setOrdersLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  // Live service requests for the hotel
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await fetchRequestsApi();
        if (!cancelled) {
          setServiceRequests(data.map(normalizeRequest));
          setRequestsError("");
        }
      } catch (err) {
        console.error("Failed to load service requests:", err);
        if (!cancelled)
          setRequestsError(err.message || "Failed to load service requests");
      } finally {
        if (!cancelled) setRequestsLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  // Food items for the new-order menu
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await fetchFoodItemsApi();
        if (!cancelled) {
          setFoodItems(data);
          setFoodItemsLoading(false);
        }
      } catch (err) {
        console.error("Failed to load food items:", err);
        if (!cancelled) setFoodItemsLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  // Realtime: merge order / service-request events broadcast over Socket.IO.
  // Covers this tab, other receptionist tabs, guest-created activity, and
  // kitchen status changes. On (re)connect the full lists are refetched so no
  // events emitted while the socket was down are permanently missed.
  useEffect(() => {
    const refreshLiveLists = async () => {
      try {
        const [ordersData, requestsData] = await Promise.all([
          fetchOrdersApi(),
          fetchRequestsApi(),
        ]);
        setFoodOrders(ordersData.map(normalizeFoodOrder));
        setServiceRequests(requestsData.map(normalizeRequest));
      } catch (err) {
        console.error("Failed to refresh live lists:", err);
      }
    };

    const unsubscribe = subscribeRealtime({
      onConnect: refreshLiveLists,
      order: (data) => {
        setFoodOrders((prev) => upsert(prev, normalizeFoodOrder(data)));
      },
      serviceRequest: (data) => {
        setServiceRequests((prev) => upsert(prev, normalizeRequest(data)));
      },
    });

    return unsubscribe;
  }, []);

  const refreshStats = async () => {
    try {
      const data = await fetchStatsApi();
      setStats(data);
      setStatsError("");
    } catch (err) {
      console.error("Failed to refresh dashboard stats:", err);
    }
  };

  // Persist a status (and any occupancy display fields) to the backend
  const updateRoomStatus = async (roomId, newStatus, guestData = {}) => {
    const body = { status: newStatus };

    if ("guest" in guestData) body.currentGuest = guestData.guest || "";
    if ("checkIn" in guestData) body.checkIn = guestData.checkIn || null;
    if ("checkOut" in guestData) body.checkOut = guestData.checkOut || null;

    try {
      const updated = await updateRoomApi(roomId, body);
      setRooms((prev) =>
        prev.map((r) => (r.id === roomId ? normalizeRoom(updated) : r)),
      );
    } catch (err) {
      console.error("Failed to update room:", err);
      throw err;
    }
  };

  const addRoom = async ({ roomNumber, type, rate, floor }) => {
    const created = await createRoomApi({ roomNumber, type, rate, floor });
    setRooms((prev) => [...prev, normalizeRoom(created)]);
    return normalizeRoom(created);
  };

  const removeRoom = async (roomId) => {
    await deleteRoomApi(roomId);
    setRooms((prev) => prev.filter((r) => r.id !== roomId));
  };

  // Re-fetch rooms + guests from the backend
  const refreshData = async () => {
    try {
      const [roomsData, guestsData] = await Promise.all([
        fetchRoomsApi(),
        fetchGuestsApi(),
      ]);
      setRooms(roomsData.map(normalizeRoom));
      setGuests(guestsData.map(normalizeGuest));
    } catch (err) {
      console.error("Failed to refresh data:", err);
    }
  };

  // Register a real guest (creates login account, uploads documents, occupies room)
  const addGuest = async (data) => {
    const created = await registerGuestApi(data);

    const normalized = normalizeGuest(created);

    setGuests((prev) => [normalized, ...prev]);

    // Room status/dates changed server-side - keep local state in sync
    try {
      const roomsData = await fetchRoomsApi();
      setRooms(roomsData.map(normalizeRoom));
    } catch {
      // Non-fatal; next full load will sync
    }

    return created;
  };

  // Delete a stay (booking) — cascades to the stay's own guest account
  const removeGuest = async (guestId) => {
    await deleteGuestApi(guestId);
    setGuests((prev) => prev.filter((g) => g.id !== guestId));
    try {
      const roomsData = await fetchRoomsApi();
      setRooms(roomsData.map(normalizeRoom));
    } catch {
      // Non-fatal
    }
  };

  // Food order actions (idempotent — the socket event confirms/merges too)
  const updateOrderStatus = async (id, status) => {
    try {
      const updated = await updateOrderStatusApi(
        id,
        UI_TO_ORDER_STATUS[status] || status,
      );
      setFoodOrders((prev) => upsert(prev, normalizeFoodOrder(updated)));
    } catch (err) {
      console.error("Failed to update order status:", err);
      throw err;
    }
  };

  const addOrder = async ({ roomId, items }) => {
    const created = await createDeskOrderApi({ roomId, items });
    setFoodOrders((prev) => upsert(prev, normalizeFoodOrder(created)));
    return created;
  };

  // Service request actions
  const acknowledgeRequest = async (id) => {
    try {
      const updated = await updateRequestStatusApi(id, "ACKNOWLEDGED");
      setServiceRequests((prev) => upsert(prev, normalizeRequest(updated)));
    } catch (err) {
      console.error("Failed to acknowledge request:", err);
      throw err;
    }
  };

  const completeRequest = async (id) => {
    try {
      const updated = await updateRequestStatusApi(id, "COMPLETED");
      setServiceRequests((prev) => upsert(prev, normalizeRequest(updated)));
    } catch (err) {
      console.error("Failed to complete request:", err);
      throw err;
    }
  };

  const addRequest = async ({ roomId, type, description, priority }) => {
    const created = await createDeskRequestApi({
      roomId,
      type,
      description,
      priority: priority || "normal",
    });
    setServiceRequests((prev) => upsert(prev, normalizeRequest(created)));
    return created;
  };

  const contextValue = useMemo(
    () => ({
      chatOpen,
      setChatOpen,
      rooms,
      setRooms,
      roomsLoading,
      roomsError,
      serviceRequests,
      setServiceRequests,
      requestsLoading,
      requestsError,
      foodOrders,
      setFoodOrders,
      ordersLoading,
      ordersError,
      foodItems,
      foodItemsLoading,
      guests,
      setGuests,
      guestsLoading,
      guestsError,
      stats,
      setStats,
      statsLoading,
      statsError,
      refreshStats,
      updateRoomStatus,
      addRoom,
      removeRoom,
      addGuest,
      removeGuest,
      refreshData,
      updateOrderStatus,
      addOrder,
      acknowledgeRequest,
      completeRequest,
      addRequest,
    }),
    // oxlint-disable-next-line react/memo-dependencies -- remaining deps are stable setters/callbacks (setState + function declarations) whose identities never change, so they are intentionally omitted
    [
      chatOpen,
      rooms,
      roomsLoading,
      roomsError,
      serviceRequests,
      requestsLoading,
      requestsError,
      foodOrders,
      ordersLoading,
      ordersError,
      foodItems,
      foodItemsLoading,
      guests,
      guestsLoading,
      guestsError,
      stats,
      statsLoading,
      statsError,
    ],
  );

  return (
    <HotelOSContext.Provider value={contextValue}>
      {children}
    </HotelOSContext.Provider>
  );
}
