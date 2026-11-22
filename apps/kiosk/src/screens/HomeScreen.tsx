import { useCallback, useEffect, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { DeviceInfoCard } from "@/components/DeviceInfoCard";
import { useDeviceInfo } from "@/hooks/useDeviceInfo";
import { kioskStorage } from "@/lib/storage";
import { kioskUnlockState } from "@/lib/kioskUnlockState";
import { KioskAuthData } from "@/types";

/**
 * Home Screen
 * Displays device info, pairing status, server URL, and controls
 * to enter the Kiosk WebView or setup/reset pairing.
 *
 * ONLY shown when Super Admin remotely dispatches 'device:exit-kiosk'.
 */
export function HomeScreen() {
  const router = useRouter();
  const deviceInfo = useDeviceInfo();
  const [auth, setAuth] = useState<KioskAuthData | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const loadAuth = useCallback(async () => {
    setCheckingAuth(true);
    const data = await kioskStorage.getAuth();
    setAuth(data);
    setCheckingAuth(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAuth();
  }, [loadAuth]);

  useFocusEffect(
    useCallback(() => {
      loadAuth();
    }, [loadAuth]),
  );

  const handleEnterKiosk = () => {
    kioskUnlockState.setUnlocked(false);
    if (auth?.token && auth?.assignedUrl) {
      router.replace("/kiosk");
    } else {
      router.push("/pairing");
    }
  };

  const handleUnpair = () => {
    Alert.alert(
      "Unpair Terminal",
      "Are you sure you want to unpair this terminal from the server? You will need a new pairing code from Super Admin to re-pair.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unpair",
          style: "destructive",
          onPress: async () => {
            await kioskStorage.clearAuth();
            kioskUnlockState.setUnlocked(false);
            router.replace("/pairing");
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>HotelOS Kiosk</Text>
      <Text style={styles.subheading}>
        Standalone Android Touchscreen Terminal • Device Owner Provisioned
      </Text>

      <DeviceInfoCard info={deviceInfo} auth={auth} />

      {checkingAuth ? (
        <ActivityIndicator style={{ marginTop: 24 }} color="#38BDF8" />
      ) : (
        <View style={styles.actionsContainer}>
          <Pressable style={styles.button} onPress={handleEnterKiosk}>
            <Text style={styles.buttonText}>
              {auth?.token ? "Enter Kiosk Mode" : "Pair This Device"}
            </Text>
          </Pressable>

          {auth?.token && (
            <Pressable style={styles.secondaryButton} onPress={handleUnpair}>
              <Text style={styles.secondaryButtonText}>
                Unpair / Reset Terminal
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 20,
  },
  heading: { color: "#F8FAFC", fontSize: 28, fontWeight: "800" },
  subheading: {
    color: "#94A3B8",
    fontSize: 14,
    textAlign: "center",
    maxWidth: 460,
  },
  actionsContainer: {
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },
  button: {
    backgroundColor: "#38BDF8",
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 12,
    minWidth: 220,
    alignItems: "center",
  },
  buttonText: { color: "#0F172A", fontWeight: "800", fontSize: 16 },
  secondaryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    color: "#F87171",
    fontSize: 13,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
