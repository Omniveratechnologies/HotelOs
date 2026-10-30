import { useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { HomeScreen } from "@/screens/HomeScreen";
import { kioskStorage } from "@/lib/storage";
import { kioskUnlockState } from "@/lib/kioskUnlockState";
import { consumeLaunchedFromBoot } from "@modules/kiosk-manager";

export default function Index() {
  const router = useRouter();
  const params = useLocalSearchParams<{ unlocked?: string }>();
  const isUnlocked =
    params.unlocked === "true" || kioskUnlockState.isUnlocked();

  if (params.unlocked === "true" && !kioskUnlockState.isUnlocked()) {
    kioskUnlockState.setUnlocked(true);
  }

  useEffect(() => {
    if (isUnlocked) return;

    let isMounted = true;

    (async () => {
      // Consume any native Android boot flag so it doesn't linger
      try {
        await consumeLaunchedFromBoot();
      } catch {
        // Native module may not be available in Expo Go or non-Android
      }

      const paired = await kioskStorage.isPaired();
      if (!isMounted) return;

      if (paired) {
        // Direct launch to dashboard on restart / reboot
        router.replace("/kiosk");
      } else {
        // Unpaired terminal -> send directly to pairing setup
        router.replace("/pairing");
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [isUnlocked, router]);

  // Terminal Info and technician controls are ONLY rendered when explicitly unlocked by Super Admin
  if (isUnlocked) {
    return <HomeScreen />;
  }

  // Dark loading splash screen: Terminal Info is NEVER visible or flashed on restart
  return (
    <View style={styles.splash}>
      <ActivityIndicator size="large" color="#38BDF8" />
    </View>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
  },
});
