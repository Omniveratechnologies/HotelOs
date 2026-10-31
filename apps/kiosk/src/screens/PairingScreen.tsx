import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Application from "expo-application";
import { getDeviceId } from "@modules/kiosk-manager";
import { kioskApi } from "@/services/kioskApi";
import { kioskStorage, serverUrlStorage } from "@/lib/storage";

const DEFAULT_SERVER_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:5001";

type Status = "idle" | "pairing" | "success" | "error";

export function PairingScreen() {
  const router = useRouter();

  const [deviceId, setDeviceId] = useState<string>("Detecting…");
  const [serverUrl, setServerUrl] = useState<string>(DEFAULT_SERVER_URL);
  const [pairingCode, setPairingCode] = useState<string>("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pairedTerminalName, setPairedTerminalName] = useState<string>("");

  useEffect(() => {
    (async () => {
      const [id, savedUrl] = await Promise.all([
        getDeviceId(),
        serverUrlStorage.get(),
      ]);
      setDeviceId(id);
      if (savedUrl) setServerUrl(savedUrl);
    })();
  }, []);

  const handlePair = async () => {
    if (!pairingCode.trim()) {
      setErrorMessage("Please enter the 6-character pairing code");
      return;
    }
    if (!serverUrl.trim()) {
      setErrorMessage("Please enter the HotelOS server URL");
      return;
    }

    setStatus("pairing");
    setErrorMessage(null);

    try {
      const cleanCode = pairingCode.trim().toUpperCase();
      const cleanUrl = serverUrl.trim();
      const currentDeviceId = await getDeviceId();

      const response = await kioskApi.pairDevice(cleanUrl, {
        pairCode: cleanCode,
        deviceId: currentDeviceId,
        appVersion: Application.nativeApplicationVersion || "1.0.0",
      });

      if (response.success && response.data) {
        const { token, kiosk } = response.data;

        await kioskStorage.setAuth({
          token,
          serverUrl: cleanUrl,
          kioskId: kiosk.id,
          deviceId: kiosk.deviceId,
          kioskName: kiosk.name,
          hotelId: kiosk.hotelId,
          hotelName: kiosk.hotelName,
          targetDashboard: kiosk.targetDashboard,
          assignedUrl: kiosk.assignedUrl,
          pairedAt: new Date().toISOString(),
        });

        setPairedTerminalName(kiosk.name);
        setStatus("success");
      } else {
        setStatus("error");
        setErrorMessage(response.message || "Pairing failed. Try again.");
      }
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Could not connect to server. Check URL and pairing code.",
      );
    }
  };

  useEffect(() => {
    if (status === "success") {
      const timeout = setTimeout(() => router.replace("/kiosk"), 1200);
      return () => clearTimeout(timeout);
    }
  }, [status, router]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardContainer}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.heading}>HotelOS Kiosk Terminal Setup</Text>
          <Text style={styles.subheading}>
            Perform a one-time physical setup. Enter the server address and the
            6-digit pairing code from the Super Admin dashboard.
          </Text>

          {/* Hardware Device ID */}
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Hardware Device ID:</Text>
            <Text style={styles.infoValue}>{deviceId}</Text>
          </View>

          {/* Server URL Input */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>HotelOS Server URL</Text>
            <TextInput
              style={styles.input}
              value={serverUrl}
              onChangeText={setServerUrl}
              placeholder="e.g. http://192.168.1.50:5001 or http://10.0.2.2:5001"
              placeholderTextColor="#64748B"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Pairing Code Input */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>6-Digit Pairing Code</Text>
            <TextInput
              style={[styles.input, styles.codeInput]}
              value={pairingCode}
              onChangeText={(val) => setPairingCode(val.toUpperCase())}
              placeholder="e.g. 592813"
              placeholderTextColor="#64748B"
              maxLength={6}
              autoCapitalize="characters"
              autoCorrect={false}
            />
          </View>

          {status === "error" && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {status === "success" ? (
            <View style={styles.successBox}>
              <ActivityIndicator color="#4ADE80" />
              <Text style={styles.successText}>
                Paired as "{pairedTerminalName}"! Opening kiosk…
              </Text>
            </View>
          ) : (
            <Pressable
              style={[
                styles.button,
                status === "pairing" && styles.buttonDisabled,
              ]}
              onPress={handlePair}
              disabled={status === "pairing"}
            >
              {status === "pairing" ? (
                <View style={styles.row}>
                  <ActivityIndicator color="#0F172A" />
                  <Text style={styles.buttonText}>Connecting & Pairing…</Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>Pair & Activate Terminal</Text>
              )}
            </Pressable>
          )}

          <Pressable onPress={() => router.back()} style={styles.cancelLink}>
            <Text style={styles.linkText}>Back to Device Info</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  container: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#1E293B",
    borderRadius: 20,
    padding: 32,
    width: "100%",
    maxWidth: 520,
    gap: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  heading: {
    color: "#F8FAFC",
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
  },
  subheading: {
    color: "#94A3B8",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
  infoBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(15,23,42,0.6)",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(56,189,248,0.2)",
  },
  infoLabel: { color: "#94A3B8", fontSize: 13 },
  infoValue: {
    color: "#38BDF8",
    fontFamily: Platform.OS === "android" ? "monospace" : "Courier",
    fontWeight: "700",
    fontSize: 14,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    color: "#CBD5E1",
    fontSize: 13,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#0F172A",
    borderWidth: 1.5,
    borderColor: "#334155",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#F8FAFC",
    fontSize: 15,
  },
  codeInput: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 6,
    textAlign: "center",
    borderColor: "#38BDF8",
  },
  button: {
    backgroundColor: "#38BDF8",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: "#0F172A",
    fontWeight: "800",
    fontSize: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  successBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "rgba(74,222,128,0.1)",
    borderWidth: 1,
    borderColor: "#4ADE80",
    borderRadius: 12,
    padding: 14,
  },
  successText: {
    color: "#4ADE80",
    fontWeight: "700",
    fontSize: 14,
  },
  errorBox: {
    backgroundColor: "rgba(248,113,113,0.1)",
    borderWidth: 1,
    borderColor: "#F87171",
    borderRadius: 12,
    padding: 12,
  },
  errorText: {
    color: "#F87171",
    fontSize: 13,
    textAlign: "center",
  },
  cancelLink: {
    alignItems: "center",
    marginTop: 4,
  },
  linkText: {
    color: "#64748B",
    fontSize: 13,
    textDecorationLine: "underline",
  },
});
