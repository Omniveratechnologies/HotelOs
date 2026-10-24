import { StyleSheet, Text, View } from "react-native";
import { DeviceInfo } from "@/hooks/useDeviceInfo";
import { KioskAuthData } from "@/types";

interface Props {
  info: DeviceInfo;
  auth: KioskAuthData | null;
}

/** Read-only card showing device id, platform/app version, and pairing status. */
export function DeviceInfoCard({ info, auth }: Props) {
  const isPaired = Boolean(auth?.token);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Terminal Information</Text>

      <Row
        label="Device ID"
        value={
          info.loading ? "Detecting…" : auth?.deviceId || info.deviceId || "—"
        }
      />
      <Row label="Platform" value={`${info.platform} (OS ${info.osVersion})`} />
      <Row label="App Version" value={info.appVersion} />
      <Row
        label="Pairing Status"
        value={isPaired ? "Paired & Managed" : "Not Paired (Awaiting Setup)"}
        valueStyle={isPaired ? styles.statusOk : styles.statusWarn}
      />

      {isPaired && auth && (
        <>
          <View style={styles.divider} />
          {auth.hotelName && (
            <Row label="Assigned Hotel" value={auth.hotelName} />
          )}
          {auth.kioskName && (
            <Row label="Terminal Name" value={auth.kioskName} />
          )}
          <Row
            label="Dashboard Mode"
            value={auth.targetDashboard || "DEMO_URL"}
          />
          <Row label="Server" value={auth.serverUrl} />
        </>
      )}
    </View>
  );
}

function Row({
  label,
  value,
  valueStyle,
}: {
  label: string;
  value: string;
  valueStyle?: object;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, valueStyle]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 20,
    gap: 12,
    width: "100%",
    maxWidth: 500,
  },
  title: {
    color: "#F8FAFC",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: { color: "#94A3B8", fontSize: 13 },
  value: { color: "#E2E8F0", fontSize: 13, fontWeight: "600", maxWidth: "60%" },
  statusOk: { color: "#4ADE80" },
  statusWarn: { color: "#FBBF24" },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginVertical: 4,
  },
});
