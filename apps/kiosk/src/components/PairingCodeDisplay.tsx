import { StyleSheet, Text, View } from "react-native";

interface Props {
  code: string;
}

const SLOTS = [
  "slot-0",
  "slot-1",
  "slot-2",
  "slot-3",
  "slot-4",
  "slot-5",
  "slot-6",
  "slot-7",
];

/** Large, spaced-out rendering of the 6-character pairing code. */
export function PairingCodeDisplay({ code }: Props) {
  const chars = code.split("");
  return (
    <View style={styles.container}>
      {chars.map((char, index) => {
        const slotKey = SLOTS[index] || `char-slot-${index}`;
        return (
          <View key={slotKey} style={styles.charBox}>
            <Text style={styles.char}>{char}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: "row", gap: 10 },
  charBox: {
    width: 48,
    height: 60,
    borderRadius: 10,
    backgroundColor: "#1E293B",
    borderWidth: 2,
    borderColor: "#38BDF8",
    alignItems: "center",
    justifyContent: "center",
  },
  char: { color: "#F8FAFC", fontSize: 28, fontWeight: "800" },
});
