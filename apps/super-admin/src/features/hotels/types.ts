export type HotelStatus = "ACTIVE" | "INACTIVE" | string;

export interface Hotel {
  _id: string;
  name: string;
  hotelCode?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  currency?: string;
  gstin?: string;
  taxPercent?: number | null;
  checkInTime?: string;
  checkOutTime?: string;
  wifiNetworkName?: string;
  wifiPassword?: string;
  cancellationPolicy?: string;
  termsAndConditions?: string;
  subscriptionStartDate?: string | null;
  subscriptionEndDate?: string | null;
  aiosellHotelCode?: string;
  status: HotelStatus;
  createdAt?: string;
  updatedAt?: string;
}

export type StaffRole = "SUB_ADMIN" | "RECEPTIONIST" | "KITCHEN" | string;
export type StaffRoleFilter = "ALL" | "SUB_ADMIN" | "RECEPTIONIST" | "KITCHEN";
export type StaffStatusFilter = "ALL" | "ACTIVE" | "INACTIVE" | "DELETED";

export interface HotelStaffMember {
  id?: string;
  _id?: string;
  name: string;
  username: string;
  originalUsername?: string | null;
  email?: string;
  role: StaffRole;
  hotelId?: string | null;
  isActive: boolean;
  isDeleted?: boolean;
  deletedAt?: string | null;
  twoFactorEnabled?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface KioskDevice {
  id?: string;
  _id?: string;
  deviceId: string;
  name?: string;
  hotelId?:
    string | { _id: string; name: string; hotelCode?: string; city?: string };
  location?: string;
  targetDashboard?: string;
  status?: string;
  firmwareVersion?: string;
  isMaintenanceMode?: boolean;
  pairCode?: string;
  lastHeartbeat?: string | null;
  batteryLevel?: number | null;
  isCharging?: boolean;
  appVersion?: string;
  ipAddress?: string;
  isPaired?: boolean;
  assignedUrl?: string;
  tableId?: {
    _id: string;
    tableNumber: string;
    section?: string;
    seats?: number;
    status?: string;
  } | null;
  roomId?: {
    _id: string;
    roomNumber: string;
    type?: string;
    floor?: string;
    status?: string;
  } | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface KioskStats {
  total: number;
  online: number;
  offline: number;
  maintenance: number;
  disabled: number;
}

export interface KioskDashboardPreset {
  id: string;
  name: string;
  description: string;
  url: string;
}

export interface KioskTable {
  id?: string;
  _id?: string;
  tableNumber: string;
  section?: string;
  seats?: number;
  capacity?: number;
  status?: string;
}

export interface KioskRoom {
  id?: string;
  _id?: string;
  roomNumber: string;
  type?: string;
  floor?: string | number;
  status?: string;
}

export interface CreateKioskModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (kiosk: KioskDevice) => void;
  defaultHotelId?: string;
}

export interface EditKioskModalProps {
  open: boolean;
  kiosk: KioskDevice | null;
  onClose: () => void;
  onUpdated?: (kiosk: KioskDevice) => void;
}

export interface KioskFilters {
  hotelId?: string;
  status?: string;
  q?: string;
}

export type HotelEditSection =
  "identity" | "contact" | "tax" | "operations" | "policies" | "subscription";

export type HotelDetailsTab = "staff" | "profile" | "subscription" | "kiosks";
