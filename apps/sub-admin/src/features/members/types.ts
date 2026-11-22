export type SubAdminRole = "RECEPTIONIST" | "KITCHEN";
export type MemberRoleFilter = "ALL" | "RECEPTIONIST" | "KITCHEN";
export type MemberStatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

export interface SubAdminMember {
  id?: string;
  _id?: string;
  name: string;
  username: string;
  email?: string;
  role: SubAdminRole | string;
  hotelId?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface MemberStats {
  total: number;
  receptionists: number;
  kitchen: number;
  active: number;
}

export interface CreateMemberPayload {
  name: string;
  role: SubAdminRole | string;
  username: string;
  password: string;
  email?: string;
  isActive: boolean;
}

export interface UpdateMemberPayload {
  name: string;
  role: SubAdminRole | string;
  email?: string;
  password?: string;
  isActive: boolean;
}
