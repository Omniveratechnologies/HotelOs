export interface FileRef {
  key: string;
  filename: string;
  mimeType: string;
  size: number;
  url?: string;
  previewUrl?: string;
}

export interface BookingSummary {
  _id?: string;
  reservationNo?: string;
  checkIn?: string;
  checkOut?: string;
  nights?: number;
  adults?: number;
  children?: number;
  status?: string;
  roomId?: {
    _id?: string;
    roomNumber?: string;
    type?: string;
    roomCode?: string;
  };
  ratePlanId?: {
    name?: string;
    mealPlan?: string;
  };
}

export interface GuestSummary {
  name?: string;
  email?: string;
  phone?: string;
  nationality?: string;
}

export interface StepData {
  guestName?: string;
  email?: string;
  phone?: string;
  nationality?: string;
  idType?: string;
  idNumber?: string;
  idFront?: FileRef | null;
  idBack?: FileRef | null;
  selfie?: FileRef | null;
  signature?: FileRef | null;
  termsAcceptedAt?: string | null;
  preferences?: string[];
  remarks?: string;
}

export interface CheckInSessionData {
  id?: string;
  token?: string;
  status?: string;
  currentStep?: number;
  expiresAt?: string;
  booking?: BookingSummary;
  guest?: GuestSummary;
  stepData?: StepData;
  correctionMessage?: string;
}

export interface LookupResponse {
  reservationId: string;
  maskedEmail: string;
}

export interface VerifyOtpResponse {
  token: string;
  session: CheckInSessionData;
}
