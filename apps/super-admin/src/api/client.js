// ---------------------------------------------------------------------------
// API CLIENT
// ---------------------------------------------------------------------------
// Central API communication for the Super Admin Dashboard.
// ---------------------------------------------------------------------------

import {
  mockTransactions,
  mockServiceRequests,
} from "../data/mockData.js";

// ===========================================================================
// API BASE URL
// ===========================================================================

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5001";

// ===========================================================================
// GENERIC AUTHENTICATED FETCH
// ===========================================================================

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("auth_token");

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,

    headers: {
      "Content-Type": "application/json",

      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),

      ...(options.headers || {}),
    },
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
    }

    throw new Error(
      body.message || `Request failed: ${res.status}`
    );
  }

  return body;
}

// ===========================================================================
// AUTHENTICATION
// ===========================================================================

export async function loginAdmin(username, password) {
  const result = await apiFetch(
    "/api/v1/auth/login",
    {
      method: "POST",

      body: JSON.stringify({
        username,
        password,
      }),
    }
  );

  if (!result.success) {
    throw new Error(
      result.message || "Login failed"
    );
  }

  const { token, user } = result.data;

  if (user.role !== "SUPER_ADMIN") {
    throw new Error(
      "You are not authorized to access the Super Admin Dashboard"
    );
  }

  localStorage.setItem(
    "auth_token",
    token
  );

  localStorage.setItem(
    "auth_user",
    JSON.stringify(user)
  );

  return result.data;
}

// ===========================================================================
// LOGOUT
// ===========================================================================

export async function logoutAdmin() {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("auth_user");

  return {
    success: true,
  };
}

// ===========================================================================
// HOTELS
// ===========================================================================

// Get all hotels
export async function fetchHotels() {
  const result = await apiFetch(
    "/api/v1/hotels"
  );

  if (!result.success) {
    throw new Error(
      result.message ||
      "Failed to fetch hotels"
    );
  }

  return result.data;
}

// Get one hotel
export async function fetchHotelById(hotelId) {
  const result = await apiFetch(
    `/api/v1/hotels/${hotelId}`
  );

  if (!result.success) {
    throw new Error(
      result.message ||
      "Failed to fetch hotel"
    );
  }

  return result.data;
}

// Create hotel
export async function createHotel(hotelData) {
  const result = await apiFetch(
    "/api/v1/hotels",
    {
      method: "POST",

      body: JSON.stringify(
        hotelData
      ),
    }
  );

  if (!result.success) {
    throw new Error(
      result.message ||
      "Failed to create hotel"
    );
  }

  return result.data;
}

// Update hotel
export async function updateHotel(
  hotelId,
  hotelData
) {
  const result = await apiFetch(
    `/api/v1/hotels/${hotelId}`,
    {
      method: "PATCH",

      body: JSON.stringify(
        hotelData
      ),
    }
  );

  if (!result.success) {
    throw new Error(
      result.message ||
      "Failed to update hotel"
    );
  }

  return result.data;
}

// ===========================================================================
// HOTEL STATUS
// ===========================================================================

// Activate / deactivate hotel
export async function toggleHotelStatus(
  hotelId,
  nextStatus
) {
  const result = await apiFetch(
    `/api/v1/hotels/${hotelId}/status`,
    {
      method: "PATCH",

      body: JSON.stringify({
        status: nextStatus,
      }),
    }
  );

  if (!result.success) {
    throw new Error(
      result.message ||
      "Failed to update hotel status"
    );
  }

  return result.data;
}

// ===========================================================================
// HOTEL CREDENTIALS
// ===========================================================================

export async function updateHotelCredentials(
  hotelId,
  { email, password }
) {
  const result = await apiFetch(
    `/api/v1/hotels/${hotelId}/credentials`,
    {
      method: "PATCH",

      body: JSON.stringify({
        email,
        password,
      }),
    }
  );

  if (!result.success) {
    throw new Error(
      result.message ||
      "Failed to update hotel credentials"
    );
  }

  return result.data;
}

// ===========================================================================
// HOTEL INVITATION
// ===========================================================================

export async function inviteHotelAdmin(
  hotelId,
  email
) {
  const result = await apiFetch(
    `/api/v1/hotels/${hotelId}/invite`,
    {
      method: "POST",

      body: JSON.stringify({
        email,
      }),
    }
  );

  if (!result.success) {
    throw new Error(
      result.message ||
      "Failed to send invitation"
    );
  }

  return result.data;
}

// ===========================================================================
// DELETE HOTEL
// ===========================================================================

export async function deleteHotel(hotelId) {
  const result = await apiFetch(
    `/api/v1/hotels/${hotelId}`,
    {
      method: "DELETE",
    }
  );

  if (!result.success) {
    throw new Error(
      result.message ||
      "Failed to delete hotel"
    );
  }

  return result;
}

// ===========================================================================
// SUBSCRIPTIONS
// ===========================================================================

// Fetch all subscriptions.
//
// Currently derived from the hotel records because the backend subscription
// dates are stored directly on each hotel.
export async function fetchSubscriptions() {
  const hotels = await fetchHotels();

  return hotels.map((hotel) => ({
    _id: hotel._id,
    hotelId: hotel._id,
    hotelName: hotel.name,
    plan: hotel.plan || "Standard",
    startDate:
      hotel.subscriptionStartDate || null,
    endDate:
      hotel.subscriptionEndDate || null,
    status: hotel.status,
  }));
}

// Get one hotel's subscription
export async function fetchHotelSubscription(
  hotelId
) {
  const hotel = await fetchHotelById(
    hotelId
  );

  return {
    _id: hotel._id,
    hotelId: hotel._id,
    hotelName: hotel.name,
    plan: hotel.plan || "Standard",
    startDate:
      hotel.subscriptionStartDate || null,
    endDate:
      hotel.subscriptionEndDate || null,
    status: hotel.status,
  };
}

// Create / update hotel subscription
export async function saveSubscription(
  hotelId,
  { plan, startDate, endDate }
) {
  return updateHotel(
    hotelId,
    {
      plan,
      subscriptionStartDate: startDate,
      subscriptionEndDate: endDate,
    }
  );
}

// ===========================================================================
// TRANSACTIONS
// ===========================================================================
// Still using mock data.
// Do not connect to backend yet.
// ===========================================================================

export async function fetchTransactionSummary() {
  return [
    ...mockTransactions,
  ];
}

// ===========================================================================
// SERVICE REQUESTS
// ===========================================================================
// Still using mock data.
// Do not connect to backend yet.
// ===========================================================================

export async function fetchServiceRequests() {
  return [
    ...mockServiceRequests,
  ];
}

export async function updateServiceRequestStatus(
  requestId,
  status
) {
  const request =
    mockServiceRequests.find(
      (item) =>
        item.id === requestId
    );

  if (request) {
    request.status = status;
  }

  return request;
}