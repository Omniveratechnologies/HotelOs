const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5001";


// =====================================================
// GET HOTEL MEMBERS
// =====================================================

export const fetchMembers = async () => {
  const token =
    localStorage.getItem("auth_token");

  if (!token) {
    throw new Error("You are not logged in");
  }

  const response = await fetch(
    `${API_URL}/api/v1/members`,
    {
      method: "GET",

      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message || "Failed to load members"
    );
  }

  return result.data || [];
};


// =====================================================
// DELETE / DEACTIVATE MEMBER
// =====================================================

export const deleteMember = async (memberId) => {
  const token =
    localStorage.getItem("auth_token");

  if (!token) {
    throw new Error("You are not logged in");
  }

  const response = await fetch(
    `${API_URL}/api/v1/members/${memberId}`,
    {
      method: "DELETE",

      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message || "Failed to delete member"
    );
  }

  return result;
};