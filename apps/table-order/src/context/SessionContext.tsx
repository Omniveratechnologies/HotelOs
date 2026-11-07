import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { isKioskEnvironment, SESSION_STORAGE_KEYS } from "@hotelos/utils";
import {
  api,
  ApiError,
  setApiClientCoordinates,
  setApiSessionCredentials,
  type SessionData,
} from "../services/api";

export type LocationStatus =
  | "IDLE"
  | "PROMPTING"
  | "ACQUIRING"
  | "VERIFIED"
  | "DENIED"
  | "INACCURATE"
  | "OUTSIDE_RADIUS"
  | "ERROR";

interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

interface SessionContextType {
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

const SessionContext = createContext<SessionContextType | null>(null);

export function SessionProvider({
  hotelId,
  tableId,
  children,
}: {
  hotelId: string;
  tableId: string;
  children: ReactNode;
}) {
  const isKiosk = isKioskEnvironment();
  const storageKey = SESSION_STORAGE_KEYS.getSessionKey(hotelId, tableId);

  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [sessionType, setSessionType] = useState<"QR_GUEST" | "KIOSK" | null>(
    isKiosk ? "KIOSK" : "QR_GUEST",
  );
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("IDLE");
  const [locationError, setLocationError] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [promptLocationModal, setPromptLocationModal] = useState(false);

  // Apply credentials to the global API fetch client whenever session changes
  const applyCredentials = useCallback(
    (
      token: string | null,
      csrf: string | null = null,
      type?: "QR_GUEST" | "KIOSK" | null,
    ) => {
      setSessionToken(token);
      setApiSessionCredentials(token, csrf);
      const effectiveType =
        type !== undefined
          ? type
          : sessionType || (isKiosk ? "KIOSK" : "QR_GUEST");
      if (type !== undefined) {
        setSessionType(type);
      }
      if (token) {
        const payload = JSON.stringify({
          token,
          csrfToken: csrf,
          sessionType: effectiveType,
          hotelId,
          tableId,
        });
        try {
          window.localStorage.setItem(storageKey, payload);
          window.sessionStorage.setItem(storageKey, payload);
          if (effectiveType === "KIOSK" || isKiosk) {
            window.localStorage.setItem(
              SESSION_STORAGE_KEYS.KIOSK_CURRENT,
              payload,
            );
            window.sessionStorage.setItem(
              SESSION_STORAGE_KEYS.KIOSK_CURRENT,
              payload,
            );
          }
        } catch {
          // ignore storage quota errors
        }
      } else {
        try {
          window.localStorage.removeItem(storageKey);
          window.sessionStorage.removeItem(storageKey);
          if (isKiosk || sessionType === "KIOSK") {
            window.localStorage.removeItem(SESSION_STORAGE_KEYS.KIOSK_CURRENT);
            window.sessionStorage.removeItem(
              SESSION_STORAGE_KEYS.KIOSK_CURRENT,
            );
          }
        } catch {
          // ignore storage errors
        }
      }
    },
    [storageKey, sessionType, isKiosk, hotelId, tableId],
  );

  const clearSession = useCallback(
    (reason?: string) => {
      applyCredentials(null, null);
      setCoordinates(null);
      setApiClientCoordinates(null);
      if (reason) {
        setSessionError(reason);
      }
    },
    [applyCredentials],
  );

  // 1. Initial Mount: Check for Kiosk Handoff Code in URL, bridge, or existing storage
  useEffect(() => {
    let isMounted = true;

    async function initializeSession() {
      // A. Check if URL or window.kiosk bridge contains a single-use kiosk handoff code
      const urlParams = new URLSearchParams(window.location.search);
      const handoffCode =
        urlParams.get("kioskHandoffCode") || window.kiosk?.handoffCode;

      if (handoffCode) {
        try {
          // Remove handoff code from URL address bar immediately for security
          if (urlParams.has("kioskHandoffCode")) {
            urlParams.delete("kioskHandoffCode");
            const newSearch = urlParams.toString();
            const cleanPath = `${window.location.pathname}${newSearch ? `?${newSearch}` : ""}${window.location.hash}`;
            window.history.replaceState({}, document.title, cleanPath);
          }

          const result: SessionData =
            await api.exchangeKioskHandoff(handoffCode);
          // Persist immediately before any unmount checks so tokens are never discarded
          applyCredentials(result.token, result.csrfToken, "KIOSK");
          if (!isMounted) return;

          setIsSessionReady(true);
          return;
        } catch (err: any) {
          console.warn(
            "[SessionProvider] Kiosk handoff exchange failed:",
            err?.message,
          );
        }
      }

      // B. Check storage (localStorage & sessionStorage) for an existing active session
      try {
        const stored =
          window.localStorage.getItem(storageKey) ||
          window.sessionStorage.getItem(storageKey) ||
          (isKiosk
            ? window.localStorage.getItem(SESSION_STORAGE_KEYS.KIOSK_CURRENT) ||
              window.sessionStorage.getItem(SESSION_STORAGE_KEYS.KIOSK_CURRENT)
            : null);

        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.token) {
            const detectedType =
              parsed.sessionType || (isKiosk ? "KIOSK" : "QR_GUEST");
            applyCredentials(parsed.token, parsed.csrfToken, detectedType);

            // Validate with server
            api
              .validateSession()
              .then(() => {
                if (isMounted) setIsSessionReady(true);
              })
              .catch((err: any) => {
                if (!isMounted) return;
                console.info(
                  "[SessionProvider] Stored session invalid or expired:",
                  err.message,
                );
                clearSession(
                  err.code === "TABLE_SESSION_INVALIDATED"
                    ? "This table was reset by staff. Please re-scan QR."
                    : undefined,
                );
                setIsSessionReady(true);
              });
            return;
          }
        }
      } catch {
        // storage read error fallback
      }

      if (isMounted) {
        setIsSessionReady(true);
      }
    }

    initializeSession();

    return () => {
      isMounted = false;
    };
  }, [storageKey, isKiosk, applyCredentials, clearSession]);

  /**
   * Prompts and reads fresh high-accuracy GPS coordinates from the browser Geolocation API.
   */
  const acquireFreshCoordinates = useCallback((): Promise<Coordinates> => {
    setLocationStatus("ACQUIRING");
    setLocationError(null);

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const err = "Geolocation is not supported by your browser";
        setLocationStatus("ERROR");
        setLocationError(err);
        return reject(new Error(err));
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: Coordinates = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          };
          setCoordinates(coords);
          setApiClientCoordinates(coords);
          setLocationStatus("VERIFIED");
          resolve(coords);
        },
        (error) => {
          let msg = "Unable to retrieve your location";
          let status: LocationStatus = "ERROR";

          if (error.code === error.PERMISSION_DENIED) {
            msg =
              "Location permission was denied. Please allow location access to order at this table.";
            status = "DENIED";
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            msg = "Location unavailable. Please ensure GPS/Wi-Fi is enabled.";
            status = "ERROR";
          } else if (error.code === error.TIMEOUT) {
            msg = "Location acquisition timed out. Please try again.";
            status = "ERROR";
          }

          setLocationStatus(status);
          setLocationError(msg);
          reject(new Error(msg));
        },
        {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 5000,
        },
      );
    });
  }, []);

  /**
   * Guarantees that an active, verified session is established before invoking a protected endpoint.
   * If running in Kiosk mode, skips geolocation.
   * If in QR Guest mode, acquires GPS coordinates and establishes or verifies the session.
   */
  const ensureAuthenticatedSession = useCallback(async (): Promise<string> => {
    // A. Kiosk mode: verified through kiosk device identity, no GPS needed
    if (isKiosk || sessionType === "KIOSK") {
      if (sessionToken) {
        return sessionToken;
      }

      // Self-healing fallback 1: Check localStorage and sessionStorage for valid session
      try {
        const stored =
          window.localStorage.getItem(storageKey) ||
          window.sessionStorage.getItem(storageKey) ||
          window.localStorage.getItem(SESSION_STORAGE_KEYS.KIOSK_CURRENT) ||
          window.sessionStorage.getItem(SESSION_STORAGE_KEYS.KIOSK_CURRENT);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.token) {
            applyCredentials(parsed.token, parsed.csrfToken, "KIOSK");
            return parsed.token;
          }
        }
      } catch {
        // ignore storage parse errors
      }

      // Self-healing fallback 2: Check window.kiosk?.handoffCode or URL search for pending exchange
      const pendingCode =
        window.kiosk?.handoffCode ||
        new URLSearchParams(window.location.search).get("kioskHandoffCode");
      if (pendingCode) {
        try {
          const result = await api.exchangeKioskHandoff(pendingCode);
          applyCredentials(result.token, result.csrfToken, "KIOSK");
          return result.token;
        } catch (err: any) {
          console.warn(
            "[SessionProvider] Fallback handoff exchange failed:",
            err?.message,
          );
        }
      }

      throw new Error(
        "Kiosk terminal session is not authenticated. Please restart the terminal or contact staff.",
      );
    }

    // B. QR Guest mode:
    // If we already have a session, fetch fresh coordinates for the request header and return
    if (sessionToken) {
      try {
        await acquireFreshCoordinates();
        return sessionToken;
      } catch (err: any) {
        // If location is denied or unavailable on subsequent request, notify caller
        throw err;
      }
    }

    // No session exists yet: acquire GPS coordinates first
    let freshCoords: Coordinates;
    try {
      freshCoords = await acquireFreshCoordinates();
    } catch (err: any) {
      setPromptLocationModal(true);
      throw err;
    }

    // Exchange coordinates for a verified QR session
    try {
      const result = await api.createQrGuestSession({
        hotelId,
        tableId,
        latitude: freshCoords.latitude,
        longitude: freshCoords.longitude,
        accuracy: freshCoords.accuracy,
      });

      applyCredentials(result.token, result.csrfToken);
      setPromptLocationModal(false);
      setSessionError(null);
      return result.token;
    } catch (error: any) {
      if (error instanceof ApiError) {
        if (error.code === "LOCATION_OUTSIDE_RADIUS") {
          setLocationStatus("OUTSIDE_RADIUS");
          setLocationError(error.message);
        } else if (error.code === "LOCATION_INACCURATE") {
          setLocationStatus("INACCURATE");
          setLocationError(error.message);
        } else {
          setSessionError(error.message);
        }
      } else {
        setSessionError(error.message);
      }
      setPromptLocationModal(true);
      throw error;
    }
  }, [
    isKiosk,
    sessionType,
    sessionToken,
    storageKey,
    acquireFreshCoordinates,
    hotelId,
    tableId,
    applyCredentials,
  ]);

  return (
    <SessionContext.Provider
      value={{
        sessionToken,
        sessionType,
        isKiosk,
        isSessionReady,
        locationStatus,
        locationError,
        sessionError,
        coordinates,
        ensureAuthenticatedSession,
        clearSession,
        promptLocationModal,
        setPromptLocationModal,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
