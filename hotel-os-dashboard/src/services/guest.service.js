import { apiFetch } from "../utils/apiFetch.js";

export const getGuests = async (status) => {
  const query = status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : '';

  const result = await apiFetch(`/api/v1/guests${query}`, {
    method: "GET",
    auth: true,
  });

  return result.data || [];
};

export const getGuest = async (guestId) => {
  const result = await apiFetch(`/api/v1/guests/${guestId}`, {
    method: "GET",
    auth: true,
  });

  return result.data;
};

// data: { name, email, phone, address, idType, idNumber, roomId, checkIn, checkOut, status, docTypes[], files[] }
export const registerGuest = async (data) => {
  const form = new FormData();

  form.append("name", data.name);
  form.append("email", data.email);
  form.append("phone", data.phone || "");
  form.append("address", data.address || "");
  form.append("idType", data.idType || "Aadhaar");
  form.append("idNumber", data.idNumber || "");
  form.append("roomId", data.roomId);
  form.append("checkIn", data.checkIn || "");
  form.append("checkOut", data.checkOut);
  form.append("status", data.status);

  if (data.files?.length > 0) {
    for (const file of data.files) {
      form.append("documents", file);
    }
    form.append("docTypes", JSON.stringify(data.docTypes || []));
  }

  const result = await apiFetch("/api/v1/guests", {
    method: "POST",
    form,
    auth: true,
  });

  return result.data;
};

export const updateGuest = async (guestId, updates) => {
  const result = await apiFetch(`/api/v1/guests/${guestId}`, {
    method: "PATCH",
    auth: true,
    body: updates,
  });

  return result.data;
};

export const updateGuestCredentials = async (guestId, payload) => {
  const result = await apiFetch(`/api/v1/guests/${guestId}/credentials`, {
    method: "PATCH",
    auth: true,
    body: payload,
  });

  return result;
};

export const deleteGuestDocument = async (guestId, docId) => {
  const result = await apiFetch(`/api/v1/guests/${guestId}/documents/${docId}`, {
    method: "DELETE",
    auth: true,
  });

  return result;
};

export const deleteGuest = async (guestId) => {
  const result = await apiFetch(`/api/v1/guests/${guestId}`, {
    method: "DELETE",
    auth: true,
  });

  return result;
};
