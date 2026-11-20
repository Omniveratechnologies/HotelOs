import { createContext, useContext } from "react";

export type LocationStatus =
  | "IDLE"
  | "PROMPTING"
  | "ACQUIRING"
  | "VERIFIED"
  | "DENIED"
  | "INACCURATE"
  | "OUTSIDE_RADIUS"
  | "ERROR";

export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface SessionContextType {
  sessionToken: string | null;
  sessionType: "QR_GUEST" | "KIOSK" | null;
  isKiosk: boolean;
  isSessionReady: boolean;
  locationStatus: LocationStatus;
  locationError: string | null;
  sessionError: string | null;
  coordinates: Coordinates | null;
  ensureAuthenticatedSession: () => Promise<string>;
  clearSession: (reason?: string) => void;
  promptLocationModal: boolean;
  setPromptLocationModal: (open: boolean) => void;
}

export const SessionContext = createContext<SessionContextType | null>(null);

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
