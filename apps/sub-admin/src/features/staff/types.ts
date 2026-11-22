export type SubAdminRole = "RECEPTIONIST" | "KITCHEN";
export type StaffRoleFilter = "ALL" | "RECEPTIONIST" | "KITCHEN";
export type StaffStatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

export interface SubAdminStaff {
  id?: string;
  _id?: string;
  name: string;
  username: string;
  email: string;
  role: SubAdminRole | string;
  hotelId?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface StaffStats {
  total: number;
  receptionists: number;
  kitchen: number;
  active: number;
}

export interface CreateStaffPayload {
  name: string;
  role: SubAdminRole | string;
  username: string;
  password: string;
  email: string;
  isActive: boolean;
}

export interface UpdateStaffPayload {
  name: string;
  role: SubAdminRole | string;
  email: string;
  password?: string;
  isActive: boolean;
}
