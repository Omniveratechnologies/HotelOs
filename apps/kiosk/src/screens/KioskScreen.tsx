import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  AppState,
  BackHandler,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import WebView, { WebViewNavigation } from "react-native-webview";
import type { ShouldStartLoadRequest } from "react-native-webview/lib/WebViewTypes";
import { useHeartbeat } from "@/hooks/useHeartbeat";
import { useKioskMode } from "@/hooks/useKioskMode";
import { useSocketCommands } from "@/hooks/useSocketCommands";
import { heartbeatService } from "@/services/heartbeatService";
import { socketService } from "@/services/socketService";
import { kioskApi } from "@/services/kioskApi";
import { kioskStorage } from "@/lib/storage";
import { isSameSiteUrl, isSameOrInitialUrl } from "@/lib/urlSecurity";
import { KioskAuthData } from "@/types";

export function KioskScreen() {
  const router = useRouter();
  const webviewRef = useRef<WebView>(null);
  const kiosk = useKioskMode();

  const [auth, setAuth] = useState<KioskAuthData | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [terminalStatus, setTerminalStatus] = useState<
    "ONLINE" | "MAINTENANCE" | "DISABLED"
  >("ONLINE");
  const [canGoBack, setCanGoBack] = useState(false);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const storedAuth = await kioskStorage.getAuth();
      if (!storedAuth?.token || !storedAuth?.serverUrl) {
        // Not paired yet — go to setup screen
        router.replace("/pairing");
        return;
      }
      setAuth(storedAuth);
      setUrl(
        storedAuth.assignedUrl || "https://demo.hotelos.com/kiosk-showcase",
      );

      // Auto-sync status immediately on mount
      kioskApi
        .getStatus(storedAuth.serverUrl, storedAuth.token)
        .then((res) => {
          if (res?.data?.status) {
            setTerminalStatus(res.data.status);
          }
          if (res?.data?.assignedUrl) {
            setUrl(res.data.assignedUrl);
          }
        })
        .catch((err) => {
          console.warn("[KioskScreen] Initial status fetch:", err?.message);
        });
    })();
  }, [router]);

  // Enter kiosk Lock Task Mode once mounted; exit on unmount
  useEffect(() => {
    kiosk.enter();
    return () => {
      kiosk.exit();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useHeartbeat(true);

  // Sync config received from periodic heartbeat responses
  useEffect(() => {
    const unsub = heartbeatService.onConfigSync((config) => {
      if (!config) return;
      if (config.assignedUrl && config.assignedUrl !== url) {
        console.log(
          "[KioskScreen] Syncing new URL from heartbeat:",
          config.assignedUrl,
        );
        setUrl(config.assignedUrl);
      }
      if (config.status && config.status !== terminalStatus) {
        console.log(
          "[KioskScreen] Syncing new status from heartbeat:",
          config.status,
        );
        setTerminalStatus(
          config.status as "ONLINE" | "MAINTENANCE" | "DISABLED",
        );
      }
    });
    return unsub;
  }, [url, terminalStatus]);

  // Auto-sync whenever socket reconnects or connection is restored
  useEffect(() => {
    const unsub = socketService.onSync(() => {
      console.log(
        "[KioskScreen] Socket reconnected: pulsing heartbeat & syncing status",
      );
      heartbeatService.pulse();
      if (auth?.serverUrl && auth?.token) {
        kioskApi
          .getStatus(auth.serverUrl, auth.token)
          .then((res) => {
            if (res?.data?.status) setTerminalStatus(res.data.status);
            if (res?.data?.assignedUrl && res.data.assignedUrl !== url)
              setUrl(res.data.assignedUrl);
          })
          .catch(() => {});
      }
    });
    return unsub;
  }, [auth, url]);

  // Auto-sync whenever the app returns to the foreground (wakes up or unlocks)
  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        console.log(
          "[KioskScreen] App active in foreground: pulsing heartbeat",
        );
        heartbeatService.pulse();
      }
    });
    return () => sub.remove();
  }, []);

  const handleReload = useCallback(() => {
    webviewRef.current?.reload();
  }, []);

  const handleNavigate = useCallback(
    async (payload: {
      url: string;
      targetDashboard?: string;
      hotelId?: string;
    }) => {
      if (payload?.url) {
        console.log(
          "[KioskScreen] Remote navigate push received:",
          payload.url,
        );
        setUrl(payload.url);
        await kioskStorage.updateAssignedConfig(
          payload.url,
          payload.targetDashboard,
          payload.hotelId,
        );
      }
    },
    [],
  );

  const handleRestart = useCallback(async () => {
    await kiosk.exit();
    webviewRef.current?.reload();
    await kiosk.enter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleExit = useCallback(async () => {
    await kiosk.exit();
    router.replace("/");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const handleConfigUpdated = useCallback(
    (payload: {
      status?: "ONLINE" | "MAINTENANCE" | "DISABLED";
      assignedUrl?: string;
    }) => {
      if (payload?.status) {
        console.log(
          "[KioskScreen] WebSocket status update received:",
          payload.status,
        );
        setTerminalStatus(payload.status);
      }
      if (payload?.assignedUrl && payload.assignedUrl !== url) {
        setUrl(payload.assignedUrl);
      }
    },
    [url],
  );

  useSocketCommands(
    auth?.serverUrl ?? null,
    auth?.token ?? null,
    auth?.deviceId ?? null,
    Boolean(auth?.token),
    {
      onReload: handleReload,
      onNavigate: handleNavigate,
      onRestart: handleRestart,
      onExitKiosk: handleExit,
      onConfigUpdated: handleConfigUpdated,
    },
  );

  // Handle Android hardware/gesture back button:
  // - Navigates backward through WebView history as long as it has not reached the initial server URL
  // - Once at the server-set URL, swallows the back button to keep user on the kiosk dashboard
  useEffect(() => {
    const onBackPress = () => {
      if (canGoBack && webviewRef.current) {
        const isAtRoot =
          Boolean(currentUrl) &&
          Boolean(url) &&
          isSameOrInitialUrl(currentUrl, url);

        if (!isAtRoot) {
          webviewRef.current.goBack();
          return true; // Navigated back inside WebView history
        }
      }

      // At root server-assigned URL or history exhausted:
      // Swallow back press so the app stays in the kiosk view
      return true;
    };

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress,
    );

    return () => subscription.remove();
  }, [canGoBack, currentUrl, url]);

  const handleShouldStartLoad = useCallback(
    (request: ShouldStartLoadRequest): boolean => {
      const target = request.url;
      if (target.startsWith("about:")) return true;

      // Enforce strict same-site boundary: do not redirect or navigate to another site in any chance
      if (!url || !isSameSiteUrl(target, url)) {
        console.warn(
          `[KioskWebView] Blocked navigation outside same-site boundary: ${target} (Server URL: ${url})`,
        );
        return false;
      }

      return true;
    },
    [url],
  );

  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    setLoading(navState.loading);
    setCanGoBack(navState.canGoBack);
    setCurrentUrl(navState.url);
  };

  if (!url) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#38BDF8" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webviewRef}
        source={{ uri: url }}
        style={styles.webview}
        onNavigationStateChange={handleNavigationStateChange}
        onShouldStartLoadWithRequest={handleShouldStartLoad}
        setSupportMultipleWindows={false}
        javaScriptCanOpenWindowsAutomatically={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        originWhitelist={["*"]}
        mixedContentMode="always"
        webviewDebuggingEnabled={true}
        onLoadStart={(e) => {
          console.log("[KioskWebView] Loading:", e.nativeEvent.url);
        }}
        onLoadEnd={(e) => {
          console.log("[KioskWebView] Loaded:", e.nativeEvent.url);
        }}
        onError={(e) => {
          console.error(
            "[KioskWebView] Error:",
            e.nativeEvent.description,
            e.nativeEvent.url,
          );
          setError(e.nativeEvent.description);
        }}
        onHttpError={(e) => {
          console.error(
            "[KioskWebView] HTTP Error:",
            e.nativeEvent.statusCode,
            e.nativeEvent.url,
          );
          setError(`HTTP ${e.nativeEvent.statusCode} loading page`);
        }}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.centered}>
            <ActivityIndicator color="#38BDF8" size="large" />
            <Text style={styles.loadingText}>Loading HotelOS Terminal…</Text>
          </View>
        )}
      />

      {loading && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator color="#38BDF8" />
        </View>
      )}

      {error && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorTitle}>
            Couldn't load terminal dashboard
          </Text>
          <Text style={styles.errorUrl}>{url}</Text>
          <Text style={styles.errorDetail}>{error}</Text>
          <Pressable
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              webviewRef.current?.reload();
            }}
          >
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      )}

      {/* Full-screen Guest-Friendly Maintenance Notice */}
      {terminalStatus === "MAINTENANCE" && (
        <View style={styles.fullScreenNotice}>
          <View style={styles.noticeCard}>
            <View style={styles.iconCircleAmber}>
              <Text style={styles.iconGlyph}>🛠️</Text>
            </View>

            <Text style={styles.hotelBrand}>
              {auth?.hotelName
                ? auth.hotelName.toUpperCase()
                : "HOTELOS GUEST SERVICES"}
            </Text>

            <Text style={styles.noticeHeading}>Terminal Under Maintenance</Text>

            <Text style={styles.noticeBody}>
              We are currently servicing and updating this kiosk to ensure the
              best experience for our guests.
            </Text>

            <View style={styles.deskBox}>
              <Text style={styles.deskTitle}>Front Desk Reception</Text>
              <Text style={styles.deskBody}>
                Please visit the front desk concierge for express check-in,
                keycards, dining orders, and all guest inquiries.
              </Text>
            </View>

            <View style={styles.liveSyncBar}>
              <View style={styles.liveDotAmber} />
              <Text style={styles.liveSyncText}>
                Live sync active • Will resume automatically
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Full-screen Guest-Friendly Disabled / Standby Notice */}
      {terminalStatus === "DISABLED" && (
        <View style={styles.fullScreenNotice}>
          <View style={styles.noticeCard}>
            <View style={styles.iconCircleSlate}>
              <Text style={styles.iconGlyph}>🛡️</Text>
            </View>

            <Text style={styles.hotelBrand}>
              {auth?.hotelName
                ? auth.hotelName.toUpperCase()
                : "HOTELOS GUEST SERVICES"}
            </Text>

            <Text style={styles.noticeHeading}>
              Terminal Temporarily Unavailable
            </Text>

            <Text style={styles.noticeBody}>
              This self-service terminal is currently in standby mode or
              reserved for scheduled maintenance.
            </Text>

            <View style={styles.deskBox}>
              <Text style={styles.deskTitle}>Guest Assistance Available</Text>
              <Text style={styles.deskBody}>
                Our front desk team is ready to welcome you and assist with all
                check-in and hotel services.
              </Text>
            </View>

            <View style={styles.liveSyncBar}>
              <View style={styles.liveDotSlate} />
              <Text style={styles.liveSyncText}>
                Standby mode • Terminal monitoring active
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  webview: { flex: 1 },
  centered: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0F172A",
    gap: 12,
  },
  loadingText: { color: "#94A3B8" },
  loadingOverlay: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(15,23,42,0.6)",
    borderRadius: 20,
    padding: 8,
  },
  errorOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 16,
  },
  errorTitle: { color: "#F87171", fontSize: 18, fontWeight: "700" },
  errorUrl: {
    color: "#38BDF8",
    fontSize: 12,
    fontFamily: "monospace",
    textAlign: "center",
  },
  errorDetail: { color: "#94A3B8", textAlign: "center" },
  retryButton: {
    backgroundColor: "#38BDF8",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  retryText: { color: "#0F172A", fontWeight: "700" },
  fullScreenNotice: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#0B1120",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    zIndex: 9999,
  },
  noticeCard: {
    maxWidth: 560,
    width: "100%",
    backgroundColor: "#0F172A",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#1E293B",
    padding: 32,
    alignItems: "center",
    gap: 14,
  },
  iconCircleAmber: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircleSlate: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(148, 163, 184, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconGlyph: {
    fontSize: 26,
  },
  hotelBrand: {
    color: "#38BDF8",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2,
    textAlign: "center",
  },
  noticeHeading: {
    color: "#F8FAFC",
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
  },
  noticeBody: {
    color: "#94A3B8",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  deskBox: {
    width: "100%",
    backgroundColor: "rgba(30, 41, 59, 0.7)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(51, 65, 85, 0.8)",
    padding: 14,
    gap: 4,
  },
  deskTitle: {
    color: "#F1F5F9",
    fontSize: 13,
    fontWeight: "700",
  },
  deskBody: {
    color: "#94A3B8",
    fontSize: 12,
    lineHeight: 17,
  },
  liveSyncBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  liveDotAmber: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#F59E0B",
  },
  liveDotSlate: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#94A3B8",
  },
  liveSyncText: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "600",
  },
});
