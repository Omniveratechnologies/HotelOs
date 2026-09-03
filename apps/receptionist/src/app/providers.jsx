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

// Initial mock data for service requests and food orders. In a real application, these would be fetched from the backend.
const initialServiceRequests = [
  {
    id: 1,
    room: "204",
    type: "Amenity request",
    detail: "1× Extra towels, 1× Extra pillows, 1× Toiletries kit",
    status: "requested",
    time: "09:15 AM",
    priority: "normal",
  },
  {
    id: 2,
    room: "204",
    type: "Housekeeping request",
    detail: "Request housekeeping",
    status: "requested",
    time: "09:22 AM",
    priority: "normal",
  },
  {
    id: 3,
    room: "204",
    type: "Call restaurant",
    detail: "Call restaurant",
    status: "requested",
    time: "09:30 AM",
    priority: "normal",
  },
  {
    id: 4,
    room: "106",
    type: "Maintenance",
    detail: "AC not cooling properly",
    status: "in-progress",
    time: "08:45 AM",
    priority: "high",
  },
  {
    id: 5,
    room: "205",
    type: "Amenity request",
    detail: "2× Bath robes, 1× Extra blanket",
    status: "completed",
    time: "07:30 AM",
    priority: "normal",
  },
];

// Initial mock data for food orders. In a real application, these would be fetched from the backend.
const initialFoodOrders = [
  {
    id: 1,
    room: "204",
    items: "1× Gulab Jamun",
    payment: "COD",
    status: "out-for-delivery",
    time: "09:10 AM",
    amount: 120,
  },
  {
    id: 2,
    room: "204",
    items: "1× Cold Coffee",
    payment: "COD",
    status: "delivered",
    time: "08:55 AM",
    amount: 180,
  },
  {
    id: 3,
    room: "106",
    items: "2× Paneer Butter Masala, 3× Roti",
    payment: "UPI",
    status: "preparing",
    time: "09:35 AM",
    amount: 640,
  },
  {
    id: 4,
    room: "205",
    items: "1× Masala Chai, 1× Samosa",
    payment: "Room Charge",
    status: "delivered",
    time: "08:20 AM",
    amount: 95,
  },
];

// Map a backend guest DTO onto the shape the UI expects
const normalizeGuest = (g) => ({
  id: g.id,
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

export function HotelOSProvider({ children }) {
  const [chatOpen, setChatOpen] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [roomsError, setRoomsError] = useState("");
  const [serviceRequests, setServiceRequests] = useState(
    initialServiceRequests,
  );
  const [foodOrders, setFoodOrders] = useState(initialFoodOrders);
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

  // Delete a guest (cascades to their login account and frees the room)
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

  const acknowledgeRequest = (id) => {
    setServiceRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "acknowledged" } : r)),
    );
  };

  const completeRequest = (id) => {
    setServiceRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "completed" } : r)),
    );
  };

  const updateOrderStatus = (id, status) => {
    setFoodOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status } : o)),
    );
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
      foodOrders,
      setFoodOrders,
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
      acknowledgeRequest,
      completeRequest,
      updateOrderStatus,
    }),
    // oxlint-disable-next-line react/memo-dependencies -- remaining deps are stable setters/callbacks (setState + useCallback) whose identities never change, so they are intentionally omitted
    [
      chatOpen,
      rooms,
      roomsLoading,
      roomsError,
      serviceRequests,
      foodOrders,
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
