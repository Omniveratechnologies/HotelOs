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
    setLoading(true);
    setError(null);
    try {
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
    const code =
      sessionStorage.getItem("kiosk_handoff_code") ||
      (typeof window !== "undefined"
        ? (window as any).kiosk?.handoffCode
        : null);

    if (code) {
      await performKioskExchange(code);
    } else {
      // Re-query current profile to see if status updated
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
    }
  }, [performKioskExchange]);

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
      if (code) {
        sessionStorage.setItem("kiosk_handoff_code", code);
      }

      // Clean query param from URL without triggering reload
      if (handoffCodeFromUrl) {
        const cleanUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, cleanUrl);
      }

      if (code) {
        // oxlint-disable-next-line react/set-state-in-effect
        performKioskExchange(code);
      } else {
        setLoading(false);
      }
    }
  }, [performKioskExchange]);

  // Socket listener for real-time check-in, check-out, and status updates
  useEffect(() => {
    const socket = connectGuestSocket({
      onKioskGuestCheckedIn: () => {
        if (isKiosk) {
          refreshKioskSession();
        }
      },
      onKioskGuestCheckedOut: () => {
        if (isKiosk) {
          // In-room tablet auto-logout on check-out
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
