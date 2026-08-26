import { apiFetch } from "../utils/apiFetch.js";

// =====================================================
// GET HOTEL MEMBERS
// =====================================================

export const fetchMembers = async () => {
  const result = await apiFetch(
    "/api/v1/members",
    {
      method: "GET",

      auth: true,
    }
  );

  return result.data || [];
};

// =====================================================
// DELETE / DEACTIVATE MEMBER
// =====================================================

export const deleteMember = async (memberId) => {
  if (!memberId) {
    throw new Error(
      "Member id is required."
    );
  }

  const result = await apiFetch(
    `/api/v1/members/${memberId}`,
    {
      method: "DELETE",

      auth: true,
    }
  );

  return result;
};
