export interface FileRef {
  key?: string;
  filename?: string;
  mimeType?: string;
  size?: number;
  url?: string;
  previewUrl?: string;
  file?: File;
  isUploading?: boolean;
  error?: string;
}

export interface BookingSummary {
  _id?: string;
  reservationNo?: string;
  bookingNumber?: string;
  checkIn?: string;
  checkOut?: string;
  nights?: number;
  adults?: number;
  children?: number;
  guests?: {
    adults?: number;
    children?: number;
    infants?: number;
  };
  status?: string;
  roomType?: string;
  roomNumber?: string | null;
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

export interface IdDocumentItem {
  id?: string;
  idType: string;
  idNumber: string;
  front: FileRef | null;
  back?: FileRef | null;
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
  dateOfBirth?: string;
  documents?: IdDocumentItem[];
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
  rejectionMessage?: string;
  review?: { message?: string; decision?: string };
  submittedAt?: string;
}

export interface LookupResponse {
  reservationId: string;
  maskedEmail: string;
}

export interface VerifyOtpResponse {
  token: string;
  session: CheckInSessionData;
}
