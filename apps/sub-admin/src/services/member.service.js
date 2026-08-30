import { api } from "@hotelos/api";

// =====================================================
// GET HOTEL MEMBERS (Receptionists of the Sub Admin's hotel)
// =====================================================

export const fetchMembers = async () => {
  const result = await api.get("/api/v1/users", {
    auth: true,
    query: { role: "RECEPTIONIST" },
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

  const result = await api.delete(`/api/v1/users/${memberId}`, { auth: true });

  return result;
};
