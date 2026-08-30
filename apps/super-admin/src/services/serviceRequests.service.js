import { mockServiceRequests } from "../data/mockData.js";

// =====================================================
// SERVICE REQUESTS
//
// Still using mock data.
// Do not connect to backend yet.
// =====================================================

export async function fetchServiceRequests() {
  return [...mockServiceRequests];
}

export async function updateServiceRequestStatus(requestId, status) {
  const request = mockServiceRequests.find((item) => item.id === requestId);

  if (request) {
    request.status = status;
  }

  return request;
}
