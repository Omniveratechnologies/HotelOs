import { apiFetch } from "../utils/apiFetch.js";

// =====================================================
// GET HOTEL MEMBERS (Receptionists of the Sub Admin's hotel)
// =====================================================

export const fetchMembers = async () => {
  const result = await apiFetch("/api/v1/users?role=RECEPTIONIST", {
    method: "GET",

    auth: true,
  });

  return result.data || [];
};

// =====================================================
// DELETE MEMBER
// =====================================================

export const deleteMember = async (memberId) => {
  if (!memberId) {
    throw new Error("Member id is required.");
  }

  const result = await apiFetch(`/api/v1/users/${memberId}`, {
    method: "DELETE",

    auth: true,
  });

  return result;
};
