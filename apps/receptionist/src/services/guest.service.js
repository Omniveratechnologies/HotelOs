import { api } from "@hotelos/api";

export const getGuests = async (status) => {
  const result = await api.get("/api/v1/guests", {
    auth: true,
    ...(status && status !== "all" ? { query: { status } } : {}),
  });

  return result.data || [];
};

export const getGuest = async (guestId) => {
  const result = await api.get(`/api/v1/guests/${guestId}`, { auth: true });

  return result.data;
};

// data: { name, email, phone, address, idType, idNumber, roomId, checkIn, checkOut, status, docTypes[], files[] }
export const registerGuest = async (data) => {
  const body = new FormData();

  body.append("name", data.name);
  body.append("email", data.email);
  body.append("phone", data.phone || "");
  body.append("address", data.address || "");
  body.append("idType", data.idType || "Aadhaar");
  body.append("idNumber", data.idNumber || "");
  body.append("roomId", data.roomId);
  body.append("checkIn", data.checkIn || "");
  body.append("checkOut", data.checkOut);
  body.append("status", data.status);

  if (data.files?.length > 0) {
    for (const file of data.files) {
      body.append("documents", file);
    }
    body.append("docTypes", JSON.stringify(data.docTypes || []));
  }

  const result = await api.post("/api/v1/guests", body, { auth: true });

  return result.data;
};

export const updateGuest = async (guestId, updates) => {
  const result = await api.patch(`/api/v1/guests/${guestId}`, updates, {
    auth: true,
  });

  return result.data;
};

export const updateGuestCredentials = async (guestId, payload) => {
  return api.patch(`/api/v1/guests/${guestId}/credentials`, payload, {
    auth: true,
  });
};

export const deleteGuestDocument = async (guestId, docId) => {
  return api.delete(`/api/v1/guests/${guestId}/documents/${docId}`, {
    auth: true,
  });
};

export const deleteGuest = async (guestId) => {
  return api.delete(`/api/v1/guests/${guestId}`, { auth: true });
};
