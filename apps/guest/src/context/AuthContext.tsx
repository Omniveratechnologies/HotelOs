import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AuthContext } from "./auth-context";
import {
  login as loginApi,
  logout as logoutApi,
  exchangeKioskHandoff,
  fetchKioskRoomStatus,
  type LoginResponse,
} from "@/services/authApi";
import { connectGuestSocket, disconnectGuestSocket } from "@/services/socket";

export type AuthUser = LoginResponse["user"];

export interface KioskInfo {
  kioskId: string;
  deviceId: string;
  roomId?: string | null;
  roomNumber?: string | null;
  roomType?: string | null;
  hotelName?: string | null;
}

export type AuthState = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isKiosk: boolean;
  kioskIdle: boolean;
  kioskInfo: KioskInfo | null;
  bookingStatus: string;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshKioskSession: () => Promise<void>;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window === "undefined") return null;
    const initialUser = localStorage.getItem("auth_user");
    if (initialUser) {
      try {
        return JSON.parse(initialUser);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [token, setToken] = useState<string | null>(() =>
    typeof window === "undefined" ? null : localStorage.getItem("auth_token"),
  );

  const [isKiosk] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const urlParams = new URLSearchParams(window.location.search);
    return (
      urlParams.has("kioskHandoffCode") ||
      Boolean((window as any).kiosk?.isKiosk) ||
      sessionStorage.getItem("is_kiosk_terminal") === "true"
    );
  });

  const [kioskIdle, setKioskIdle] = useState<boolean>(false);
  const [kioskInfo, setKioskInfo] = useState<KioskInfo | null>(() => {
    if (typeof window === "undefined") return null;
    const stored = sessionStorage.getItem("kiosk_info");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [bookingStatus, setBookingStatus] = useState<string>(() => {
    if (typeof window === "undefined") return "none";
    const initialUser = localStorage.getItem("auth_user");
    if (initialUser) {
      try {
        return JSON.parse(initialUser).bookingStatus || "checked-in";
      } catch {
        return "none";
      }
    }
    return "none";
  });

  const [loading, setLoading] = useState<boolean>(() => isKiosk);
  const [error, setError] = useState<string | null>(null);

  const performKioskExchange = useCallback(async (codeToExchange: string) => {
    // Prevent sending an already-consumed single-use handoff code
    if (sessionStorage.getItem("consumed_handoff_code") === codeToExchange) {
      console.log(
        "[AuthContext] Skipping already-consumed handoff code:",
        codeToExchange,
      );
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Mark code as consumed in session storage immediately before network transit
      sessionStorage.setItem("consumed_handoff_code", codeToExchange);
      sessionStorage.removeItem("kiosk_handoff_code");

      const res = await exchangeKioskHandoff(codeToExchange);

      const kInfo: KioskInfo = {
        kioskId: res.kioskId,
        deviceId: res.deviceId,
        roomId: res.roomId,
        roomNumber: res.roomNumber,
        roomType: res.roomType,
        hotelName: res.hotelName,
      };
      setKioskInfo(kInfo);
      sessionStorage.setItem("kiosk_info", JSON.stringify(kInfo));

      if (res.standbyToken) {
        // Persist kiosk standby token so Socket.IO can authenticate and listen to room events
        sessionStorage.setItem("kiosk_standby_token", res.standbyToken);
      }

      if (res.activeStay && res.guestToken && res.user) {
        const u = {
          ...res.user,
          hotelName: res.hotelName,
          bookingStatus: "checked-in",
          reservationNo: res.reservationNo,
        };
        localStorage.setItem("auth_token", res.guestToken);
        localStorage.setItem("auth_user", JSON.stringify(u));
        setToken(res.guestToken);
        setUser(u);
        setBookingStatus("checked-in");
        setKioskIdle(false);
      } else {
        // Room is vacant or guest has not checked-in yet -> Standby Mode
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        setToken(null);
        setUser(null);
        setBookingStatus("none");
        setKioskIdle(true);
      }
    } catch (err: any) {
      console.warn(
        "[AuthContext] Kiosk handoff exchange fallback:",
        err?.message,
      );
      sessionStorage.removeItem("kiosk_handoff_code");

      // If code exchange failed or expired, check if we already have a valid session stored
      const storedToken = localStorage.getItem("auth_token");
      const storedUser = localStorage.getItem("auth_user");
      if (storedToken && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
          setKioskIdle(false);
        } catch {
          setKioskIdle(true);
        }
      } else {
        setKioskIdle(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshKioskSession = useCallback(async () => {
    // In kiosk mode: Idempotently query room stay status via standbyToken
    // Never re-exchange single-use handoff codes which causes 401 Unauthorized errors.
    if (isKiosk) {
      const standbyToken = sessionStorage.getItem("kiosk_standby_token");
      if (standbyToken) {
        try {
          const status = await fetchKioskRoomStatus(standbyToken);
          if (status.activeStay && status.guestToken && status.user) {
            const u = {
              ...status.user,
              hotelName: kioskInfo?.hotelName,
              bookingStatus: "checked-in",
              reservationNo: status.reservationNo || undefined,
            };
            localStorage.setItem("auth_token", status.guestToken);
            localStorage.setItem("auth_user", JSON.stringify(u));
            setToken(status.guestToken);
            setUser(u);
            setBookingStatus("checked-in");
            setKioskIdle(false);
            return;
          } else {
            setKioskIdle(true);
          }
        } catch (err: any) {
          console.warn(
            "[AuthContext] Kiosk room status check fallback:",
            err?.message,
          );
        }
      }
      return;
    }

    // Personal mobile device: re-query current profile
    const storedToken = localStorage.getItem("auth_token");
    if (storedToken) {
      try {
        const profile = await fetch("/api/v1/guests/me", {
          headers: { Authorization: `Bearer ${storedToken}` },
        }).then((r) => r.json());
        if (profile?.data?.bookingStatus) {
          setBookingStatus(profile.data.bookingStatus);
        }
      } catch {
        // ignore
      }
    }
  }, [isKiosk, kioskInfo]);

  // Handle Kiosk Initial Mount & Query Param Handoff
  // oxlint-disable-next-line react/set-state-in-effect -- intentionally exchange initial handoff code on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const urlParams = new URLSearchParams(window.location.search);
    const handoffCodeFromUrl = urlParams.get("kioskHandoffCode");
    const handoffCodeFromBridge = (window as any).kiosk?.handoffCode;
    const isBridgeKiosk = Boolean((window as any).kiosk?.isKiosk);

    const code = handoffCodeFromUrl || handoffCodeFromBridge;

    if (code || isBridgeKiosk) {
      sessionStorage.setItem("is_kiosk_terminal", "true");

      // Clean query param from URL without triggering reload
      if (handoffCodeFromUrl) {
        const cleanUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, cleanUrl);
      }

      // Check if this handoff code was already exchanged/consumed
      const alreadyConsumed =
        Boolean(code) &&
        sessionStorage.getItem("consumed_handoff_code") === code;

      if (code && !alreadyConsumed) {
        // oxlint-disable-next-line react/set-state-in-effect
        performKioskExchange(code);
      } else {
        setLoading(false);
        // If code was already exchanged previously and we have a standby token,
        // verify if guest checked in while offline or reloaded
        const standbyToken = sessionStorage.getItem("kiosk_standby_token");
        const hasUser = Boolean(localStorage.getItem("auth_user"));
        if (standbyToken && !hasUser) {
          refreshKioskSession();
        }
      }
    }
  }, [performKioskExchange, refreshKioskSession]);

  // Socket listener for real-time check-in, check-out, and status updates
  useEffect(() => {
    const socket = connectGuestSocket({
      // Auto-login in-room kiosk tablet immediately when front desk completes check-in
      onKioskGuestCheckedIn: (payload: any) => {
        if (isKiosk) {
          if (payload?.guestToken && payload?.user) {
            const u = {
              ...payload.user,
              bookingStatus: "checked-in",
              reservationNo: payload.booking?.reservationNo,
              roomId: payload.roomId,
            };
            localStorage.setItem("auth_token", payload.guestToken);
            localStorage.setItem("auth_user", JSON.stringify(u));
            setToken(payload.guestToken);
            setUser(u);
            setBookingStatus("checked-in");
            setKioskIdle(false);
          } else {
            refreshKioskSession();
          }
        }
      },
      onKioskGuestCheckedOut: () => {
        if (isKiosk) {
          // In-room tablet auto-logout on check-out: immediately purge guest tokens and return to standby screen
          localStorage.removeItem("auth_token");
          localStorage.removeItem("auth_user");
          setToken(null);
          setUser(null);
          setKioskIdle(true);
          setBookingStatus("none");
        }
      },
      onStayStatusUpdated: (data) => {
        if (data?.status) {
          setBookingStatus(data.status);
          if (data.status === "checked-out" && isKiosk) {
            localStorage.removeItem("auth_token");
            localStorage.removeItem("auth_user");
            setToken(null);
            setUser(null);
            setKioskIdle(true);
          } else if (data.status === "checked-in" && isKiosk) {
            refreshKioskSession();
          }
        }
      },
    });

    return () => {
      disconnectGuestSocket(socket);
    };
  }, [isKiosk, refreshKioskSession]);

  const login = async (username: string, password: string) => {
    setError(null);
    try {
      const result = await loginApi(username, password);
      if (result.user.role !== "GUEST") {
        throw new Error("This login is for guests only");
      }
      localStorage.setItem("auth_token", result.token);
      localStorage.setItem("auth_user", JSON.stringify(result.user));
      setToken(result.token);
      setUser(result.user);
      setBookingStatus(result.user.bookingStatus || "checked-in");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      throw err;
    }
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch {
      // ignore network errors on logout
    }
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setToken(null);
    setUser(null);
    setBookingStatus("none");
    if (isKiosk) {
      setKioskIdle(true);
    }
  };

  const value = useMemo<AuthState>(
    () => ({
      user,
      token,
      loading,
      error,
      isKiosk,
      kioskIdle,
      kioskInfo,
      bookingStatus,
      login,
      logout,
      refreshKioskSession,
    }),
    [
      user,
      token,
      loading,
      error,
      isKiosk,
      kioskIdle,
      kioskInfo,
      bookingStatus,
      login,
      logout,
      refreshKioskSession,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
