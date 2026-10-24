import { Stack, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  const pathname = usePathname();
  const inKiosk = pathname?.startsWith("/kiosk") ?? false;

  return (
    <>
      {/* oxlint-disable-next-line react/style-prop-object */}
      <StatusBar style="light" hidden={inKiosk} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="pairing" />
        <Stack.Screen name="kiosk" options={{ gestureEnabled: false }} />
      </Stack>
    </>
  );
}
